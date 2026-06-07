#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function runCommand(command, args, options = {}) {
  const { cwd = process.cwd(), timeout = 60000, silent = false } = options;
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    shell: false
  });
  return {
    ok: result.status === 0,
    code: result.status,
    durationMs: Date.now() - started,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim().slice(0, 5000)
  };
}

function checkDockerAvailable() {
  const result = runCommand("docker", ["--version"], { silent: true });
  return result.ok;
}

function checkDockerComposeFile(projectDir) {
  return fs.existsSync(path.join(projectDir, "docker-compose.yml")) ||
         fs.existsSync(path.join(projectDir, "docker-compose.yaml"));
}

function getDockerComposeFile(projectDir) {
  if (fs.existsSync(path.join(projectDir, "docker-compose.yml"))) {
    return "docker-compose.yml";
  }
  if (fs.existsSync(path.join(projectDir, "docker-compose.yaml"))) {
    return "docker-compose.yaml";
  }
  return null;
}

function buildImages(projectDir) {
  console.log("Building Docker images...");
  const result = runCommand("docker", ["compose", "build"], { cwd: projectDir, timeout: 300000 });
  return result.ok;
}

function startServices(projectDir) {
  console.log("Starting Docker services...");
  const result = runCommand("docker", ["compose", "up", "-d"], { cwd: projectDir, timeout: 120000 });
  return result.ok;
}

function stopServices(projectDir) {
  console.log("Stopping Docker services...");
  runCommand("docker", ["compose", "down"], { cwd: projectDir, timeout: 30000 });
}

function getRunningContainers(projectDir) {
  const result = runCommand("docker", ["compose", "ps", "--format", "json"], { cwd: projectDir });
  if (!result.ok) return [];
  try {
    return JSON.parse(`[${result.output.split('\n').filter(l => l.trim()).join(',')}]`);
  } catch {
    return [];
  }
}

function checkContainerHealth(projectDir, timeout = 60) {
  let attempts = 0;
  const maxAttempts = timeout / 2;
  
  while (attempts < maxAttempts) {
    const containers = getRunningContainers(projectDir);
    const allRunning = containers.length > 0 && containers.every(c => c.State === "running");
    
    if (allRunning) {
      return { ok: true, containers };
    }
    
    attempts++;
    console.log(`Waiting for containers to start... (${attempts}/${maxAttempts})`);
    // Sleep 2 seconds
    const now = Date.now();
    while (Date.now() - now < 2000) { /* spin wait */ }
  }
  
  return { ok: false, containers: getRunningContainers(projectDir) };
}

function getLogs(projectDir) {
  const result = runCommand("docker", ["compose", "logs"], { cwd: projectDir });
  return result.output;
}

