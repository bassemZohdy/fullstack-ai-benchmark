#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  describeSupportedLayout,
  normalizePath,
  resolveBackendRoot,
  resolveFrontendRoot,
  safeRecursiveRead
} = require("./utils/project-layout");

// Import cartridge evaluators
const springBootEval = require("./cartridges/backend/spring-boot.js");
const angularEval = require("./cartridges/frontend/angular.js");
const k8sEval = require("./phases/kubernetes-config.js");

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

function evaluateCartridgeStructure(projectDir, backend, frontend) {
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

  const backendTests = springBootEval.testSpringBootStructure(projectDir);
  const frontendTests = angularEval.testAngularStructure(projectDir);
  const allTests = [...backendTests, ...frontendTests];

  const passed = allTests.filter(t => t.status === "passed").length;
  const failed = allTests.filter(t => t.status === "failed").length;

  return {
    passed,
    failed,
    tests: allTests,
    breakdown: {
      backend: {
        passed: backendTests.filter(t => t.status === "passed").length,
        failed: backendTests.filter(t => t.status === "failed").length,
        tests: backendTests
      },
      frontend: {
        passed: frontendTests.filter(t => t.status === "passed").length,
        failed: frontendTests.filter(t => t.status === "failed").length,
        tests: frontendTests
      }
    }
  };
}

