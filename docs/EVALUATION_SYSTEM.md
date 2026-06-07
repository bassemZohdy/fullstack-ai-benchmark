# Evaluation System

The benchmark uses a single comprehensive evaluator at `EVAL/comprehensive-evaluator.js`. The public entry point is `scripts/eval-generated-project.sh`.

## What It Checks

- Cartridge structure for the selected backend and frontend
- Code quality signals such as README, `.env.example`, `.gitignore`, and top-level backend/frontend separation
- Docker deployment readiness
- Kubernetes configuration
- Integration signals between backend, frontend, and compose wiring
- E2E and supporting project files

## Score Weights

| Category | Weight |
| --- | ---: |
| Cartridge structure | 20 |
| Code quality | 15 |
| Docker deployment | 20 |
| Kubernetes config | 15 |
| Integration | 20 |
| E2E and other | 10 |

Overall score is the weighted average of those category scores.

## Result Schema

The evaluator writes a JSON file with:

- `metadata` for model, provider, harness, level, backend cartridge, frontend cartridge, timestamp, and evaluation version
- `quality` with overall score, tier, pass rate, counts, and category scores
- `test_details` for each category with pass/fail counts and individual checks
- `strengths` and `weaknesses` lists derived from test outcomes
- `status` set to `COMPLETED`

Generation telemetry such as session ids, token counts, and cost estimation belongs in `.opencode-session`, not in the evaluation result file.

## Tiers

| Score | Tier |
| ---: | --- |
| 90-100 | Production-Ready |
| 75-89 | Deployable |
| 60-74 | Functional |
| 0-59 | Needs Work |

## Current Scope

The current evaluator supports Spring Boot backend plus Angular frontend. Other cartridge combinations can still be generated, but they are not yet evaluated by this implementation and should fail fast instead of producing partial scores.
