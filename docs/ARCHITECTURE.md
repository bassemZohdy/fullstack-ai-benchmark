# System Architecture

## Design Principles

- Shell orchestration at the repository root
- No root `package.json`
- Prompt generation is template-driven
- One active generated project per model and spec level
- Evaluation is self-contained inside the repository tree

## Directory Structure

```text
fullstack-ai-benchmark/
|-- scripts/
|   |-- generate-project.sh
|   |-- eval-generated-project.sh
|   |-- run-benchmark.sh
|   `-- test-setup.sh
|-- EVAL/
|   |-- comprehensive-evaluator.js
|   |-- e2e-results-merger.js
|   |-- cartridges/
|   `-- phases/
|-- E2E_TESTS/
|   |-- e2e-runner.js
|   `-- helpers/
|-- PROMPTS/
|-- WORKSPACE/
|-- RESULTS/
`-- docs/
```

## Execution Flow

```text
run-benchmark.sh
  -> cleanup-benchmark.sh (when --reset is used)
  -> generate-project.sh
  -> eval-generated-project.sh
  -> run-e2e-tests.sh (optional)
  -> e2e-results-merger.js (when runtime results exist)
```

The E2E path is compile-first. If the generated project fails to build, the runtime phase stops before Docker startup or API checks.

## Components

### scripts/generate-project.sh

Generates the workspace for one model and one spec level.

- Renders the prompt from the shared template, selected spec, and cartridges
- Clears the active workspace before generation
- Preserves `.opencode-session-id`
- Writes `.opencode-session` with attempt history and exported token/cost metadata

### scripts/eval-generated-project.sh

Runs static evaluation over the generated project.

- Fails fast when the evaluator is missing, the project is missing, or no recognizable application structure exists
- Writes normalized JSON results

### E2E_TESTS/

Contains the runtime validation harness.

- Validates build output first
- Starts Docker Compose only after a successful build
- Polls common ports for health/readiness
- Runs the todo API contract checks
- Verifies frontend availability
- Always attempts cleanup after Docker startup

## Supported Runtime Scope

- E2E evaluation is currently implemented for Spring Boot + Angular only
- Other backend/frontend combinations remain generation-only until evaluator support is added

## Key Decisions

| Decision | Why |
| --- | --- |
| Generic scripts | Support any allowed model, level, backend, and frontend |
| No root Node.js package | Keeps the repository lightweight and script-driven |
| Template prompt composition | Avoids duplicated stack-specific prompt files |
| Separate generation and evaluation | Keeps outputs inspectable and repeatable |
| One active workspace per model and level | Supports direct overview vs detailed comparison |
| Compile-first E2E flow | Prevents runtime testing of projects that do not build |
