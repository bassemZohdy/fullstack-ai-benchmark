---
name: benchmark-runner
description: Execute a full-stack benchmark run. Generate a project from spec, validate structure and build readiness, run static evaluation, and report results. Use when asked to run a benchmark, generate a benchmark project, evaluate a generated project, or execute a benchmark test for any model/harness/stack combination.
---

# Benchmark Runner

Execute a full-stack benchmark run end-to-end.

## Primary Approach (Script-Driven)

Use the benchmark scripts for all runs. This is the standard and recommended approach:

```bash
# Full benchmark (generate + evaluate)
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --harness opencode --provider z-ai

# Static evaluation only
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --harness opencode --provider z-ai --skip-e2e

# Reset and rerun
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --harness opencode --provider z-ai --reset
```

## Parameters

| Parameter | Values | Default |
|-----------|--------|---------|
| **Model** | `GLM-5.1Z.AI`, `kimi/2.6`, `xiaomi/mimo-v2.5` | — |
| **Spec level** | `overview`, `detailed` | `overview` |
| **Backend** | `spring-boot`, `node-js`, `quarkus` | `spring-boot` |
| **Frontend** | `angular`, `react` | `angular` |
| **Harness** | `opencode`, `pi`, `mimo-code`, `claude`, `codex`, `kilo-code` | `opencode` |
| **Provider** | `z-ai`, `openrouter`, `mimo` | `z-ai` |

## Alternative Approach (Agent-Driven)

For harnesses that don't support CLI invocation, the agent can generate files directly:

1. Read `PROMPTS/{level}.md`, `PROMPTS/cartridges/backend/{backend}.md`, `PROMPTS/cartridges/frontend/{frontend}.md`
2. Generate the full-stack project following the spec and cartridges
3. Run `EVAL/comprehensive-evaluator.js` for static scoring
4. Report results

This approach should only be used when scripts cannot be used.

## Evaluation Criteria

See `references/evaluation-criteria.md` for the scoring rubric used by `EVAL/comprehensive-evaluator.js`.

## Available Cartridges

| Backend | File |
|---------|------|
| Spring Boot | `PROMPTS/cartridges/backend/spring-boot.md` |
| Node.js | `PROMPTS/cartridges/backend/node-js.md` |
| Quarkus | `PROMPTS/cartridges/backend/quarkus.md` |

| Frontend | File |
|----------|------|
| Angular | `PROMPTS/cartridges/frontend/angular.md` |
| React | `PROMPTS/cartridges/frontend/react.md` |
