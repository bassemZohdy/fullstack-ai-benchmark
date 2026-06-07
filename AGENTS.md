# Repository Guidelines

## Project Structure & Module Organization

This repository is a shell-orchestrated benchmark for generated full-stack projects. The root intentionally has no `package.json`.

- `scripts/`: benchmark orchestration scripts
  - `render-prompt.sh`: Standalone prompt templating (reads template, specs, cartridges → final prompt)
  - `generate-project.sh`: Project generation with harness orchestration (calls render-prompt.sh)
  - `run-benchmark.sh`: Multi-model/level benchmark runner
  - `eval-generated-project.sh`: Project evaluation orchestrator
  - `test-setup.sh`: Local syntax and integration checks
- `PROMPTS/`: specification levels (`overview.md`, `detailed.md`), prompt templates, and stack cartridges
- `EVAL/`: self-contained evaluator; entry point is `EVAL/comprehensive-evaluator.js`
- `E2E_TESTS/`: reserved compatibility area for future expanded E2E suites
- `WORKSPACE/opencode-<model-slug>/<level>/`: one active generated project per model and spec level (includes `.opencode-session-id` and `.opencode-session` for session tracking)
- `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`: permanent evaluation outputs
- `docs/`: architecture, scripts, methodology, and result format documentation

## Build, Test, and Development Commands

**Test prompt rendering** (standalone):
```bash
./scripts/render-prompt.sh \
  --template PROMPTS/templates/project-generation.md \
  --spec PROMPTS/overview.md \
  --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md \
  --frontend-cartridge PROMPTS/cartridges/frontend/angular.md \
  --level overview --backend spring-boot --frontend angular
```
Renders final prompt without invoking harness. Useful for testing prompt logic.

**Generate a single project**:
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai
```
Generates one project. Uses `render-prompt.sh` internally, invokes OpenCode harness.

**Run benchmark suite**:
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai
```
Full benchmark with all selectors (model, level, backend, frontend).

**Resume with session tracking**:
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular --provider z-ai --retries 5
```
Retries generation and resumes with `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session-id` when available. Detailed retry metadata written to `.opencode-session`.

**Local syntax check**:
```bash
bash -n scripts/*.sh && node --check EVAL/comprehensive-evaluator.js
```
Validates script and evaluator syntax.

## Coding Style & Naming Conventions

Keep root orchestration in Bash. Use quoted variables, arrays for commands, and fail-fast behavior. Do not use root Node.js scripts. Model directories must use normalized OpenCode-prefixed slugs, for example `GLM-5.1Z.AI` -> `opencode-glm-5.1` and `kimi/2.6` -> `opencode-kimi-2.6`.

Use concise Markdown in docs. Avoid invented benchmark scores; use `TBD` or `null` until real results exist.

## Testing Guidelines

Evaluation is automated through `scripts/eval-generated-project.sh`, which calls `EVAL/evaluate.js`. Generated output with no recognizable application structure must fail. Use `overview` and `detailed` as the only built-in spec levels. Keep future test files isolated under `EVAL/` or `E2E_TESTS/`.

## Commit & Pull Request Guidelines

This checkout has no Git history available, so no repository-specific commit convention can be inferred. Use clear imperative commit messages, for example `Fix OpenCode run invocation`. Pull requests should include scope, changed scripts/docs, commands run, and any generated result paths. Link related issues when available.

## Security & Configuration Tips

OpenRouter runs require `OPENROUTER_API_KEY`. Do not commit secrets. OpenCode automation may use `--auto-approve true`, which maps to `--dangerously-skip-permissions`; use it only for controlled benchmark workspaces.
