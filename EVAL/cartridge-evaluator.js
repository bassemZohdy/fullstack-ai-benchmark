#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Import cartridge evaluators
const springBootEval = require("./cartridges/backend/spring-boot.js");
const angularEval = require("./cartridges/frontend/angular.js");

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
  const { cwd = process.cwd(), timeout = 60000 } = options;
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

function evaluateFrontend(projectDir, backend, frontend) {
  if (frontend !== "angular") {
    return {
      passed: 0,
      failed: 1,
      tests: [{
        name: `${frontend} evaluation not implemented`,
        status: "failed",
        details: "Only Angular frontend is currently supported"
      }]
    };
  }

  const tests = angularEval.testAngularStructure(projectDir);
  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateBackend(projectDir, backend, frontend) {
  if (backend !== "spring-boot") {
    return {
      passed: 0,
      failed: 1,
      tests: [{
        name: `${backend} evaluation not implemented`,
        status: "failed",
        details: "Only Spring Boot backend is currently supported"
      }]
    };
  }

  const tests = springBootEval.testSpringBootStructure(projectDir);
  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateDockerIntegration(projectDir) {
  const tests = [];

  // Check docker-compose.yml exists
  const hasCompose = fs.existsSync(path.join(projectDir, "docker-compose.yml")) ||
                     fs.existsSync(path.join(projectDir, "docker-compose.yaml"));
  tests.push({
    name: "docker-compose.yml exists",
    status: hasCompose ? "passed" : "failed",
    details: hasCompose ? "" : "Docker compose file not found"
  });

  // Check Dockerfiles
  const hasBackendDockerfile = fs.existsSync(path.join(projectDir, "backend", "Dockerfile")) ||
                              fs.existsSync(path.join(projectDir, "Dockerfile"));
  tests.push({
    name: "Backend Dockerfile exists",
    status: hasBackendDockerfile ? "passed" : "failed",
    details: hasBackendDockerfile ? "" : "Backend Dockerfile not found"
  });

  const hasFrontendDockerfile = fs.existsSync(path.join(projectDir, "frontend", "Dockerfile")) ||
                               fs.existsSync(path.join(projectDir, "Dockerfile.frontend"));
  tests.push({
    name: "Frontend Dockerfile exists",
    status: hasFrontendDockerfile ? "passed" : "failed",
    details: hasFrontendDockerfile ? "" : "Frontend Dockerfile not found"
  });

  // Try to build Docker images
  const buildResult = runCommand("docker", ["compose", "build"], { cwd: projectDir, timeout: 300000 });
  tests.push({
    name: "Docker images build successfully",
    status: buildResult.ok ? "passed" : "failed",
    details: buildResult.ok ? "" : "Docker build failed"
  });

  // Try to start services
  if (buildResult.ok) {
    const upResult = runCommand("docker", ["compose", "up", "-d"], { cwd: projectDir, timeout: 120000 });
    tests.push({
      name: "docker-compose up succeeds",
      status: upResult.ok ? "passed" : "failed",
      details: upResult.ok ? "" : "Failed to start services"
    });

    // Cleanup
    runCommand("docker", ["compose", "down"], { cwd: projectDir, timeout: 30000 });
  } else {
    tests.push({
      name: "docker-compose up succeeds",
      status: "failed",
      details: "Skipped - build failed"
    });
  }

  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(args["project-dir"] || "");
  const resultsFile = path.resolve(args["results-file"] || "");

  if (!projectDir || !fs.existsSync(projectDir)) {
    console.error("Project directory does not exist");
    process.exit(2);
  }
  if (!resultsFile) {
    console.error("Results file path is required");
    process.exit(2);
  }

  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";

  console.log(`Evaluating ${backend} backend and ${frontend} frontend...`);

  // Run evaluations
  const backendResult = evaluateBackend(projectDir, backend, frontend);
  const frontendResult = evaluateFrontend(projectDir, backend, frontend);
  const dockerResult = evaluateDockerIntegration(projectDir);

  // Calculate scores
  const backendScore = backendResult.passed + backendResult.failed > 0
    ? Math.round((backendResult.passed / (backendResult.passed + backendResult.failed)) * 100)
    : 0;

  const frontendScore = frontendResult.passed + frontendResult.failed > 0
    ? Math.round((frontendResult.passed / (frontendResult.passed + frontendResult.failed)) * 100)
    : 0;

  const dockerScore = dockerResult.passed + dockerResult.failed > 0
    ? Math.round((dockerResult.passed / (dockerResult.passed + dockerResult.failed)) * 100)
    : 0;

  // Weighted overall score
  const weights = { backend: 0.35, frontend: 0.35, docker: 0.30 };
  const overallScore = Math.round(
    backendScore * weights.backend +
    frontendScore * weights.frontend +
    dockerScore * weights.docker
  );

  const tier = overallScore === 100 ? "Production-Ready" :
              overallScore >= 80 ? "Deployable" :
              overallScore >= 60 ? "Functional" : "Needs Work";

  const totalPassed = backendResult.passed + frontendResult.passed + dockerResult.passed;
  const totalFailed = backendResult.failed + frontendResult.failed + dockerResult.failed;
  const totalTests = totalPassed + totalFailed;

  const output = {
    metadata: {
      model: args.model || null,
      provider: args.provider || null,
      harness: args.harness || null,
      level: args.level || null,
      backend_cartridge: backend,
      frontend_cartridge: frontend,
      timestamp: new Date().toISOString(),
      evaluation_version: "3.0",
      evaluation_type: "cartridge-aware"
    },
    quality: {
      overall_score: overallScore,
      tier,
      pass_rate: totalTests > 0 ? totalPassed / totalTests : 0,
      test_count: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      scores: {
        backend: backendScore,
        frontend: frontendScore,
        docker: dockerScore
      }
    },
    test_details: {
      backend: backendResult,
      frontend: frontendResult,
      docker: dockerResult
    },
    strengths: [
      ...backendResult.tests.filter(t => t.status === "passed").map(t => t.name),
      ...frontendResult.tests.filter(t => t.status === "passed").map(t => t.name),
      ...dockerResult.tests.filter(t => t.status === "passed").map(t => t.name)
    ],
    weaknesses: [
      ...backendResult.tests.filter(t => t.status === "failed").map(t => t.name),
      ...frontendResult.tests.filter(t => t.status === "failed").map(t => t.name),
      ...dockerResult.tests.filter(t => t.status === "failed").map(t => t.name)
    ],
    status: "COMPLETED"
  };

  fs.writeFileSync(resultsFile, JSON.stringify(output, null, 2));
  console.log("✅ Evaluation completed");
}

main().catch(err => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
