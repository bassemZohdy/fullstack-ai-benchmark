#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const buildValidator = require("./helpers/build-validator");
const dockerRunner = require("./helpers/docker-runner");
const apiTester = require("./helpers/api-tester");
const frontendTester = require("./helpers/frontend-tester");

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

function log(phase, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${phase}] ${message}`);
}

async function runE2ETests(projectDir, backend, frontend, options = {}) {
  const results = {
    phases: {},
    status: "pending",
    startedAt: new Date().toISOString(),
    projectDir,
    backend,
    frontend
  };

  const timeout = options.timeout || 1800000; // 30 min default for entire E2E
  const buildTimeout = options.buildTimeout || 900000; // 15 min for builds
  const composeTimeout = options.composeTimeout || 120000; // 2 min for startup

  try {
    // Phase 1: Build validation
    log("BUILD", "Starting build validation");
    const buildResult = buildValidator.validate(projectDir, backend, frontend, {
      timeout: buildTimeout
    });
    results.phases.build = buildResult;
    log("BUILD", buildResult.status === "passed" ? "✅ Build passed" : "❌ Build failed");

    if (buildResult.status === "failed") {
      results.status = "build_failed";
      return results;
    }

    // Phase 2: Docker compose startup
    log("DOCKER", "Starting docker-compose");
    const dockerResult = await dockerRunner.startup(projectDir, {
      timeout: composeTimeout
    });
    results.phases.docker = dockerResult;
    log("DOCKER", dockerResult.status === "started" ? "✅ Containers started" : "❌ Startup failed");

    if (dockerResult.status === "failed") {
      results.status = "docker_failed";
      return results;
    }

    // Wait for services to be ready
    log("HEALTH", "Checking service health");
    const healthCheck = await dockerRunner.waitForHealth(projectDir, { timeout: 60000 });
    results.phases.health = healthCheck;
    log("HEALTH", healthCheck.ready ? "✅ Services ready" : "❌ Health check timeout");

    if (!healthCheck.ready) {
      results.status = "health_failed";
      return results;
    }

    // Phase 3: API testing
    log("API", "Testing API endpoints");
    const apiResult = await apiTester.test(projectDir, backend, {
      timeout: 30000
    });
    results.phases.api = apiResult;
    log("API", `✅ API tests: ${apiResult.passed}/${apiResult.total} passed`);

    // Phase 4: Frontend testing
    log("FRONTEND", "Testing frontend accessibility");
    const frontendResult = await frontendTester.test(projectDir, {
      timeout: 30000
    });
    results.phases.frontend = frontendResult;
    log("FRONTEND", `✅ Frontend: ${frontendResult.accessible ? "accessible" : "unreachable"}`);

    // Phase 5: Cleanup
    log("CLEANUP", "Stopping containers");
    const cleanupResult = await dockerRunner.shutdown(projectDir);
    results.phases.cleanup = cleanupResult;
    log("CLEANUP", "✅ Containers stopped");

    // Calculate overall status
    const allPassed =
      buildResult.status === "passed" &&
      dockerResult.status === "started" &&
      healthCheck.ready &&
      apiResult.passed === apiResult.total &&
      frontendResult.accessible;

    results.status = allPassed ? "passed" : "partial";
    results.finishedAt = new Date().toISOString();

    return results;
  } catch (err) {
    log("ERROR", `Unexpected error: ${err.message}`);
    results.status = "error";
    results.error = err.message;
    results.finishedAt = new Date().toISOString();

    // Try to cleanup on error
    try {
      await dockerRunner.shutdown(projectDir);
    } catch (cleanupErr) {
      log("CLEANUP", `Warning: Cleanup failed: ${cleanupErr.message}`);
    }

    return results;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(args["project-dir"] || "");
  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";
  const resultsFile = args["results-file"] ? path.resolve(args["results-file"]) : null;

  if (!projectDir || !fs.existsSync(projectDir)) {
    console.error("Error: Project directory does not exist");
    process.exit(1);
  }

  const results = await runE2ETests(projectDir, backend, frontend);

  // Output results
  console.log("\n" + "=".repeat(60));
  console.log("E2E TEST RESULTS");
  console.log("=".repeat(60));
  console.log(JSON.stringify(results, null, 2));

  // Save to file if requested
  if (resultsFile) {
    const dir = path.dirname(resultsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsFile}`);
  }

  // Exit with appropriate code
  process.exit(results.status === "passed" ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(2);
  });
}

module.exports = { runE2ETests };
