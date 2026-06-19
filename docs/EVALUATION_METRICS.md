# Evaluation Metrics and Scoring

## Overview

The benchmark uses a two-stage evaluation model:

1. Static analysis checks code structure, configuration, and integration readiness.
2. E2E testing validates build, deployment, health/readiness, the todo API contract, and frontend accessibility.

When both stages are available, the results are merged into one score.

## Static Evaluation

Static evaluation contributes 70 percent of the merged score.

### Categories

- Cartridge structure
- Code quality
- Docker deployment
- Kubernetes configuration
- Integration
- E2E and unit tests

## E2E Testing

E2E testing contributes 30 percent of the merged score when enabled.

### Phases

- Build success
- Docker deployment
- Service health/readiness
- Todo API contract
- Frontend accessibility
- Cleanup

Health/readiness requires an explicit successful health response. A bare `404` on `/health` is not treated as ready.

### API Contract

The supported Spring Boot stack is checked against the generated todo API, and all four checks are expected to run:

- `GET /api/todos`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `DELETE /api/todos/{id}`

If `POST /api/todos` does not return a usable `id`, the follow-up detail and delete checks fail explicitly.

## Merged Score

```text
Final Score = (Static Score * 0.7) + (E2E Score * 0.3)
```

## Quality Tiers

These tier names are benchmark labels, not deployment guarantees.

When E2E runtime validation fails, the merged tier is capped below deployable
status. A project that does not become healthy at runtime must not be reported
as `Deployable` or `Production-Ready`, even if the weighted numeric score is high.

| Score | Tier | Meaning |
| --- | --- | --- |
| 90-100 | Production-Ready | Highest benchmark tier |
| 75-89 | Deployable | Minor improvements remain |
| 60-74 | Functional | Significant improvements remain |
| 0-59 | Needs Work | Not yet ready for deployment |

## Result File Formats

### Static Evaluation Output

Contains:

- metadata
- quality scores
- category details
- strengths and weaknesses

### E2E Execution Output

Contains:

- status
- start and finish timestamps
- per-phase results
- cleanup status

### Merged Evaluation Output

Contains:

- merged static and runtime metadata
- overall score
- tier
- runtime validation status
- pass rates with and without E2E

## Notes

- Use real benchmark data only
- Do not invent scores or endpoint coverage
