# Full-Stack Project Generation Benchmark

**Status**: Operational with known gaps. Runtime E2E evaluation is implemented only for Spring Boot + Angular.

This repository benchmarks generated full-stack projects by combining static code analysis with compile-first runtime validation.

## What It Does

- Generates a project from a model, spec level, backend cartridge, and frontend cartridge
- Runs static evaluation against the generated workspace
- Runs runtime validation when the stack is supported
- Merges static and runtime results into a single report

## Quick Start

### Static checks only

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

### Full pipeline with runtime validation

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --reset
```

The final report is written to:

`RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json`

## Reset Workflow

- `--reset` removes the selected workspace and result directory before the benchmark starts
- `--health-timeout` can be increased when the supported runtime stack needs a longer readiness window
- Generation now defaults to a longer timeout so clean reruns can finish without manual tuning

## Execution Flow

```text
Input: model, level, backend, frontend
  -> render-prompt.sh
  -> generate-project.sh
  -> eval-generated-project.sh
  -> run-e2e-tests.sh (optional)
  -> e2e-results-merger.js
```

Compile-first validation means E2E stops if the project does not build.

## Supported Runtime Evaluation

- E2E evaluation: Spring Boot + Angular
- Generation-only: Spring Boot + React, Node.js + Angular, Node.js + React

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
scripts/      benchmark orchestration scripts
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
- [docs/RESULTS_FORMAT.md](./docs/RESULTS_FORMAT.md)
- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/E2E_TESTING.md](./docs/E2E_TESTING.md)

## Project Rules

- Harness: OpenCode for generation
- Validation: Z.ai GLM and runtime E2E
- Specs: `overview` and `detailed` only
- Runtime evaluation is currently implemented for Spring Boot + Angular only
