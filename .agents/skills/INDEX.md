# Repo Skills Index

These are repo-scoped Codex skills for the full-stack AI benchmark project.
Codex discovers them from `.agents/skills/<skill>/SKILL.md` when working in this repository.

They are agent guidance, not benchmark runtime code. Benchmark execution remains in `scripts/`, `EVAL/`, and `E2E_TESTS/`.

## Core Skills

| Skill | Purpose |
| --- | --- |
| `repo-orientation` | Navigate repo structure, scripts, docs, supported stacks, and conventions |
| `environment-setup` | Validate local tools, dependencies, config, credentials, and smoke checks |
| `prompt-rendering` | Build and inspect final prompts from templates, specs, and cartridges |
| `project-generation` | Generate projects with session management, retries, and timeout guidance |
| `cleanup-benchmark` | Safely remove generated workspace and result artifacts |
| `evaluation-workflow` | Run and interpret static evaluation |
| `evaluation-audit` | Audit suspicious scores against source, cartridges, and result JSON |
| `eval-complete-pipeline` | Run static + E2E + merge evaluation workflows |
| `e2e-testing` | Validate builds, Docker startup, API checks, and frontend checks |
| `docs-maintenance` | Keep README and docs aligned with actual benchmark behavior |
| `benchmark-runner` | Compare models/stacks and understand benchmark scoring context |

## Harness Guidance Skills

Use these when selecting or configuring generation tools. Start with `harness-base`, then switch to the relevant per-harness skill.

| Skill | Harness | `--harness` value | Status |
| --- | --- | --- | --- |
| `harness-base` | All | - | Routing guide |
| `harness-opencode` | OpenCode | `opencode` | Ready |
| `harness-pi` | PI | `pi` | Ready |
| `harness-claude` | Claude Code CLI | `claude` | Scaffolded |
| `harness-codex` | OpenAI Codex CLI | `codex` | Scaffolded |
| `harness-kilo-code` | Kilo Code | `kilo-code` | Scaffolded |
| `harness-mimo-code` | mimo-code | `mimo-code` | Ready |

## Runtime Boundary

- Add benchmark execution logic to `scripts/`, `EVAL/`, or `E2E_TESTS/`.
- Add agent workflow guidance to `.agents/skills/<skill>/SKILL.md`.
- Do not add `skill.json` contracts for benchmark execution.
- Do not reintroduce a custom harness that loads skills as runtime workflows.

## Useful Commands

```bash
./scripts/test-setup.sh
./scripts/render-prompt.sh --template PROMPTS/templates/project-generation.md --spec PROMPTS/overview.md --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md --frontend-cartridge PROMPTS/cartridges/frontend/angular.md --level overview --backend spring-boot --frontend angular
./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --provider z-ai --skip-e2e
```
