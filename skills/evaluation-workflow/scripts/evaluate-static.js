#!/usr/bin/env node
"use strict";

const path = require("path");
const {
  parseArgs,
  boolValue,
  requireValue,
  BACKENDS,
  FRONTENDS,
  ensureDir,
  ensureFile,
  ensureInside,
  resolveRepoPath,
  runCommandChecked
} = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  const projectDir = args.projectDir || args.generatedDir;
  const resultsDir = args.resultsDir;
  const backend = args.backend || "spring-boot";
  const frontend = args.frontend || "angular";

  if (!projectDir || !resultsDir) {
    throw new Error("--project-dir and --results-dir are required");
  }

  requireValue("backend", backend, BACKENDS);
  requireValue("frontend", frontend, FRONTENDS);
  ensureDir(projectDir, "Generated project");
  ensureFile("EVAL/comprehensive-evaluator.js", "Comprehensive evaluator");
  ensureInside(resultsDir, "RESULTS", "Results directory");

  const outputFile = path.join(resultsDir, "evaluation-results.json");
  const commandArgs = [
    resolveRepoPath("EVAL/comprehensive-evaluator.js"),
    "--project-dir", resolveRepoPath(projectDir),
    "--results-file", resolveRepoPath(outputFile),
    "--model", args.model || "",
    "--provider", args.provider || "",
    "--harness", args.harness || "",
    "--level", args.level || "",
    "--backend", backend,
    "--frontend", frontend
  ];

  if (!boolValue(args.quiet)) {
    console.log(`[evaluation-workflow] writing ${outputFile}`);
  }
  runCommandChecked("node", commandArgs);
} catch (error) {
  console.error(`[evaluation-workflow] ERROR: ${error.message}`);
  process.exit(1);
}
