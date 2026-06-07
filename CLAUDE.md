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

- Build prompts from `PROMPTS/templates/project-generation.md`, the selected spec file, and backend/frontend cartridges.
- Keep backend and frontend in separate top-level directories inside each generated project.
- Require successful compilation and `docker compose up` for both spec levels.
- Let OpenCode generate the project `README.md`; do not copy a template README into the workspace.
- Preserve `.opencode-session-id` as the latest resumable session id.
- Store detailed retry metadata, token counts, and estimated cost in `.opencode-session`.

## Script Contract

Use the generic scripts only:

```bash
./scripts/generate-project.sh
./scripts/eval-generated-project.sh
./scripts/run-benchmark.sh
./scripts/test-setup.sh
```

- `run-benchmark.sh` requires `--model`, `--level`, `--backend`, and `--frontend`.
- `generate-project.sh` runs OpenCode in non-interactive mode with `opencode run`.
- `eval-generated-project.sh` delegates to `EVAL/comprehensive-evaluator.js`.
- `test-setup.sh` is the local smoke check for prompt rendering, harness setup, and evaluator syntax.
- Current evaluation coverage is Spring Boot backend plus Angular frontend. Other cartridges may be generated, but evaluation support for them is not implemented yet.

## Documentation Rules

- Keep documentation aligned with the actual scripts and evaluator.
- Do not keep session-history notes, scratch updates, or stale evaluation modes in repo-facing docs.
- Use `TBD` instead of invented benchmark scores or placeholder comparisons.
