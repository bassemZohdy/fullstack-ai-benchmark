#!/usr/bin/env node
"use strict";

const {
  parseArgs,
  requireValue,
  ensureDir,
  ensureFile,
  ensureInside,
  isRuntimeSupported,
  resolveRepoPath,
  runCommandChecked
} = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  const projectDir = args.projectDir;
  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";
  const resultsFile = args.resultsFile || args.e2eResultsFile;

  if (!projectDir) throw new Error("--project-dir is required");
  if (!resultsFile) throw new Error("--results-file is required");

  requireValue("backend", backend, ["spring-boot", "node-js"]);
  requireValue("frontend", frontend, ["react", "angular"]);
  if (!isRuntimeSupported(backend, frontend)) {
    throw new Error(`Unsupported E2E combination: ${backend}+${frontend}`);
  }

  ensureDir(projectDir, "Generated project");
  ensureFile("E2E_TESTS/e2e-runner.js", "E2E runner");
  ensureInside(resultsFile, "RESULTS", "E2E results file");

  const commandArgs = [
    resolveRepoPath("E2E_TESTS/e2e-runner.js"),
    "--project-dir", resolveRepoPath(projectDir),
    "--backend", backend,
    "--frontend", frontend,
    "--results-file", resolveRepoPath(resultsFile)
  ];

  if (args.buildTimeout) commandArgs.push("--build-timeout", args.buildTimeout);
  if (args.composeTimeout) commandArgs.push("--compose-timeout", args.composeTimeout);
  if (args.healthTimeout) commandArgs.push("--health-timeout", args.healthTimeout);

  runCommandChecked("node", commandArgs);
} catch (error) {
  console.error(`[e2e-testing] ERROR: ${error.message}`);
  process.exit(1);
}
