# System Architecture

This repository uses a harness-loaded agent skills model. The harness and skills are the canonical runtime; shell entrypoints remain only for compatibility and reference.

## Design Principles

- Keep the repository root shell-oriented and avoid a root `package.json`.
- Add new orchestration as skills, not as standalone host scripts.
- Keep prompt generation template-driven.
- Keep one active generated project per model and spec level.
- Keep evaluation self-contained inside the repository tree.
- Keep root scripts as compatibility/reference wrappers only.
- Place reusable implementation logic under `skills/_shared` and per-skill `scripts/`.

## Target Architecture

```text
User / CI
  -> harness/benchmark-harness.js
      -> discover skills/*/skill.json
      -> validate inputs and prerequisites
      -> build ordered execution plan
      -> execute skill steps
      -> stop, recover, and log according to skill policy
  -> skill-owned helpers
      -> skills/_shared/lib/benchmark.js
      -> skills/prompt-rendering/scripts/render-prompt.js
      -> skills/project-generation/scripts/generate-project.js
      -> skills/evaluation-workflow/scripts/evaluate-static.js
      -> skills/e2e-testing/scripts/run-e2e.js
      -> skills/eval-complete-pipeline/scripts/evaluate-complete.js
      -> skills/cleanup-benchmark/scripts/cleanup.js
```

## New Folder Structure

```text
fullstack-ai-benchmark/
|-- harness/
|   |-- benchmark-harness.js
|   |-- README.md
|   `-- schemas/
|       `-- skill.schema.json
|-- skills/
|   |-- _shared/
|   |   `-- lib/
|   |       `-- benchmark.js
|   |-- <skill>/
|   |   |-- SKILL.md
|   |   |-- scripts/
|   |   `-- skill.json
|   `-- INDEX.md
|-- scripts/
|   |-- run-benchmark.sh
|   |-- generate-project.sh
|   |-- eval-generated-project.sh
|   `-- test-setup.sh             compatibility/reference wrappers only
|-- EVAL/
|-- E2E_TESTS/
|-- PROMPTS/
|-- WORKSPACE/
|-- RESULTS/
|-- logs/
|   `-- harness/
`-- docs/
```

## Harness Responsibilities

- Discover available skills from `skills/*/skill.json`.
- Validate required inputs and preconditions before execution.
- Decide workflow order for `benchmark`, `generate`, `evaluate`, and targeted skill runs.
- Pass normalized inputs to each skill.
- Stop on mandatory step failure.
- Run explicit recovery commands only when declared by the skill contract.
- Produce structured JSONL logs under `logs/harness/`.

## Skill Responsibilities

Every loadable skill is self-contained and declares:

- name and description
- supported platform and environment
- required and optional inputs
- prechecks
- execution steps
- expected outputs
- failure handling
- rollback or recovery instructions
- validation/test method

The contract schema is `harness/schemas/skill.schema.json`.

## Current Skill Contracts

- `cleanup-benchmark`
- `environment-setup`
- `prompt-rendering`
- `project-generation`
- `evaluation-workflow`
- `e2e-testing`
- `eval-complete-pipeline`

Harness-specific guide skills such as `harness-opencode` and `harness-codex` remain human-readable until their adapters are migrated into machine-readable contracts.

## Execution Flow

```text
benchmark-harness.js
  -> cleanup-benchmark (when --reset is used)
  -> project-generation (unless --skip-gen)
  -> evaluation-workflow (when --skip-e2e)
  -> eval-complete-pipeline (when E2E is enabled)
```

The E2E path is compile-first. If the generated project fails to build, the runtime phase stops before Docker startup or API checks.

## Root Script Reference

The root scripts are retained only as wrappers for existing CLI usage and quick reference:

- `scripts/render-prompt.sh`
- `scripts/generate-project.sh`
- `scripts/eval-generated-project.sh`
- `scripts/eval-complete.sh`
- `scripts/run-e2e-tests.sh`
- `scripts/cleanup-benchmark.sh`
- `scripts/test-setup.sh`
- `scripts/test-regressions.sh`

Do not put benchmark implementation or workflow orchestration in root scripts. Add reusable code under `skills/_shared` or the relevant skill's `scripts/` directory, then update `skill.json`.

## Validation

Validate contracts:

```bash
node harness/benchmark-harness.js validate
```

Preview a plan:

```bash
node harness/benchmark-harness.js plan --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

Run static-only benchmark through the harness:

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

## Supported Runtime Scope

- E2E evaluation is implemented for Spring Boot + Angular, Spring Boot + React, Node.js + Angular, and Node.js + React.
- `quarkus` is supported for generation and static analysis; it has no E2E runner, so use `--skip-e2e`.