function testBackendAPI(port) {
  const http = require("http");
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/todos`, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, code: res.statusCode });
      res.resume();
    });
    req.on("error", () => resolve({ ok: false, code: 0 }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, code: 0 });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(args["project-dir"] || "");
  const resultsFile = path.resolve(args["results-file"] || "");

  if (!projectDir || !fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    console.error("Generated project directory does not exist.");
    process.exit(2);
  }
  if (!resultsFile) {
    console.error("Results file path is required.");
    process.exit(2);
  }

  const results = {
    docker: { passed: 0, failed: 0, tests: [] },
    deployment: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] }
  };

  function addTest(category, name, passed, details = "") {
    results[category].tests.push({
      name,
      status: passed ? "passed" : "failed",
      details
    });
    results[category][passed ? "passed" : "failed"] += 1;
  }

  // Check Docker prerequisites
  const hasDocker = checkDockerAvailable();
  addTest("docker", "Docker is installed", hasDocker);
  
  const hasCompose = checkDockerComposeFile(projectDir);
  addTest("docker", "docker-compose.yml exists", hasCompose);

  if (!hasDocker || !hasCompose) {
    const output = {
      metadata: {
        model: args.model || null,
        provider: args.provider || null,
        level: args.level || null,
        backend: args.backend || null,
        frontend: args.frontend || null,
        timestamp: new Date().toISOString(),
        evaluation_version: "2.0",
        evaluation_type: "docker",
        metrics_requested: "docker-deployment"
      },
      quality: {
        overall_score: 0,
        tier: "Cannot Evaluate",
        pass_rate: 0,
        test_count: results.docker.passed + results.docker.failed,
        passed: results.docker.passed,
        failed: results.docker.failed,
        scores: { docker: 0, deployment: 0, integration: 0 }
      },
      test_details: results,
      status: "FAILED"
    };
    fs.writeFileSync(resultsFile, JSON.stringify(output, null, 2));
    process.exit(1);
  }

  try {
    // Build images
    const buildOk = buildImages(projectDir);
    addTest("docker", "Docker images build successfully", buildOk);

    if (!buildOk) {
      console.log("Docker build failed, cannot proceed with deployment test");
      const output = {
        metadata: {
          model: args.model || null,
          provider: args.provider || null,
          level: args.level || null,
          backend: args.backend || null,
          frontend: args.frontend || null,
          timestamp: new Date().toISOString(),
          evaluation_version: "2.0",
          evaluation_type: "docker",
          metrics_requested: "docker-deployment"
        },
        quality: {
          overall_score: 0,
          tier: "Build Failed",
          pass_rate: 0,
          test_count: results.docker.passed + results.docker.failed,
          passed: results.docker.passed,
          failed: results.docker.failed,
          scores: { docker: 0, deployment: 0, integration: 0 }
        },
        test_details: results,
        status: "FAILED"
      };
      fs.writeFileSync(resultsFile, JSON.stringify(output, null, 2));
      process.exit(1);
    }

    // Start services
    const startOk = startServices(projectDir);
    addTest("deployment", "docker-compose up succeeds", startOk);

    // Check container health
    const healthCheck = checkContainerHealth(projectDir);
    addTest("deployment", "All containers are running", healthCheck.ok, `${healthCheck.containers.length} containers`);

    // Test API endpoint
    const apiTest = await testBackendAPI(8080);
    addTest("integration", "Backend API responds", apiTest.ok, `HTTP ${apiTest.code}`);

    // Check logs for errors
    const logs = getLogs(projectDir);
    const hasErrors = /error|exception|failed/i.test(logs);
    addTest("integration", "No error messages in logs", !hasErrors, hasErrors ? "Found error patterns in logs" : "");

    // Calculate scores
    const dockerScore = Math.round((results.docker.passed / (results.docker.passed + results.docker.failed)) * 100) || 0;
    const deploymentScore = Math.round((results.deployment.passed / (results.deployment.passed + results.deployment.failed)) * 100) || 0;
    const integrationScore = Math.round((results.integration.passed / (results.integration.passed + results.integration.failed)) * 100) || 0;

    const totalPassed = Object.values(results).reduce((sum, cat) => sum + cat.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, cat) => sum + cat.failed, 0);
    const totalTests = totalPassed + totalFailed;

    const weights = { docker: 0.4, deployment: 0.4, integration: 0.2 };
    const overallScore = Math.round(
      dockerScore * weights.docker +
      deploymentScore * weights.deployment +
      integrationScore * weights.integration
    );

    const tier = overallScore === 100 ? "Production-Ready" : 
                 overallScore >= 80 ? "Deployable" :
                 overallScore >= 60 ? "Functional" : "Needs Work";

    const output = {
      metadata: {
        model: args.model || null,
        provider: args.provider || null,
        harness: args.harness || null,
        level: args.level || null,
        backend: args.backend || null,
        frontend: args.frontend || null,
        timestamp: new Date().toISOString(),
        evaluation_version: "2.0",
        evaluation_type: "docker",
        metrics_requested: "docker-deployment"
      },
      quality: {
        overall_score: overallScore,
        tier,
        pass_rate: totalTests > 0 ? totalPassed / totalTests : 0,
        test_count: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        scores: {
          docker: dockerScore,
          deployment: deploymentScore,
          integration: integrationScore
        }
      },
      test_details: results,
      strengths: results.docker.tests.concat(results.deployment.tests).concat(results.integration.tests)
        .filter(t => t.status === "passed").map(t => t.name),
      weaknesses: results.docker.tests.concat(results.deployment.tests).concat(results.integration.tests)
        .filter(t => t.status === "failed").map(t => t.name),
      status: "COMPLETED"
    };

    fs.writeFileSync(resultsFile, JSON.stringify(output, null, 2));
    console.log("\nEvaluation completed successfully");
    
  } finally {
    // Cleanup
    stopServices(projectDir);
  }
}

main().catch(err => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
