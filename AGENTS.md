# Repository Guidelines

## Project Structure & Module Organization

This repository is a harness-loaded benchmark for generated full-stack projects. The root intentionally has no `package.json`.

- `harness/`: skill discovery, validation, planning, workflow execution, and diagnostics
- `skills/`: benchmark skill contracts, human-readable skill guides, skill-owned helpers, and shared runtime code
- `scripts/`: compatibility/reference wrappers only; do not add orchestration logic here
- `PROMPTS/`: specification levels (`overview.md`, `detailed.md`), prompt templates, and stack cartridges
- `EVAL/`: self-contained evaluator; entry point is `EVAL/comprehensive-evaluator.js`
- `E2E_TESTS/`: reserved compatibility area for future expanded E2E suites
- `WORKSPACE/opencode-<model-slug>/<level>/`: one active generated project per model and spec level (includes `.opencode-session-id` and `.opencode-session` for session tracking)
- `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`: permanent evaluation outputs
- `docs/`: architecture, scripts, methodology, and result format documentation

## Build, Test, and Development Commands

**Test prompt rendering** (standalone):
```bash
node skills/prompt-rendering/scripts/render-prompt.js \
  --template PROMPTS/templates/project-generation.md \
  --spec PROMPTS/overview.md \
  --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md \
  --frontend-cartridge PROMPTS/cartridges/frontend/angular.md \
  --level overview --backend spring-boot --frontend angular
```
Renders final prompt without invoking harness. Useful for testing prompt logic.

**Generate a single project**:
```bash
node harness/benchmark-harness.js run --workflow generate \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai
```
Generates one project. Uses the prompt-rendering skill internally and invokes the selected generation harness.

**Run benchmark suite**:
```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai
```
Full benchmark with all selectors (model, level, backend, frontend).

**Resume with session tracking**:
```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai --retries 5
```
Retries generation and resumes with `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session-id` when available. Detailed retry metadata written to `.opencode-session`.

**Complete evaluation** (static + E2E + merged metrics):
```bash
node skills/eval-complete-pipeline/scripts/evaluate-complete.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --model GLM-5.1Z.AI --level overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```
Runs static analysis, E2E tests, merges results into unified metrics (20-40 min per project).

**Static evaluation only** (code structure and quality):
```bash
node skills/evaluation-workflow/scripts/evaluate-static.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/static-evaluation.json
```
Checks code organization, Docker config, build tools (5-10 seconds, no runtime testing).

**E2E testing only** (build, deploy, and API validation):
```bash
node skills/e2e-testing/scripts/run-e2e.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-execution.json
```
Builds projects, runs docker-compose, tests API/frontend (20-40 min per project, no code quality checks).

**Local syntax check**:
```bash
bash -n scripts/*.sh && node --check EVAL/comprehensive-evaluator.js E2E_TESTS/e2e-runner.js E2E_TESTS/helpers/*.js
```
Validates compatibility wrapper and evaluator syntax.

## Coding Style & Naming Conventions

Keep root `scripts/*.sh` as thin Bash wrappers only. Put implementation in `skills/_shared`, `skills/<skill>/scripts/`, or `harness/`. Model directories must use normalized harness-prefixed slugs, for example `GLM-5.1Z.AI` -> `opencode-glm-5.1` and `kimi/2.6` -> `opencode-kimi-2.6`.

Use concise Markdown in docs. Avoid invented benchmark scores; use `TBD` or `null` until real results exist.

## Testing Guidelines

### Static Evaluation
Automated through `skills/evaluation-workflow/scripts/evaluate-static.js`, which calls `EVAL/comprehensive-evaluator.js`. Checks code structure, Docker configuration, and build tools. Generated output with no recognizable application structure must fail.

### E2E Testing
End-to-end testing validates actual runtime behavior: builds projects, runs `docker compose up`, and tests API/frontend availability. Run via the E2E skill helper:

```bash
node skills/e2e-testing/scripts/run-e2e.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-results.json
```

E2E tests take 20-40 minutes per project (8-15 min builds, 2-3 min Docker startup, 1-2 min tests). Run sequentially or in parallel using separate terminal sessions.

### Spec Levels
Use `overview` and `detailed` as the only built-in spec levels. Keep all test files isolated under `EVAL/` or `E2E_TESTS/`.

## Commit & Pull Request Guidelines

This checkout has no Git history available, so no repository-specific commit convention can be inferred. Use clear imperative commit messages, for example `Fix OpenCode run invocation`. Pull requests should include scope, changed scripts/docs, commands run, and any generated result paths. Link related issues when available.

## Security & Configuration Tips

OpenRouter runs require `OPENROUTER_API_KEY`. Do not commit secrets. OpenCode automation may use `--auto-approve true`, which maps to `--dangerously-skip-permissions`; use it only for controlled benchmark workspaces.
