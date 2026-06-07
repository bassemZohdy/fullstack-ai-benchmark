# Benchmark AI Project Guidelines

## Purpose

This repository benchmarks full-stack project generation across tools, models, and specification methodologies.

## Current Contract

- Harness: OpenCode for all generation runs.
- Validation model: Z.ai GLM (`GLM-5.1Z.AI`) with `z-ai` provider.
- Benchmark matrix: OpenRouter with `kimi/2.6`, `minimax/1.5`, and `xiaomi/mimo-2.5`.
- Spec levels: `overview` and `detailed` only.
- Root workspace: shell-only orchestration, no root `package.json`.
- Generated projects live in `WORKSPACE/opencode-<model-slug>/<level>/`.
- Evaluation results live in `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json`.

## Prompt and Workspace Rules

- **Prompt Templating**: Use `scripts/render-prompt.sh` to build final prompts from `PROMPTS/templates/project-generation.md`, the selected spec file, and backend/frontend cartridges. This script is separate from project generation for clean separation of concerns.
- Keep backend and frontend in separate top-level directories inside each generated project.
- Require successful compilation and `docker compose up` for both spec levels.
- Let OpenCode generate the project `README.md`; do not copy a template README into the workspace.
- Preserve `.opencode-session-id` as the latest resumable session id.
- Store detailed retry metadata, token counts, and estimated cost in `.opencode-session` (includes generation inputs for auditing).

## Script Contract

Use the generic scripts only:

```bash
./scripts/render-prompt.sh          # Prompt templating (reusable)
./scripts/generate-project.sh       # Project generation orchestration
./scripts/eval-generated-project.sh # Project evaluation
./scripts/run-benchmark.sh          # Full benchmark execution
./scripts/test-setup.sh             # Local smoke check
```

**Script responsibilities**:
- `render-prompt.sh`: Combines template, specs, and cartridges into final prompt. Standalone and reusable.
- `generate-project.sh`: Calls `render-prompt.sh`, invokes harness, manages retries and session tracking. Requires `--model`, `--level`, `--backend`, `--frontend`.
- `run-benchmark.sh`: Orchestrates multi-model/level/stack benchmark runs.
- `eval-generated-project.sh`: Delegates to `EVAL/comprehensive-evaluator.js`.
- `test-setup.sh`: Local syntax and setup validation for all components.

**Current evaluation coverage**: Spring Boot backend plus Angular frontend. Other cartridges may be generated, but evaluation support for them is not implemented yet.

## Documentation Rules

- Keep documentation aligned with the actual scripts and evaluator.
- Do not keep session-history notes, scratch updates, or stale evaluation modes in repo-facing docs.
- Use `TBD` instead of invented benchmark scores or placeholder comparisons.
