# E2E Testing System

**Status**: ✅ Complete | **Commit**: `650b8ea`

## Overview

The E2E testing system validates generated full-stack applications through their complete lifecycle:
compilation → Docker deployment → health checks → API testing → frontend validation → cleanup.

## Test Phases

```
INPUT: Generated project directory
│
├─ BUILD PHASE (8-15 min)
│  ├─ Spring Boot: mvn clean package -DskipTests
│  ├─ Node.js: npm install
│  ├─ Angular: npm install && npm run build
│  └─ React: npm install && npm run build
│
├─ DOCKER STARTUP (1-2 min)
│  └─ docker compose up -d
│
├─ HEALTH CHECKS (30-60 sec)
│  └─ Port scanning + HTTP connectivity
│
├─ API TESTING (30-60 sec)
│  ├─ GET /health
│  └─ GET /api/todos
│
├─ FRONTEND TESTING (30-60 sec)
│  └─ Verify HTML served from common ports
│
├─ CLEANUP (15-30 sec)
│  └─ docker compose down
│
└─ OUTPUT: Test results (JSON format)
```

## Usage

### Quick Start
```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular
```

### With Result Output
```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-results.json
```

### Via npm (from E2E_TESTS directory)
```bash
cd E2E_TESTS
npm run test:e2e -- --project-dir ../WORKSPACE/opencode-glm-5.1/overview \
                     --backend spring-boot --frontend angular
```

## Performance

| Phase | Duration | Notes |
|-------|----------|-------|
| Build | 8-15 min | Maven builds are longest; varies by code quality |
| Docker | 2-3 min | Image pulls, service startup |
| Health Check | 30-60 sec | Port scanning with 2-second intervals |
| API Testing | 30-60 sec | 5-6 endpoint tests per backend |
| Frontend | 30-60 sec | 4-port scan, 1-2 app paths |
| Cleanup | 15-30 sec | Container removal |
| **TOTAL** | **20-40 min** | Per project |

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
      "duration": 45000
    },
    "api": {
      "total": 5,
      "passed": 5,
      "failed": 0,
      "tests": [
        { "name": "Health endpoint responds", "status": "passed", "statusCode": 200 },
        { "name": "GET /api/todos", "status": "passed", "statusCode": 200 }
      ]
    },
    "frontend": {
      "accessible": true,
      "total": 4,
      "passed": 3,
      "failed": 1,
      "tests": [
        { "name": "Frontend accessible on port 80", "status": "passed", "statusCode": 200 }
      ]
    },
    "cleanup": {
      "status": "stopped"
    }
  }
}
```

## Supported Stacks

✅ End-to-end evaluation: Spring Boot + Angular  
✅ Generation-only: Spring Boot + React, Node.js + Angular, Node.js + React

Other combinations report as "not implemented" in the runtime evaluators.

## Parallelization

Run tests on different projects in parallel:

```bash
# Terminal 1
./scripts/run-e2e-tests.sh --project-dir WORKSPACE/model-1 --backend spring-boot --frontend angular

# Terminal 2 (in parallel)
./scripts/run-e2e-tests.sh --project-dir WORKSPACE/model-2 --backend spring-boot --frontend angular
```

No shared resource conflicts; each test manages its own Docker containers independently.

## Customization

### Custom Timeouts
```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --build-timeout 1200000 \  # 20 min
  --compose-timeout 120000
```

### Timeout Defaults (milliseconds)
- Build: 900,000 (15 min)
- Docker Compose: 120,000 (2 min)
- Health Check: 60,000 (1 min)
- Individual Tests: 30,000 (30 sec)

## Troubleshooting

### Build Fails
- Check Maven/Node.js: `mvn --version`, `node --version`
- Review build output in logs
- Increase `--build-timeout` if necessary

### Docker Compose Fails
- Verify Docker: `docker --version`
- Check docker-compose.yml exists
- Ensure ports 8080, 3000, etc. not in use

### Health Check Timeout
- Services may be slow to start
- Check `docker logs <container-id>`

### API Tests Fail
- Verify backend is listening on expected port
- Check API endpoint existence in generated code
- Look for startup errors in Docker logs

### Frontend Not Found
- Verify Nginx/frontend is built and running
- Check port mappings in docker-compose.yml
- Ensure frontend build completed successfully

## Architecture Notes

**Why Separate from Static Evaluator?**
- Static evaluation: 10 seconds (fast, before deployment)
- E2E testing: 20-40 minutes (thorough, real-world)
- Different purposes: structure vs. functionality
- Can run independently or sequentially

**Health Check Strategy**
- Scans multiple ports (8080, 3000, 4200, 80)
- Uses HTTP requests to detect truly responsive services
- Better than just port scanning (avoids false positives)

**Build Timeouts**
- Maven builds can take 5-10 min even with `-q` flag
- npm installs vary widely depending on dependency tree
- 15 min default is conservative; most complete in 8-10 min

## Files

- `E2E_TESTS/e2e-runner.js` - Main orchestrator
- `E2E_TESTS/helpers/build-validator.js` - Compilation
- `E2E_TESTS/helpers/docker-runner.js` - Docker lifecycle
- `E2E_TESTS/helpers/api-tester.js` - API testing
- `E2E_TESTS/helpers/frontend-tester.js` - Frontend checks
- `scripts/run-e2e-tests.sh` - Bash wrapper
