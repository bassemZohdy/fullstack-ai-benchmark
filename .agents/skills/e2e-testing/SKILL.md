---
name: e2e-testing
description: Run compile-first runtime validation, debug build and startup failures, and inspect E2E harness output. Use when working on `scripts/run-e2e-tests.sh`, `E2E_TESTS/`, or runtime benchmark failures.
---

# E2E Testing

## Overview

Use this skill when the task is to verify that a generated project builds and runs end to end. It focuses on the runtime harness, failure triage, and the stacks supported by the benchmark.

Validation is compile-first: if the project does not build, the runtime phases (Docker, API, frontend) do not run.

## Supported Stack Coverage

**Full E2E Runtime Validation** (build → docker → api → frontend):
- Spring Boot + Angular ✅
- Spring Boot + React ✅
- Node.js + Angular ✅
- Node.js + React ✅

`quarkus` is generation-only; no E2E runner exists for it.

## Command Reference

```bash
./scripts/run-e2e-tests.sh \
  --project-dir <path> \
  --backend <backend> \
  --frontend <frontend> \
  [--results-file <file>] \
  [--build-timeout <ms>] \
  [--compose-timeout <ms>] \
  [--health-timeout <ms>]
```

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--project-dir` | yes | — | Path to generated project |
| `--backend` | yes | `spring-boot` | `spring-boot` or `node-js` |
| `--frontend` | yes | `angular` | `angular` or `react` |
| `--results-file` | no | — | Write JSON results to this path |
| `--build-timeout` | no | `900000` ms | Backend compile + frontend bundle time limit |
| `--compose-timeout` | no | `120000` ms | Docker Compose startup time limit |
| `--health-timeout` | no | `120000` ms | App health/readiness check time limit |

Timeout values are in milliseconds.

## Workflow

1. Confirm the project directory, backend, frontend, and result path.
2. Run `scripts/run-e2e-tests.sh` against the generated workspace.
3. The script validates the backend + frontend combination using `benchmark-support.sh` — it will reject unsupported stacks (quarkus, or any non-supported combo).
4. Review helper outputs in `E2E_TESTS/helpers/` before changing the runner.
5. If cleanup or timeout behavior looks wrong, inspect the runner and docker helper together.

## Working Examples

### Example 1: Basic run

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular
```

### Example 2: Save results to file

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-execution.json
```

### Example 3: Extended timeouts for slow systems

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/detailed \
  --backend spring-boot \
  --frontend angular \
  --build-timeout 1200000 \
  --compose-timeout 180000 \
  --health-timeout 180000
```

### Example 4: Node.js + React stack

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-kimi-2.6/overview \
  --backend node-js \
  --frontend react \
  --results-file RESULTS/opencode-kimi-2.6/node-js-react/overview/e2e-execution.json
```

## Component Helpers

| Helper | File | Purpose |
|--------|------|---------|
| Build validation | `E2E_TESTS/helpers/build-validator.js` | Compiles backend, bundles frontend |
| Docker orchestration | `E2E_TESTS/helpers/docker-runner.js` | Starts services via docker-compose |
| API validation | `E2E_TESTS/helpers/api-tester.js` | Probes todo API: GET/POST/DELETE /api/todos |
| Frontend validation | `E2E_TESTS/helpers/frontend-tester.js` | Checks bundle and routes |

## Result File Format

When `--results-file` is specified, the script writes JSON with this structure:

```json
{
  "status": "passed|partial|build_failed|docker_failed|health_failed|error",
  "startedAt": "2026-06-08T10:00:00.000Z",
  "finishedAt": "2026-06-08T10:35:00.000Z",
  "projectDir": "/path/to/project",
  "backend": "spring-boot",
  "frontend": "angular",
  "phases": {
    "build": { "status": "passed", "backend": { "status": "passed" }, "frontend": { "status": "passed" } },
    "docker": { "status": "started", "exitCode": 0, "duration": 120000 },
    "health": { "ready": true, "duration": 45000, "port": 80, "statusCode": 200 },
    "api": { "total": 4, "passed": 4, "failed": 0, "tests": [...] },
    "frontend": { "accessible": true, "total": 5, "passed": 2, "failed": 3, "tests": [...] },
    "cleanup": { "status": "stopped" }
  }
}
```

## Common Failures

| Failure | Likely Cause | Fix |
|---------|-------------|-----|
| Build tool missing | Maven/npm not installed or not in PATH | Install required build tools |
| Build compile error | Generated project has errors | Re-generate or inspect source |
| Docker compose fails | Services don't start cleanly | Increase `--compose-timeout`; verify Docker is running |
| Health check timeout | App needs longer startup | Increase `--health-timeout` |
| API endpoint mismatch | Generated backend used different routes | Check generated API against todo contract |
| Frontend not accessible | Bundle not served on expected port | Inspect generated Nginx/server config |

## File Locations

- Script: `scripts/run-e2e-tests.sh`
- Runner: `E2E_TESTS/e2e-runner.js`
- Support lib: `scripts/benchmark-support.sh`
- Full reference: `docs/E2E_TESTING.md`

## Related Skills

- **eval-complete-pipeline**: Run static + E2E together with result merging
- **environment-setup**: Validate Docker and build tools before E2E runs
- **cleanup-benchmark**: Remove failed E2E artifacts before re-running
