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
- Evaluation results live in `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`:
  - `static-evaluation.json` - Static code analysis (structure, quality, configs)
  - `e2e-execution.json` - Runtime validation (build, docker, API, frontend)
  - `evaluation-results.json` - Merged metrics (70% static, 30% E2E when both available)

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
./scripts/render-prompt.sh            # Prompt templating (reusable)
./scripts/generate-project.sh         # Project generation orchestration
./scripts/eval-generated-project.sh   # Static code evaluation only
./scripts/run-e2e-tests.sh            # E2E runtime testing (build, docker, API)
./scripts/eval-complete.sh            # Complete evaluation (static + E2E + merge)
./scripts/run-benchmark.sh            # Full benchmark execution
./scripts/test-setup.sh               # Local smoke check
```

**Script responsibilities**:
- `render-prompt.sh`: Combines template, specs, and cartridges into final prompt. Standalone and reusable.
- `generate-project.sh`: Calls `render-prompt.sh`, invokes harness, manages retries and session tracking. Requires `--model`, `--level`, `--backend`, `--frontend`.
- `eval-generated-project.sh`: Static analysis via `EVAL/comprehensive-evaluator.js` (5-10 sec, no runtime).
- `run-e2e-tests.sh`: Runtime validation via `E2E_TESTS/e2e-runner.js` (20-40 min per project).
- `eval-complete.sh`: Full pipeline (static → E2E → merge results) with unified metrics.
- `run-benchmark.sh`: Orchestrates multi-model/level/stack benchmark runs.
- `test-setup.sh`: Local syntax and setup validation for all components.

**Evaluation coverage**:
- Static analysis: Spring Boot, Node.js backends; Angular, React frontends
- E2E testing: Spring Boot + Angular, Spring Boot + React, Node.js + Angular, Node.js + React
- Combined metrics: Same stack coverage as E2E testing

## Documentation Rules

- Keep documentation aligned with the actual scripts and evaluator.
- Do not keep session-history notes, scratch updates, or stale evaluation modes in repo-facing docs.
- Use `TBD` instead of invented benchmark scores or placeholder comparisons.
