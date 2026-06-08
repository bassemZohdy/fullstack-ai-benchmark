# Evaluation Metrics and Scoring

## Overview

The benchmark uses a two-stage evaluation model:

1. Static analysis checks code structure, configuration, and integration readiness.
2. E2E testing validates build, deployment, health, API behavior, and frontend accessibility.

When both stages are available, the results are merged into one score.

## Static Evaluation Scores

Static evaluation contributes 70 percent of the merged score.

### Cartridge Structure (20 points)
- Project files are organized correctly for the selected backend and frontend
- Required build files are present
- Dependency declarations are valid

### Code Quality (15 points)
- README documentation exists
- `.env.example` is present
- `.gitignore` is present
- Directory structure is coherent

### Docker Deployment (20 points)
- `docker-compose.yml` is present
- Backend and frontend Dockerfiles exist
- Images can be built

### Kubernetes Configuration (15 points)
- Deployment manifests are present
- Service definitions exist
- Replicas and resource requests are configured

### Integration (20 points)
- API controllers or routes exist
- Frontend services connect to the backend
- Backend URL configuration is present
- Port mappings are defined in Docker Compose

### E2E and Unit Tests (10 points)
- Backend unit tests exist
- Frontend unit tests exist
- Build tooling is configured

## E2E Testing Scores

E2E testing contributes 30 percent of the merged score when enabled.

### Build Success (25 points)
- Backend compilation succeeds
- Frontend build succeeds

### Docker Deployment (20 points)
- Services start cleanly
- `docker compose up -d` succeeds

### Service Health (20 points)
- Services become responsive within the configured timeout
- Health or ready endpoints are accessible

### API Functionality (20 points)
- Health endpoints respond
- API endpoints are reachable
- Success status codes are returned

### Frontend Accessibility (15 points)
- Application loads on the expected ports
- HTML content is served
- The app is reachable by a browser

## Merged Score

```text
Final Score = (Static Score * 0.7) + (E2E Score * 0.3)
```

### Example

- Static Score: 85/100
- E2E Score: 92/100
- Final Score: (85 * 0.7) + (92 * 0.3) = 87.1/100

## Quality Tiers

These tier names are benchmark labels, not deployment guarantees.

| Score | Tier | Meaning |
| --- | --- | --- |
| 90-100 | Production-Ready | Highest benchmark tier |
| 75-89 | Deployable | Minor improvements remain |
| 60-74 | Functional | Significant improvements remain |
| 0-59 | Needs Work | Not yet ready for deployment |

## Result File Formats

### Static Evaluation Output

```json
{
  "metadata": {
    "model": "GLM-5.1Z.AI",
    "provider": "z-ai",
    "harness": "opencode",
    "level": "overview",
    "backend_cartridge": "spring-boot",
    "frontend_cartridge": "angular",
    "timestamp": "2026-06-08T10:00:00.000Z",
    "evaluation_version": "4.0",
    "evaluation_type": "comprehensive"
  },
  "quality": {
    "overall_score": 85,
    "tier": "Production-Ready",
    "pass_rate": 0.92,
    "test_count": 24,
    "passed": 22,
    "failed": 2
  }
}
```

### E2E Execution Output

```json
{
  "status": "passed|partial|build_failed|docker_failed|health_failed|error",
  "startedAt": "2026-06-08T10:35:00.000Z",
  "finishedAt": "2026-06-08T10:55:00.000Z",
  "projectDir": "/path/to/project",
  "backend": "spring-boot",
  "frontend": "angular",
  "phases": {
    "build": { "status": "passed" },
    "docker": { "status": "started" },
    "health": { "ready": true },
    "api": { "total": 5, "passed": 5, "failed": 0 },
    "frontend": { "accessible": true, "total": 4, "passed": 3, "failed": 1 },
    "cleanup": { "status": "stopped" }
  }
}
```

### Merged Evaluation Output

```json
{
  "metadata": {
    "model": "GLM-5.1Z.AI",
    "provider": "z-ai",
    "harness": "opencode",
    "level": "overview",
    "evaluation_version": "4.1",
    "evaluation_type": "comprehensive+e2e",
    "e2e_enabled": true
  },
  "quality": {
    "overall_score": 87,
    "overall_score_before_e2e": 85,
    "e2e_impact": 2,
    "tier": "Production-Ready",
    "pass_rate_including_e2e": 0.91
  },
  "runtime_validation": {
    "executed": true,
    "status": "passed",
    "e2e_score": 92,
    "passed": 18,
    "failed": 1,
    "total": 19
  }
}
```
