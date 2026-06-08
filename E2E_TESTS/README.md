# E2E Tests

End-to-end test suite for validating generated full-stack projects. Tests compile projects, run Docker Compose, and verify API/frontend availability.

## Running E2E Tests

### Test a single project:
```bash
cd E2E_TESTS
npm run test:e2e -- \
  --project-dir ../WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file ../RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-results.json
```

### Test with custom timeouts:
```bash
npm run test:e2e -- \
  --project-dir ../WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --build-timeout 1200000 \
  --compose-timeout 120000
```

## Test Phases

1. **Build Phase** (8-15 min per project)
   - Maven build for Spring Boot backends
   - npm install + npm build for Angular/React frontends
   - Validates project compilation

2. **Docker Startup** (1-2 min)
   - Runs `docker compose up -d`
   - Verifies services start correctly

3. **Health Checks** (1-2 min)
   - Waits for services to be responsive
   - Checks common ports (8080, 3000, 4200, 80)

4. **API Testing**
   - Tests basic API endpoints (GET /health, /api/todos)
   - Validates backend is responding

5. **Frontend Testing**
   - Checks frontend is accessible on any exposed port
   - Validates application load

6. **Cleanup**
   - Runs `docker compose down`
   - Removes test containers

## Test Results Format

```json
{
  "status": "passed|partial|build_failed|docker_failed|health_failed|error",
  "startedAt": "2026-06-08T...",
  "finishedAt": "2026-06-08T...",
  "phases": {
    "build": { "status": "passed|failed", "backend": {...}, "frontend": {...} },
    "docker": { "status": "started|failed" },
    "health": { "ready": true|false },
    "api": { "total": 5, "passed": 4, "failed": 1, "tests": [...] },
    "frontend": { "accessible": true, "total": 4, "passed": 2, "failed": 2 }
  }
}
```

## Static Analysis

For code quality checks without runtime testing:

```bash
npm run test:static -- \
  --project-dir ../WORKSPACE/opencode-glm-5.1/overview \
  --results-file ../RESULTS/opencode-glm-5.1/spring-boot-angular/overview/static-results.json
```

## Supported Stacks

- **Backend**: Spring Boot, Node.js
- **Frontend**: Angular, React

Other combinations will report as "not implemented" in results.

## Performance Notes

- Full E2E test: 20-40 minutes per project
  - Build phase: 8-15 min (depends on harness quality)
  - Docker/startup: 2-3 min
  - Testing: 1-2 min
- Run tests in parallel for multiple projects using separate terminal sessions
- Cleanup is automatic; check `docker ps` after tests to ensure containers stopped