function evaluateCodeQuality(projectDir) {
  const tests = [];
  const backendDir = resolveBackendRoot(projectDir);
  const frontendDir = resolveFrontendRoot(projectDir);

  // Check README exists
  const hasReadme = fs.existsSync(path.join(projectDir, "README.md"));
  tests.push({
    name: "README.md documentation exists",
    status: hasReadme ? "passed" : "failed",
    details: hasReadme ? "" : "No README found"
  });

  // Check .env.example exists
  const hasEnvExample = fs.existsSync(path.join(projectDir, ".env.example"));
  tests.push({
    name: "Environment configuration example exists",
    status: hasEnvExample ? "passed" : "failed",
    details: hasEnvExample ? "" : "No .env.example found"
  });

  // Check git files
  const hasGitignore = fs.existsSync(path.join(projectDir, ".gitignore"));
  tests.push({
    name: ".gitignore present",
    status: hasGitignore ? "passed" : "failed",
    details: hasGitignore ? "" : "No .gitignore found"
  });

  // Check for organized directory structure
  const hasBackend = Boolean(backendDir);
  const hasFrontend = Boolean(frontendDir);
  const organized = hasBackend && hasFrontend;
  tests.push({
    name: "Supported backend/frontend layout detected",
    status: organized ? "passed" : "failed",
    details: organized ? "" : describeSupportedLayout()
  });

  // Check for Docker configuration
  const hasRootDockerfile = fs.existsSync(path.join(projectDir, "Dockerfile"));
  const hasBackendDockerfile = fs.existsSync(path.join(projectDir, "backend")) &&
                               fs.existsSync(path.join(projectDir, "backend", "Dockerfile"));
  const hasFrontendDockerfile = fs.existsSync(path.join(projectDir, "frontend")) &&
                                fs.existsSync(path.join(projectDir, "frontend", "Dockerfile"));
  const hasDocker = hasRootDockerfile || (hasBackendDockerfile && hasFrontendDockerfile);
  tests.push({
    name: "Docker configuration present",
    status: hasDocker ? "passed" : "failed",
    details: hasDocker ? "" : "Missing Dockerfile (need root Dockerfile or both backend/ and frontend/ Dockerfiles)"
  });

  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateDockerDeployment(projectDir) {
  const tests = [];

  // Check docker-compose.yml
  const hasCompose = fs.existsSync(path.join(projectDir, "docker-compose.yml")) ||
                     fs.existsSync(path.join(projectDir, "docker-compose.yaml"));
  tests.push({
    name: "docker-compose.yml exists",
    status: hasCompose ? "passed" : "failed",
    details: hasCompose ? "" : "Docker compose file not found"
  });

  // Check Dockerfiles
  const hasBackendDockerfile = fs.existsSync(path.join(projectDir, "backend", "Dockerfile"));
  tests.push({
    name: "Backend Dockerfile exists",
    status: hasBackendDockerfile ? "passed" : "failed",
    details: hasBackendDockerfile ? "" : "Backend Dockerfile not found"
  });

  const hasFrontendDockerfile = fs.existsSync(path.join(projectDir, "frontend", "Dockerfile"));
  tests.push({
    name: "Frontend Dockerfile exists",
    status: hasFrontendDockerfile ? "passed" : "failed",
    details: hasFrontendDockerfile ? "" : "Frontend Dockerfile not found"
  });

  // Try to build Docker images (with timeout)
  const buildResult = spawnSync("docker", ["compose", "build", "--dry-run"], {
    cwd: projectDir,
    encoding: "utf8",
    timeout: 60000,
    stdio: "pipe"
  });

  const buildOk = buildResult.status === 0;
  tests.push({
    name: "Docker images buildable",
    status: buildOk ? "passed" : "failed",
    details: buildOk ? "" : "Docker build check failed"
  });

  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateKubernetesConfig(projectDir) {
  const tests = k8sEval.testKubernetesConfiguration(projectDir);
  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateIntegration(projectDir) {
  const tests = [];

  // Check for API endpoints in backend
  const backendDir = resolveBackendRoot(projectDir);
  const frontendDir = resolveFrontendRoot(projectDir);

  if (!backendDir || !frontendDir) {
    return {
      passed: 0,
      failed: 1,
      tests: [{
        name: "Supported project layout detected",
        status: "failed",
        details: describeSupportedLayout()
      }]
    };
  }

  const hasControllers = safeRecursiveRead(backendDir).some(f =>
    /Controller\.java$/.test(normalizePath(f))
  );
  tests.push({
    name: "Backend API controllers defined",
    status: hasControllers ? "passed" : "failed",
    details: hasControllers ? "" : "No controllers found"
  });

  // Check for frontend services calling backend
  const hasServices = safeRecursiveRead(frontendDir).some(f =>
    /\.service\.ts$/.test(normalizePath(f))
  );
  tests.push({
    name: "Frontend API services configured",
    status: hasServices ? "passed" : "failed",
    details: hasServices ? "" : "No services found"
  });

  // Check for environment configuration
  const hasEnvironment = fs.existsSync(path.join(frontendDir, "src", "environments", "environment.ts"));
  tests.push({
    name: "Frontend environment configuration",
    status: hasEnvironment ? "passed" : "failed",
    details: hasEnvironment ? "" : "No environment config"
  });

  // Check docker-compose for port mappings
  const composeFile = fs.existsSync(path.join(projectDir, "docker-compose.yml"))
    ? path.join(projectDir, "docker-compose.yml")
    : null;

  let hasPorts = false;
  if (composeFile) {
    const composeContent = fs.readFileSync(composeFile, "utf8");
    hasPorts = /ports:|8080|3000|80/.test(composeContent);
  }

  tests.push({
    name: "Docker port mappings configured",
    status: hasPorts ? "passed" : "failed",
    details: hasPorts ? "" : "No port mappings in docker-compose"
  });

  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function evaluateE2EAndOther(projectDir) {
  const tests = [];

  // Check for test files in backend
  const backendDir = resolveBackendRoot(projectDir);
  const frontendDir = resolveFrontendRoot(projectDir);

  if (!backendDir || !frontendDir) {
    return {
      passed: 0,
      failed: 1,
      tests: [{
        name: "Supported project layout detected",
        status: "failed",
        details: describeSupportedLayout()
      }]
    };
  }

  // Check for test files in frontend (backend unit tests are already checked in
  // cartridge_structure via spring-boot.js — do not duplicate here)
  const hasFrontendTests = safeRecursiveRead(frontendDir).some(f =>
    /\.spec\.ts$/.test(normalizePath(f))
  );
  tests.push({
    name: "Frontend unit tests exist",
    status: hasFrontendTests ? "passed" : "failed",
    details: hasFrontendTests ? "" : "No test files found"
  });

  // Check for build configuration
  const hasBuildTools = fs.existsSync(path.join(backendDir, "pom.xml")) ||
                       fs.existsSync(path.join(frontendDir, "package.json"));
  tests.push({
    name: "Build tools configured",
    status: hasBuildTools ? "passed" : "failed",
    details: hasBuildTools ? "" : "No build configuration"
  });

  const passed = tests.filter(t => t.status === "passed").length;
  const failed = tests.filter(t => t.status === "failed").length;

  return { passed, failed, tests };
}

function calculateScores(results) {
  const SCORE_WEIGHTS = {
    cartridge: 0.20,
    codeQuality: 0.15,
    docker: 0.20,
    kubernetes: 0.15,
    integration: 0.20,
    e2e: 0.10
  };

  const getScore = (result) => {
    const total = result.passed + result.failed;
    return total > 0 ? Math.round((result.passed / total) * 100) : 0;
  };

  const cartridgeScore = getScore(results.cartridge);
  const codeQualityScore = getScore(results.codeQuality);
  const dockerScore = getScore(results.docker);
  const k8sScore = getScore(results.kubernetes);
  const integrationScore = getScore(results.integration);
  const e2eScore = getScore(results.e2e);

  // Weighted overall score
  const overallScore = Math.round(
    cartridgeScore * SCORE_WEIGHTS.cartridge +
    codeQualityScore * SCORE_WEIGHTS.codeQuality +
    dockerScore * SCORE_WEIGHTS.docker +
    k8sScore * SCORE_WEIGHTS.kubernetes +
    integrationScore * SCORE_WEIGHTS.integration +
    e2eScore * SCORE_WEIGHTS.e2e
  );

  return {
    overall: overallScore,
    cartridge: cartridgeScore,
    codeQuality: codeQualityScore,
    docker: dockerScore,
    kubernetes: k8sScore,
    integration: integrationScore,
    e2e: e2eScore
  };
}

function getTier(score) {
  const TIER_THRESHOLDS = {
    productionReady: 90,
    deployable: 75,
    functional: 60
  };

  if (score >= TIER_THRESHOLDS.productionReady) return "Production-Ready";
  if (score >= TIER_THRESHOLDS.deployable) return "Deployable";
  if (score >= TIER_THRESHOLDS.functional) return "Functional";
  return "Needs Work";
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

  console.log(`Evaluating project comprehensively...`);

  // Run all evaluations
  const results = {
    cartridge: evaluateCartridgeStructure(projectDir, backend, frontend),
    codeQuality: evaluateCodeQuality(projectDir),
    docker: evaluateDockerDeployment(projectDir),
    kubernetes: evaluateKubernetesConfig(projectDir),
    integration: evaluateIntegration(projectDir),
    e2e: evaluateE2EAndOther(projectDir)
  };

  // Calculate scores
  const scores = calculateScores(results);

  // Collect all tests
  const allTests = [
    ...results.cartridge.tests,
    ...results.codeQuality.tests,
    ...results.docker.tests,
    ...results.kubernetes.tests,
    ...results.integration.tests,
    ...results.e2e.tests
  ];

  const totalPassed = allTests.filter(t => t.status === "passed").length;
  const totalFailed = allTests.filter(t => t.status === "failed").length;
  const totalTests = totalPassed + totalFailed;

  // Build output
  const output = {
    metadata: {
      model: args.model || null,
      provider: args.provider || null,
      harness: args.harness || null,
      level: args.level || null,
      backend_cartridge: backend,
      frontend_cartridge: frontend,
      timestamp: new Date().toISOString(),
      evaluation_version: "4.0",
      evaluation_type: "comprehensive"
    },
    quality: {
      overall_score: scores.overall,
      tier: getTier(scores.overall),
      pass_rate: totalTests > 0 ? totalPassed / totalTests : 0,
      test_count: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      scores: {
        cartridge_structure: scores.cartridge,
        code_quality: scores.codeQuality,
        docker_deployment: scores.docker,
        kubernetes_config: scores.kubernetes,
        integration: scores.integration,
        e2e_and_other: scores.e2e
      }
    },
    test_details: {
      cartridge_structure: {
        passed: results.cartridge.passed,
        failed: results.cartridge.failed,
        score: scores.cartridge,
        weight_pct: 20,
        tests: results.cartridge.tests
      },
      code_quality: {
        passed: results.codeQuality.passed,
        failed: results.codeQuality.failed,
        score: scores.codeQuality,
        weight_pct: 15,
        tests: results.codeQuality.tests
      },
      docker_deployment: {
        passed: results.docker.passed,
        failed: results.docker.failed,
        score: scores.docker,
        weight_pct: 20,
        tests: results.docker.tests
      },
      kubernetes_config: {
        passed: results.kubernetes.passed,
        failed: results.kubernetes.failed,
        score: scores.kubernetes,
        weight_pct: 15,
        tests: results.kubernetes.tests
      },
      integration: {
        passed: results.integration.passed,
        failed: results.integration.failed,
        score: scores.integration,
        weight_pct: 20,
        tests: results.integration.tests
      },
      e2e_and_other: {
        passed: results.e2e.passed,
        failed: results.e2e.failed,
        score: scores.e2e,
        weight_pct: 10,
        tests: results.e2e.tests
      }
    },
    strengths: allTests
      .filter(t => t.status === "passed")
      .map(t => t.name),
    weaknesses: allTests
      .filter(t => t.status === "failed")
      .map(t => t.name),
    status: "COMPLETED"
  };

  fs.writeFileSync(resultsFile, JSON.stringify(output, null, 2));
  console.log("✅ Comprehensive evaluation completed");
}

main().catch(err => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
