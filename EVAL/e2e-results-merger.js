#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function convertE2EResultsToEvaluationTests(e2eResults) {
  if (!e2eResults || e2eResults.status === "error") {
    return [
      {
        name: "E2E test suite execution",
        status: "failed",
        details: e2eResults?.error || "E2E tests did not run"
      }
    ];
  }

  const tests = [];

  // Build phase
  if (e2eResults.phases.build) {
    const buildPhase = e2eResults.phases.build;
    const backendBuild =
      buildPhase.backend?.status === "passed" ||
      buildPhase.backend?.status === "skipped";
    const frontendBuild =
      buildPhase.frontend?.status === "passed" ||
      buildPhase.frontend?.status === "skipped";

    tests.push({
      name: "Backend builds successfully",
      status: backendBuild ? "passed" : "failed",
      details: buildPhase.backend?.error || ""
    });

    tests.push({
      name: "Frontend builds successfully",
      status: frontendBuild ? "passed" : "failed",
      details: buildPhase.frontend?.error || ""
    });
  }

  // Docker phase
  if (e2eResults.phases.docker) {
    const dockerPhase = e2eResults.phases.docker;
    tests.push({
      name: "Docker Compose services start",
      status: dockerPhase.status === "started" ? "passed" : "failed",
      details: dockerPhase.error || ""
    });
  }

  // Health phase
  if (e2eResults.phases.health) {
    const healthPhase = e2eResults.phases.health;
    tests.push({
      name: "Services reach health/ready state",
      status: healthPhase.ready ? "passed" : "failed",
      details: healthPhase.error || "",
      duration_ms: healthPhase.duration
    });
  }

  // API testing
  if (e2eResults.phases.api && e2eResults.phases.api.tests) {
    const apiTests = e2eResults.phases.api.tests;
    apiTests.forEach((test) => {
      tests.push({
        name: `API endpoint: ${test.name}`,
        status: test.status,
        details: test.error || `Status: ${test.statusCode}`
      });
    });
  }

  // Frontend testing
  if (e2eResults.phases.frontend && e2eResults.phases.frontend.tests) {
    const frontendTests = e2eResults.phases.frontend.tests;
    frontendTests.forEach((test) => {
      tests.push({
        name: `Frontend: ${test.name}`,
        status: test.status,
        details: test.error || `Status: ${test.statusCode}`
      });
    });
  }

  // Cleanup phase
  if (e2eResults.phases.cleanup) {
    const cleanupPhase = e2eResults.phases.cleanup;
    tests.push({
      name: "Container cleanup successful",
      status: cleanupPhase.status === "stopped" ? "passed" : "failed",
      details: cleanupPhase.error || ""
    });
  }

  return tests;
}

