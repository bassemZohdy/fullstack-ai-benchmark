#!/usr/bin/env node
"use strict";

const {
  parseArgs,
  requireValue,
  HARNESSES,
  PROVIDERS,
  ensureDir,
  ensureFile,
  commandAvailable,
  resolveHarnessCli,
  runCommandChecked
} = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  const harness = args.harness || "opencode";
  const provider = args.provider || "z-ai";
  requireValue("harness", harness, HARNESSES);
  requireValue("provider", provider, PROVIDERS);

  ensureDir("skills", "skills directory");
  ensureDir("PROMPTS", "PROMPTS directory");
  ensureDir("EVAL", "EVAL directory");
  ensureDir("E2E_TESTS", "E2E_TESTS directory");
  ensureFile("PROMPTS/overview.md", "overview spec");
  ensureFile("PROMPTS/detailed.md", "detailed spec");
  ensureFile("PROMPTS/templates/project-generation.md", "prompt template");
  ensureFile("EVAL/comprehensive-evaluator.js", "static evaluator");
  ensureFile("E2E_TESTS/e2e-runner.js", "E2E runner");

  if (!commandAvailable("node")) {
    throw new Error("Node.js is required");
  }
  if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required for openrouter provider");
  }
  const harnessCli = resolveHarnessCli(harness);
  if (!args.skipHarnessCli && !harnessCli) {
    throw new Error(`CLI not found for harness: ${harness}`);
  }

  runCommandChecked("node", ["--check", "EVAL/comprehensive-evaluator.js"]);
  runCommandChecked("node", ["--check", "E2E_TESTS/e2e-runner.js"]);
  console.log(`[environment-setup] OK (${harness}/${provider})`);
} catch (error) {
  console.error(`[environment-setup] ERROR: ${error.message}`);
  process.exit(1);
}
