# Benchmark Methodology

This benchmark evaluates generated full-stack projects with automated checks and a fixed scoring contract.

## Execution Model

- Harness: OpenCode
- Validation provider: Z.ai
- Matrix provider: OpenRouter
- Validation model: `GLM-5.1Z.AI`

## Metric Groups

The comprehensive evaluator uses these weighted categories:

| Category | Weight |
| --- | ---: |
| Cartridge structure | 20 |
| Code quality | 15 |
| Docker deployment | 20 |
| Kubernetes config | 15 |
| Integration | 20 |
| E2E and other | 10 |

## Quality Tiers

| Score | Tier |
| ---: | --- |
| 90-100 | Production-Ready |
| 75-89 | Deployable |
| 60-74 | Functional |
| 0-59 | Needs Work |

## Automated Checks

The evaluator checks for:

- Backend and frontend structure under separate top-level directories
- README, `.env.example`, and `.gitignore`
- Docker Compose and Dockerfiles
- Kubernetes manifests when present
- Backend/frontend integration signals
- Backend and frontend test files

The runtime evaluator checks:

- Build first
- Docker startup
- Health/readiness
- Todo API contract
- Frontend availability
- Cleanup

## Telemetry

Generation telemetry is captured by the generation script and stored in `.opencode-session`:

- Generation time
- Input tokens
- Output tokens
- Reasoning tokens
- Total tokens
- Estimated cost

## Fail-Fast Rules

The benchmark fails immediately when:

- The generated project directory is missing or empty
- The evaluator is missing
- Node.js is unavailable for `EVAL/comprehensive-evaluator.js`
- The generated output has no recognizable application structure
- The generation harness command fails

## Placeholder Values

Comparison tables should use `TBD` until actual runs produce values.
