#!/usr/bin/env node
"use strict";

const {
  parseArgs,
  requireValue,
  LEVELS,
  BACKENDS,
  FRONTENDS,
  renderPrompt
} = require("../../_shared/lib/benchmark");

const args = parseArgs(process.argv.slice(2));

try {
  requireValue("level", args.level, LEVELS);
  requireValue("backend", args.backend, BACKENDS);
  requireValue("frontend", args.frontend, FRONTENDS);

  renderPrompt({
    template: args.template || "PROMPTS/templates/project-generation.md",
    specFile: args.specFile || args.spec || `PROMPTS/${args.level}.md`,
    backendCartridge: args.backendCartridge || `PROMPTS/cartridges/backend/${args.backend}.md`,
    frontendCartridge: args.frontendCartridge || `PROMPTS/cartridges/frontend/${args.frontend}.md`,
    level: args.level,
    backend: args.backend,
    frontend: args.frontend,
    output: args.output
  });
} catch (error) {
  console.error(`[prompt-rendering] ERROR: ${error.message}`);
  process.exit(1);
}
