#!/usr/bin/env node
"use strict";

const { cleanupBenchmark, parseArgs, boolValue } = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  cleanupBenchmark({
    model: args.model,
    level: args.level,
    backend: args.backend,
    frontend: args.frontend,
    harness: args.harness || "opencode",
    scope: args.scope || "all",
    quiet: boolValue(args.quiet)
  });
} catch (error) {
  console.error(`[cleanup-benchmark] ERROR: ${error.message}`);
  process.exit(1);
}
