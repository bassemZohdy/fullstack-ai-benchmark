# Full-Stack Project Generation Benchmark

**Status**: Harness-loaded skills model. The harness and skills are canonical; root scripts are retained as compatibility/reference wrappers.

This repository benchmarks generated full-stack projects by combining static code analysis with compile-first runtime validation.

## What It Does

- Generates a project from a model, spec level, backend cartridge, and frontend cartridge
- Runs static evaluation against the generated workspace
- Runs runtime validation when the stack is supported
- Merges static and runtime results into a single report
- Discovers benchmark skills, validates prerequisites, plans execution, runs steps, and records diagnostics through the harness

## Quick Start

### Static checks only

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

### Full pipeline with runtime validation

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --reset
```

The final report is written to:

`RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json`

### Preview the harness plan

```bash
node harness/benchmark-harness.js plan --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

### Validate skill contracts

```bash
node harness/benchmark-harness.js validate
```

## Reset Workflow

- `--reset` removes the selected workspace and result directory before the benchmark starts
- `--health-timeout` can be increased when the supported runtime stack needs a longer readiness window
- Generation now defaults to a longer timeout so clean reruns can finish without manual tuning

## Execution Flow

```text
Input: model, level, backend, frontend
  -> harness/benchmark-harness.js
  -> skills/*/skill.json
  -> skill-owned helper scripts
  -> EVAL/E2E runtime tools
```

Compile-first validation means E2E stops if the project does not build.

## Harness-Loaded Skills Model

The harness is responsible for:

- discovering skills from `skills/*/skill.json`
- validating inputs, files, commands, credentials, and safe output paths
- deciding execution order for workflows such as `benchmark`, `generate`, and `evaluate`
- passing typed inputs into each skill
- stopping on failed mandatory steps
- running declared recovery hooks when safe
- writing structured logs to `logs/harness/*.jsonl`

Skill contracts execute reusable helpers under `skills/<skill>/scripts/` and shared functions under `skills/_shared/lib/`. Do not add benchmark orchestration logic to root scripts.

The root `scripts/*.sh` files remain callable for older commands and quick reference, but docs and new automation should prefer the harness or skill-owned helpers directly.

## Supported Evaluation Stacks

**E2E Runtime Evaluation (Full Pipeline)**:
- Spring Boot + Angular
- Spring Boot + React
- Node.js + Angular
- Node.js + React

**Static Analysis Only**: All supported backend/frontend combinations

The runtime probe for the supported stack checks the generated todo API contract:

- `GET /api/todos`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `DELETE /api/todos/{id}`

## Scoring

- Static evaluation contributes 70 percent of the merged score
- E2E evaluation contributes 30 percent when enabled
- The score tiers are benchmark labels, not deployment guarantees

## Repository Layout

```text
scripts/      compatibility/reference wrappers for existing CLI usage
harness/      skill discovery, planning, validation, execution
skills/       skill contracts, skill-owned helper scripts, shared skill runtime
EVAL/         static evaluator and merge logic
E2E_TESTS/    runtime validation harness
PROMPTS/      specs, templates, and cartridges
WORKSPACE/    generated projects
RESULTS/      evaluation outputs
docs/         architecture, scoring, and process docs
```

## Documentation

- [docs/START.md](./docs/START.md)
- [docs/SCRIPTS.md](./docs/SCRIPTS.md)
- [docs/EVALUATION_SYSTEM.md](./docs/EVALUATION_SYSTEM.md)
- [docs/EVALUATION_METRICS.md](./docs/EVALUATION_METRICS.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [harness/README.md](./harness/README.md)
- [docs/RESULTS_FORMAT.md](./docs/RESULTS_FORMAT.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/E2E_TESTING.md](./docs/E2E_TESTING.md)

## Project Contract

- **Harness**: OpenCode for all generation runs
- **Validation Model**: Z.ai GLM (`GLM-5.1Z.AI`) with `z-ai` provider
- **Benchmark Matrix**: OpenRouter with `kimi/2.6`, `minimax/1.5`, `xiaomi/mimo-2.5`
- **Specs**: `overview` and `detailed` only
- **Timeouts**: 600s generation default, 90s inactivity threshold
- **E2E Coverage**: Spring Boot + Angular/React, Node.js + Angular/React
- **Session Tracking**: Resumable via `.opencode-session-id`, audit metadata in `.opencode-session`
