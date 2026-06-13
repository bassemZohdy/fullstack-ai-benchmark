#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
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

  const buildTimeout = Number.isFinite(options.buildTimeout) ? options.buildTimeout : 900000;
  const composeTimeout = Number.isFinite(options.composeTimeout) ? options.composeTimeout : 120000;
  const healthTimeout = Number.isFinite(options.healthTimeout) ? options.healthTimeout : 120000;
  let dockerCleanupNeeded = false;

  try {
    log("BUILD", "Starting build validation");
    const buildResult = buildValidator.validate(projectDir, backend, frontend, {
      timeout: buildTimeout
    });
    results.phases.build = buildResult;
    log("BUILD", buildResult.status === "passed" ? "Build passed" : "Build failed");

    if (buildResult.status === "failed") {
      results.status = "build_failed";
      return results;
    }

    log("DOCKER", "Starting docker-compose");
    dockerCleanupNeeded = true;
    const dockerResult = await dockerRunner.startup(projectDir, {
      timeout: composeTimeout
    });
    results.phases.docker = dockerResult;
    log("DOCKER", dockerResult.status === "started" ? "Containers started" : "Startup failed");

    if (dockerResult.status === "failed") {
      results.status = "docker_failed";
      return results;
    }

    log("HEALTH", "Checking service health");
    const healthCheck = await dockerRunner.waitForHealth(projectDir, {
      timeout: healthTimeout,
      port: Number(process.env.BENCHMARK_API_PORT || 8080)
    });
    results.phases.health = healthCheck;
    log("HEALTH", healthCheck.ready ? "Services ready" : "Health check timeout");

    if (!healthCheck.ready) {
      results.status = "health_failed";
      return results;
    }

    log("API", "Testing API endpoints");
    const apiResult = await apiTester.test(projectDir, backend, {
      timeout: 30000
    });
    results.phases.api = apiResult;
    log("API", `API tests: ${apiResult.passed}/${apiResult.total} passed`);

    log("FRONTEND", "Testing frontend accessibility");
    const frontendResult = await frontendTester.test(projectDir, {
      timeout: 30000
    });
    results.phases.frontend = frontendResult;
    log("FRONTEND", `Frontend: ${frontendResult.accessible ? "accessible" : "unreachable"}`);

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
    return results;
  } finally {
    if (dockerCleanupNeeded) {
      try {
        log("CLEANUP", "Stopping containers");
        const cleanupResult = await dockerRunner.shutdown(projectDir);
        results.phases.cleanup = cleanupResult;
        log(
          "CLEANUP",
          cleanupResult.status === "stopped" ? "Containers stopped" : "Cleanup completed with warnings"
        );
      } catch (cleanupErr) {
        results.phases.cleanup = {
          status: "warning",
          error: cleanupErr.message
        };
        log("CLEANUP", `Warning: Cleanup failed: ${cleanupErr.message}`);
      }
    }

    if (!results.finishedAt) {
      results.finishedAt = new Date().toISOString();
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(args["project-dir"] || "");
  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";
  const resultsFile = args["results-file"] ? path.resolve(args["results-file"]) : null;
  const buildTimeout = Number(args["build-timeout"]);
  const composeTimeout = Number(args["compose-timeout"]);
  const healthTimeout = Number(args["health-timeout"]);

  if (!projectDir || !fs.existsSync(projectDir)) {
    console.error("Error: Project directory does not exist");
    process.exit(1);
  }

  const results = await runE2ETests(projectDir, backend, frontend, {
    buildTimeout: Number.isFinite(buildTimeout) && buildTimeout > 0 ? buildTimeout : undefined,
    composeTimeout: Number.isFinite(composeTimeout) && composeTimeout > 0 ? composeTimeout : undefined,
    healthTimeout: Number.isFinite(healthTimeout) && healthTimeout > 0 ? healthTimeout : undefined
  });

  console.log("\n" + "=".repeat(60));
  console.log("E2E TEST RESULTS");
  console.log("=".repeat(60));
  console.log(JSON.stringify(results, null, 2));

  if (resultsFile) {
    const dir = path.dirname(resultsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsFile}`);
  }

  process.exit(results.status === "passed" ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(2);
  });
}

module.exports = { runE2ETests };
