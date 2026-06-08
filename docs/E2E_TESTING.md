# E2E Testing System

## Overview

The E2E testing system validates generated full-stack applications through their complete lifecycle:
build validation -> Docker startup -> health/readiness -> API contract checks -> frontend checks -> cleanup.

The benchmark is compile-first. If the project does not build, the runtime phase stops before Docker startup or API checks.

## Usage

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-results.json
```

## Supported Stack

- E2E evaluation is currently implemented for Spring Boot + Angular only
- Other backend/frontend combinations remain generation-only until evaluator support is added

## Runtime Contract

The supported Spring Boot workspace is expected to expose the todo API under `/api/todos`:

- `GET /api/todos`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `DELETE /api/todos/{id}`

The frontend is served from the generated Nginx/container path and is validated on common ports:

- `80`
- `8080`
- `4200`
- `3000`

## Performance

| Phase | Typical Range | Notes |
| --- | --- | --- |
| Build | 8-15 min | Maven and npm builds dominate runtime |
| Docker | 1-3 min | Compose startup and image availability |
| Health | 30-120 sec | Polls common ports until an HTTP response appears |
| API | 30-60 sec | CRUD contract checks for the todo backend |
| Frontend | 30-60 sec | Verifies HTML serving and application paths |
| Cleanup | 15-30 sec | Stops containers after testing |

## Result Format

```json
{
  "status": "passed|partial|build_failed|docker_failed|health_failed|error",
  "startedAt": "2026-06-08T10:00:00.000Z",
  "finishedAt": "2026-06-08T10:35:00.000Z",
  "projectDir": "/path/to/project",
  "backend": "spring-boot",
  "frontend": "angular",
  "phases": {
    "build": {
      "status": "passed",
      "backend": { "status": "passed", "exitCode": 0 },
      "frontend": { "status": "passed", "exitCode": 0 }
    },
    "docker": {
      "status": "started",
      "exitCode": 0,
      "duration": 120000
    },
    "health": {
      "ready": true,
      "duration": 45000,
      "port": 80,
      "statusCode": 200
    },
    "api": {
      "total": 4,
      "passed": 4,
      "failed": 0,
      "tests": [
        { "name": "GET /api/todos", "status": "passed", "statusCode": 200 },
        { "name": "POST /api/todos", "status": "passed", "statusCode": 201 }
      ]
    },
    "frontend": {
      "accessible": true,
      "total": 5,
      "passed": 2,
      "failed": 3,
      "tests": [
        { "name": "Frontend accessible on Nginx (port 80)", "status": "passed", "statusCode": 200 }
      ]
    },
    "cleanup": {
      "status": "stopped"
    }
  }
}
```

## Customization

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --build-timeout 900000 \
  --compose-timeout 120000 \
  --health-timeout 120000
```

Defaults are:

- Build: `900000` ms
- Docker Compose: `120000` ms
- Health/readiness: `120000` ms
- Individual HTTP checks: `30000` ms

## Troubleshooting

- Build failures are handled before any Docker startup
- Health timeouts usually mean the supported stack needs longer than the default readiness window
- API failures usually mean the generated backend did not implement the todo CRUD contract
- Frontend failures usually mean the generated UI did not serve a page on a checked port

## Files

- `E2E_TESTS/e2e-runner.js` - Main orchestrator
- `E2E_TESTS/helpers/build-validator.js` - Compilation checks
- `E2E_TESTS/helpers/docker-runner.js` - Docker lifecycle and readiness checks
- `E2E_TESTS/helpers/api-tester.js` - Todo API contract checks
- `E2E_TESTS/helpers/frontend-tester.js` - Frontend checks
- `scripts/run-e2e-tests.sh` - Bash wrapper
