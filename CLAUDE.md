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

- **Prompt Templating**: Use `skills/prompt-rendering/scripts/render-prompt.js` to build final prompts from `PROMPTS/templates/project-generation.md`, the selected spec file, and backend/frontend cartridges. This helper is separate from project generation for clean separation of concerns.
- Keep backend and frontend in separate top-level directories inside each generated project.
- Require successful compilation and `docker compose up` for both spec levels.
- Let OpenCode generate the project `README.md`; do not copy a template README into the workspace.
- Preserve `.opencode-session-id` as the latest resumable session id.
- Store detailed retry metadata, token counts, and estimated cost in `.opencode-session` (includes generation inputs for auditing).

## Harness and Skill Contract

Use the harness and skill helpers as the canonical interface:

```bash
node skills/prompt-rendering/scripts/render-prompt.js       # Prompt templating
node harness/benchmark-harness.js run --workflow generate   # Project generation
node skills/evaluation-workflow/scripts/evaluate-static.js  # Static code evaluation
node skills/e2e-testing/scripts/run-e2e.js                  # E2E runtime testing
node skills/eval-complete-pipeline/scripts/evaluate-complete.js
node harness/benchmark-harness.js run --workflow benchmark  # Full benchmark execution
node skills/environment-setup/scripts/validate-setup.js     # Local smoke check
```

The root `scripts/*.sh` files are compatibility/reference wrappers for older commands. Keep them thin and put implementation under `harness/`, `skills/_shared`, or `skills/<skill>/scripts/`.

**Skill responsibilities**:
- `prompt-rendering`: Combines template, specs, and cartridges into final prompt. Standalone and reusable.
- `project-generation`: Invokes prompt rendering, runs the selected harness, manages retries and session tracking. Requires `--model`, `--level`, `--backend`, `--frontend`.
- `evaluation-workflow`: Static analysis via `EVAL/comprehensive-evaluator.js` (5-10 sec, no runtime).
- `e2e-testing`: Runtime validation via `E2E_TESTS/e2e-runner.js` (20-40 min per project).
- `eval-complete-pipeline`: Full pipeline (static -> E2E -> merge results) with unified metrics.
- `benchmark-harness`: Orchestrates multi-model/level/stack benchmark runs through skill contracts.
- `environment-setup`: Local syntax and setup validation for all components.

**Evaluation coverage**:
- Static analysis: Spring Boot, Node.js backends; Angular, React frontends
- E2E testing: Spring Boot + Angular, Spring Boot + React, Node.js + Angular, Node.js + React
- Combined metrics: Same stack coverage as E2E testing

## Documentation Rules

- Keep documentation aligned with the actual harness, skills, wrappers, and evaluator.
- Do not keep session-history notes, scratch updates, or stale evaluation modes in repo-facing docs.
- Use `TBD` instead of invented benchmark scores or placeholder comparisons.