function calculateE2EScore(e2eResults) {
  if (!e2eResults) return 0;
  if (e2eResults.status === "error") return 0;

  const phases = e2eResults.phases || {};
  let score = 0;
  let maxScore = 0;

  // Build success: 25 points. Partial credit (12) when only one side passes.
  if (phases.build) {
    maxScore += 25;
    const backendOk =
      phases.build.backend?.status === "passed" ||
      phases.build.backend?.status === "skipped";
    const frontendOk =
      phases.build.frontend?.status === "passed" ||
      phases.build.frontend?.status === "skipped";
    if (backendOk && frontendOk) score += 25;
    else if (backendOk || frontendOk) score += 12;
  }

  // Docker startup: 20 points
  if (phases.docker) {
    maxScore += 20;
    if (phases.docker.status === "started") score += 20;
  }

  // Service health: 20 points
  if (phases.health) {
    maxScore += 20;
    if (phases.health.ready) score += 20;
  }

  // API functionality: 20 points
  if (phases.api) {
    maxScore += 20;
    if (phases.api.total > 0) {
      const passRate = phases.api.passed / phases.api.total;
      score += Math.round(20 * passRate);
    }
  }

  // Frontend accessibility: 15 points (binary — accessible on any port = full credit).
  // Port probing tests multiple ports (React, Angular, Nginx, etc.) for diagnostics,
  // but a project is not penalised for not running on irrelevant ports.
  if (phases.frontend) {
    maxScore += 15;
    if (phases.frontend.accessible) score += 15;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

function getTier(score) {
  if (score >= 90) return "Production-Ready";
  if (score >= 75) return "Deployable";
  if (score >= 60) return "Functional";
  return "Needs Work";
}

function mergeEvaluationResults(staticResults, e2eResults) {
  validateStaticResults(staticResults);
  validateE2EResults(e2eResults);

  const MERGE_WEIGHTS = {
    static: 0.7,
    e2e: 0.3
  };

  // Update overall scores to include E2E results
  const updatedResults = JSON.parse(JSON.stringify(staticResults));
  const staticTestCount = updatedResults.quality.test_count;
  const staticPassed = updatedResults.quality.passed;
  const staticFailed = updatedResults.quality.failed;
  const staticPassRate = updatedResults.quality.pass_rate;

  // Store original static scores
  updatedResults.quality.static_scores = updatedResults.quality.scores;
  updatedResults.quality.static_test_count = staticTestCount;
  updatedResults.quality.static_passed = staticPassed;
  updatedResults.quality.static_failed = staticFailed;
  updatedResults.quality.static_pass_rate = staticPassRate;

  if (!e2eResults) {
    updatedResults.metadata.evaluation_version = "4.1";
    updatedResults.metadata.evaluation_type = "comprehensive";
    updatedResults.metadata.e2e_enabled = false;
    return updatedResults;
  }

  const e2eTests = convertE2EResultsToEvaluationTests(e2eResults);
  const e2eScore = calculateE2EScore(e2eResults);

  // Create runtime_validation section with E2E results
  const runtimeValidation = {
    executed: true,
    status: e2eResults.status || "not_executed",
    e2e_score: e2eScore,
    passed: e2eTests.filter((t) => t.status === "passed").length,
    failed: e2eTests.filter((t) => t.status === "failed").length,
    total: e2eTests.length,
    tests: e2eTests,
    phases: e2eResults.phases || {}
  };

  // Update overall score with E2E weighting
  if (e2eResults && e2eResults.status !== "error") {
    // Keep the merged score calibration explicit and stable.
    const staticOverall = updatedResults.quality.overall_score;
    const newOverall = Math.round(
      staticOverall * MERGE_WEIGHTS.static + e2eScore * MERGE_WEIGHTS.e2e
    );
    updatedResults.quality.overall_score = newOverall;
    updatedResults.quality.tier = getTier(newOverall);
    updatedResults.quality.overall_score_before_e2e = staticOverall;
    updatedResults.quality.e2e_impact = newOverall - staticOverall;
  }

  // Add runtime validation section
  updatedResults.runtime_validation = runtimeValidation;

  // Update merged counts and pass rate.
  const mergedTestCount = staticTestCount + runtimeValidation.total;
  const mergedPassed = staticPassed + runtimeValidation.passed;
  const mergedFailed = staticFailed + runtimeValidation.failed;

  updatedResults.quality.test_count = mergedTestCount;
  updatedResults.quality.passed = mergedPassed;
  updatedResults.quality.failed = mergedFailed;
  updatedResults.quality.pass_rate =
    mergedTestCount > 0 ? mergedPassed / mergedTestCount : 0;

  updatedResults.quality.total_tests_including_e2e = mergedTestCount;
  updatedResults.quality.total_passed_including_e2e = mergedPassed;
  updatedResults.quality.total_failed_including_e2e = mergedFailed;
  updatedResults.quality.pass_rate_including_e2e = updatedResults.quality.pass_rate;

  // Update metadata
  updatedResults.metadata.evaluation_version = "4.1";
  updatedResults.metadata.evaluation_type = "comprehensive+e2e";
  updatedResults.metadata.e2e_enabled = !!e2eResults;

  if (e2eResults && e2eResults.startedAt) {
    updatedResults.metadata.e2e_timestamp = e2eResults.startedAt;
    updatedResults.metadata.e2e_duration_ms =
      new Date(e2eResults.finishedAt).getTime() -
      new Date(e2eResults.startedAt).getTime();
  }

  return updatedResults;
}

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

function validateStaticResults(staticResults) {
  if (!staticResults || typeof staticResults !== "object") {
    throw new Error("Static evaluation results must be a JSON object");
  }
  if (!staticResults.quality || typeof staticResults.quality !== "object") {
    throw new Error("Static evaluation results are missing quality");
  }
  if (!staticResults.quality.scores || typeof staticResults.quality.scores !== "object") {
    throw new Error("Static evaluation results are missing quality.scores");
  }
  if (!staticResults.metadata || typeof staticResults.metadata !== "object") {
    throw new Error("Static evaluation results are missing metadata");
  }
}

function validateE2EResults(e2eResults) {
  if (!e2eResults) {
    return;
  }
  if (typeof e2eResults !== "object") {
    throw new Error("E2E results must be a JSON object when provided");
  }
  if (!e2eResults.phases || typeof e2eResults.phases !== "object") {
    throw new Error("E2E results are missing phases");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const staticResultsFile = args["static-results"]
    ? path.resolve(args["static-results"])
    : null;
  const e2eResultsFile = args["e2e-results"]
    ? path.resolve(args["e2e-results"])
    : null;
  const outputFile = args.output ? path.resolve(args.output) : null;

  if (!staticResultsFile || !fs.existsSync(staticResultsFile)) {
    console.error("Static results file is required and must exist");
    process.exit(1);
  }

  const staticResults = JSON.parse(
    fs.readFileSync(staticResultsFile, "utf8")
  );
  let e2eResults = null;

  if (e2eResultsFile && fs.existsSync(e2eResultsFile)) {
    e2eResults = JSON.parse(fs.readFileSync(e2eResultsFile, "utf8"));
  }

  const merged = mergeEvaluationResults(staticResults, e2eResults);

  if (outputFile) {
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
    console.log(`✅ Merged results saved to: ${outputFile}`);
  } else {
    console.log(JSON.stringify(merged, null, 2));
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error merging results:", err);
    process.exit(1);
  });
}

module.exports = { mergeEvaluationResults, calculateE2EScore };
