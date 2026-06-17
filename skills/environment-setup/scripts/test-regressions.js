#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  repoRoot,
  runCommandChecked,
  resolveRepoPath
} = require("../../_shared/lib/benchmark");

function collectJsFiles(dir) {
  const resolved = resolveRepoPath(dir);
  const files = [];
  if (!fs.existsSync(resolved)) return files;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  };
  walk(resolved);
  return files;
}

try {
  const jsFiles = [
    resolveRepoPath("harness/benchmark-harness.js"),
    ...collectJsFiles("skills"),
    resolveRepoPath("EVAL/comprehensive-evaluator.js"),
    resolveRepoPath("EVAL/e2e-results-merger.js"),
    resolveRepoPath("E2E_TESTS/e2e-runner.js")
  ].filter((file) => fs.existsSync(file));

  for (const file of jsFiles) {
    runCommandChecked("node", ["--check", file], { cwd: repoRoot });
  }

  runCommandChecked("node", ["harness/benchmark-harness.js", "validate"]);
  runCommandChecked("node", [
    "harness/benchmark-harness.js",
    "plan",
    "--workflow", "benchmark",
    "--model", "GLM-5.1Z.AI",
    "--level", "overview",
    "--backend", "spring-boot",
    "--frontend", "angular",
    "--skip-e2e"
  ]);
  runCommandChecked("node", [
    "skills/prompt-rendering/scripts/render-prompt.js",
    "--level", "overview",
    "--backend", "spring-boot",
    "--frontend", "angular",
    "--output", "logs/harness/regression-rendered-prompt.md"
  ]);

  console.log("[test-regressions] OK");
} catch (error) {
  console.error(`[test-regressions] ERROR: ${error.message}`);
  process.exit(1);
}
