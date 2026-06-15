# Evaluation System

Complete evaluation combines static code analysis with compile-first E2E runtime testing into unified quality metrics.

## Architecture

```text
Static Analysis (70%)       E2E Testing (30%)        Merged Result
-> Code structure          -> Build validation       -> Final Score
-> Quality signals         -> Docker deployment      -> Quality Tier
-> Docker config           -> Service health         -> E2E Impact
-> Kubernetes setup        -> API contract checks    -> Component Scores
-> Integration signals     -> Frontend checks
-> Unit tests
```

## Evaluation Modes

### Static Analysis Only

```bash
node skills/evaluation-workflow/scripts/evaluate-static.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular
```

### Complete Evaluation

```bash
node skills/eval-complete-pipeline/scripts/evaluate-complete.js \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```

### Full Benchmark Pipeline

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
```

## Static Analysis

The comprehensive evaluator checks:

- Backend and frontend structure under separate top-level directories
- README, `.env.example`, and `.gitignore`
- Docker Compose and Dockerfiles
- Kubernetes manifests when present
- Backend/frontend integration signals
- Backend and frontend test files

## E2E Testing

See [E2E_TESTING.md](./E2E_TESTING.md) for runtime details.

Runtime scoring is based on:

- Build validation
- Docker startup
- Health/readiness
- Todo API contract checks
- Frontend accessibility
- Cleanup

## Quality Tiers

| Score | Tier | Meaning |
| ---: | --- | --- |
| 90-100 | Production-Ready | Deploy with confidence |
| 75-89 | Deployable | Minor improvements remain |
| 60-74 | Functional | Significant improvements remain |
| 0-59 | Needs Work | Not production-ready |

## Result Files

### evaluation-results.json

Contains:

- static scores
- runtime validation status
- merged score and tier
- pass rate with and without E2E
- runtime phase details

### static-evaluation.json

Contains:

- evaluation categories
- category scores
- per-test results
- strengths and weaknesses lists

### e2e-execution.json

Contains:

- phase status
- per-phase test results
- timings
- cleanup status

## Supported Stacks

- End-to-end evaluation: Spring Boot + Angular, Spring Boot + React, Node.js + Angular, Node.js + React
- Static-only evaluation: Quarkus + Angular, Quarkus + React

## Usage Patterns

- Use static evaluation for fast feedback
- Use complete evaluation for production-style validation
- Use the benchmark runner when comparing multiple models

## Querying Results

```bash
jq '.quality.overall_score' RESULTS/evaluation-results.json
jq '.runtime_validation.status' RESULTS/evaluation-results.json
jq '.runtime_validation.tests[] | select(.status == "failed") | .name' RESULTS/evaluation-results.json
```

## Customization

- Adjust static checks in `EVAL/comprehensive-evaluator.js`
- Adjust E2E checks in `E2E_TESTS/helpers/*.js`
- Adjust the static/E2E merge weights in `EVAL/e2e-results-merger.js`

## Components

- `EVAL/comprehensive-evaluator.js`
- `EVAL/e2e-results-merger.js`
- `E2E_TESTS/e2e-runner.js`
- `skills/evaluation-workflow/scripts/evaluate-static.js`
- `skills/e2e-testing/scripts/run-e2e.js`
- `skills/eval-complete-pipeline/scripts/evaluate-complete.js`
- `scripts/*.sh` compatibility/reference wrappers
