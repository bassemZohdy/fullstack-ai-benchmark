---
name: e2e-testing
description: Run compile-first runtime validation, debug build and startup failures, and inspect E2E harness output. Use when working on `scripts/run-e2e-tests.sh`, `E2E_TESTS/`, or runtime benchmark failures.
---

# E2E Testing

## Overview

Use this skill when the task is to verify that a generated project builds and runs end to end. It focuses on the runtime harness, failure triage, and the stack currently supported by the benchmark.

## Workflow

1. Confirm the project directory, backend, frontend, and result path.
2. Run `scripts/run-e2e-tests.sh` against the generated workspace.
3. Expect compile-first behavior: if the project does not build, the runtime checks should stop early.
4. Review the helper outputs in `E2E_TESTS/helpers/` before changing the runner.
5. If cleanup or timeout behavior looks wrong, inspect the runner and the docker helper together.

## Supported Stack Coverage

**Full E2E Runtime Validation** (all phases: build → docker → api → frontend):
- Spring Boot + Angular ✅
- Spring Boot + React ✅
- Node.js + Angular ✅
- Node.js + React ✅

**Component Helpers**:
- Build validation: `E2E_TESTS/helpers/build-validator.js` (compiles backend, bundles frontend)
- Docker orchestration: `E2E_TESTS/helpers/docker-runner.js` (starts services via docker-compose)
- API validation: `E2E_TESTS/helpers/api-tester.js` (probes todo API: GET, POST, DELETE /api/todos)
- Frontend validation: `E2E_TESTS/helpers/frontend-tester.js` (checks bundle and routes)

## Common Failures

- Build tool missing or misconfigured
- Docker compose startup failure
- Health check timeout
- API endpoint mismatch or failure
- Frontend bundle or route failure
