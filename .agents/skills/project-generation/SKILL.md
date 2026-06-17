---
name: project-generation
description: Generate benchmark projects, manage OpenCode sessions and retries, and inspect the active workspace. Use when running `scripts/generate-project.sh` or the generation phase of `scripts/run-benchmark.sh`.
---

# Project Generation

## Overview

Use this skill when the task is to create or refresh one generated project in `WORKSPACE/`. It covers the generation wrapper, session resume behavior, and the workspace layout expected by later evaluation steps.

## Workflow

1. Confirm the model, level, backend, frontend, provider, retries, and harness.
2. Run `scripts/generate-project.sh` for a single project or the generation phase of `scripts/run-benchmark.sh` for the full pipeline.
3. Keep the active workspace under the matching `WORKSPACE/opencode-<model-slug>/<level>/` directory.
4. Preserve `.opencode-session-id` and `.opencode-session` when resuming attempts.
5. Inspect the generated `README.md`, build files, and app structure before declaring the workspace ready.

## Guardrails

- Do not hand-edit generated output just to satisfy the benchmark.
- Do not delete the session file if the run is meant to resume.
- Treat `opencode` output as the source of truth for generation attempts.
- If the workspace is being reused, verify that any cleanup still preserves the session tracking files.

## Useful Paths

- Prompt source: `PROMPTS/templates/project-generation.md`
- Spec levels: `PROMPTS/overview.md`, `PROMPTS/detailed.md`
- Cartridges: `PROMPTS/cartridges/backend/*`, `PROMPTS/cartridges/frontend/*`
- Session metadata: `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session-id` and `.opencode-session`
