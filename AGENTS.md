# Repository Guidelines

## Project Structure & Module Organization

This repository is a shell-orchestrated benchmark for generated full-stack projects. The root intentionally has no `package.json`.

- `scripts/`: benchmark orchestration scripts.
- `PROMPTS/`: `overview.md`, `detailed.md`, prompt templates, and stack cartridges.
- `EVAL/`: self-contained evaluator; current entry point is `EVAL/evaluate.js`.
- `E2E_TESTS/`: reserved compatibility area for future expanded E2E suites.
- `WORKSPACE/opencode-<model-slug>/<level>/`: one active generated project per model and spec level. The workspace also contains `.opencode-session-id` and `.opencode-session`.
- `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`: permanent evaluation outputs.
- `docs/`: architecture, scripts, methodology, and result format documentation.

## Build, Test, and Development Commands

```bash
./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --provider z-ai
```
Runs a single benchmark with all required selectors (model, level, backend, frontend).

```bash
./scripts/run-benchmark.sh --model kimi/2.6 --level overview --backend node-js --frontend react --provider openrouter
```
Runs benchmark with a different model and stack.

```bash
./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --provider z-ai --retries 5
```
Retries generation and resumes with `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session-id` when available. Detailed retry metadata is written to `.opencode-session`.

```bash
bash -n scripts/*.sh
node --check EVAL/evaluate.js
```
Performs local syntax checks.

## Coding Style & Naming Conventions

Keep root orchestration in Bash. Use quoted variables, arrays for commands, and fail-fast behavior. Do not use root Node.js scripts. Model directories must use normalized OpenCode-prefixed slugs, for example `GLM-5.1Z.AI` -> `opencode-glm-5.1` and `kimi/2.6` -> `opencode-kimi-2.6`.

Use concise Markdown in docs. Avoid invented benchmark scores; use `TBD` or `null` until real results exist.

## Testing Guidelines

Evaluation is automated through `scripts/eval-generated-project.sh`, which calls `EVAL/evaluate.js`. Generated output with no recognizable application structure must fail. Use `overview` and `detailed` as the only built-in spec levels. Keep future test files isolated under `EVAL/` or `E2E_TESTS/`.

## Commit & Pull Request Guidelines

This checkout has no Git history available, so no repository-specific commit convention can be inferred. Use clear imperative commit messages, for example `Fix OpenCode run invocation`. Pull requests should include scope, changed scripts/docs, commands run, and any generated result paths. Link related issues when available.

## Security & Configuration Tips

OpenRouter runs require `OPENROUTER_API_KEY`. Do not commit secrets. OpenCode automation may use `--auto-approve true`, which maps to `--dangerously-skip-permissions`; use it only for controlled benchmark workspaces.
