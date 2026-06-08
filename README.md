# Full-Stack Project Generation Benchmark

**Status**: Operational with known gaps. Runtime E2E evaluation is implemented only for Spring Boot + Angular.

This repository benchmarks generated full-stack projects by combining static code analysis with optional runtime validation. The system is shell-orchestrated at the repository root and keeps the evaluator self-contained.

## What It Does

- Generates a project from a model, spec level, backend cartridge, and frontend cartridge
- Runs static evaluation against the generated workspace
- Runs compile-first E2E validation when supported
- Merges static and runtime results into a single report

## Quick Start

### Generate and evaluate with static checks only

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

### Full pipeline with E2E validation

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
```

The final report is written to:

`RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json`

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

## Common Commands

### Static evaluation only

```bash
./scripts/eval-generated-project.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/static-evaluation.json
```

### E2E testing only

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-execution.json
```

### Full evaluation

```bash
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --model GLM-5.1Z.AI --level overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
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
