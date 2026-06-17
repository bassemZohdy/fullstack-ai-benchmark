#!/usr/bin/env node
"use strict";

const path = require("path");
const {
  parseArgs,
  requireValue,
  BACKENDS,
  FRONTENDS,
  ensureDir,
  ensureFile,
  ensureInside,
  isRuntimeSupported,
  resolveRepoPath,
  runCommand,
  runCommandChecked
} = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  const projectDir = args.projectDir;
  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";
  const resultsDir = args.resultsDir;

  if (!projectDir || !resultsDir) {
    throw new Error("--project-dir and --results-dir are required");
  }
  requireValue("backend", backend, BACKENDS);
  requireValue("frontend", frontend, FRONTENDS);
  if (!isRuntimeSupported(backend, frontend)) {
    throw new Error(`Unsupported complete evaluation combination: ${backend}+${frontend}. Use static evaluation instead.`);
  }

  ensureDir(projectDir, "Generated project");
  ensureFile("EVAL/comprehensive-evaluator.js", "Comprehensive evaluator");
  ensureFile("EVAL/e2e-results-merger.js", "Results merger");
  ensureFile("E2E_TESTS/e2e-runner.js", "E2E runner");
  ensureInside(resultsDir, "RESULTS", "Results directory");

  const staticFile = path.join(resultsDir, "static-evaluation.json");
  const e2eFile = path.join(resultsDir, "e2e-execution.json");
  const finalFile = path.join(resultsDir, "evaluation-results.json");

  console.log("[eval-complete-pipeline] Step 1/3: static evaluation");
  runCommandChecked("node", [
    resolveRepoPath("EVAL/comprehensive-evaluator.js"),
    "--project-dir", resolveRepoPath(projectDir),
    "--backend", backend,
    "--frontend", frontend,
    "--results-file", resolveRepoPath(staticFile),
    "--model", args.model || "",
    "--level", args.level || "",
    "--provider", args.provider || "",
    "--harness", args.harness || ""
  ]);

  console.log("[eval-complete-pipeline] Step 2/3: E2E testing");
  const e2eArgs = [
    resolveRepoPath("E2E_TESTS/e2e-runner.js"),
    "--project-dir", resolveRepoPath(projectDir),
    "--backend", backend,
    "--frontend", frontend,
    "--results-file", resolveRepoPath(e2eFile)
  ];
  if (args.buildTimeout) e2eArgs.push("--build-timeout", args.buildTimeout);
  if (args.composeTimeout) e2eArgs.push("--compose-timeout", args.composeTimeout);
  if (args.healthTimeout) e2eArgs.push("--health-timeout", args.healthTimeout);

  const e2eResult = runCommand("node", e2eArgs);
  const e2eFailed = e2eResult.status !== 0;
  if (e2eFailed) {
    console.error("[eval-complete-pipeline] E2E testing failed; merging available results");
  }

  console.log("[eval-complete-pipeline] Step 3/3: merge results");
  const mergeArgs = [
    resolveRepoPath("EVAL/e2e-results-merger.js"),
    "--static-results", resolveRepoPath(staticFile),
    "--output", resolveRepoPath(finalFile)
  ];
  if (require("fs").existsSync(resolveRepoPath(e2eFile))) {
    mergeArgs.push("--e2e-results", resolveRepoPath(e2eFile));
  }
  runCommandChecked("node", mergeArgs);

  if (e2eFailed) {
    process.exit(1);
  }
} catch (error) {
  console.error(`[eval-complete-pipeline] ERROR: ${error.message}`);
  process.exit(1);
}
