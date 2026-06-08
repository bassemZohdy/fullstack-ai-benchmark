# Evaluation Metrics & Scoring

## Overview

The benchmark uses a comprehensive two-tier evaluation system:

1. **Static Analysis** (5-10 sec): Code structure, architecture, configuration quality
2. **E2E Testing** (20-40 min): Build validation, deployment, runtime behavior

Results can be merged for unified quality metrics incorporating both static and runtime validation.

## Static Evaluation Scores (70% weight)

### Cartridge Structure (20 points)
- Code properly organized in backend/frontend directories
- Required files present (pom.xml for Spring Boot, package.json for Node.js/Angular/React)
- Proper dependency declarations

### Code Quality (15 points)
- README.md documentation
- .env.example configuration template
- .gitignore file present
- Organized directory structure

### Docker Deployment (20 points)
- docker-compose.yml present
- Backend and frontend Dockerfiles
- Images buildable with `docker compose build --dry-run`

### Kubernetes Configuration (15 points)
- Deployment manifests present
- Service configurations defined
- Proper replicas and resource requests

### Integration (20 points)
- API controllers/routes defined
- Frontend services connecting to backend
- Environment configuration for backend URL
- Port mappings in docker-compose.yml

### E2E and Unit Tests (10 points)
- Backend unit tests (Test.java files)
- Frontend unit tests (.spec.ts files)
- Build tools configured

**Static Total**: 100 points

## E2E Testing Scores (30% weight, when enabled)

### Build Success (25 points)
- Backend compilation successful
- Frontend build successful

### Docker Deployment (20 points)
- Services start without errors
- docker-compose up -d succeeds

### Service Health (20 points)
- Services become responsive within 60 seconds
- Health/ready endpoints accessible

### API Functionality (20 points)
- Health endpoints respond (GET /health)
- API endpoints accessible (GET /api/todos)
- Status codes 200-399 (success range)

### Frontend Accessibility (15 points)
- Application loads on expected ports
- HTML content served
- Application is accessible to end users

**E2E Total**: 100 points (converted to 30% weight in merged scoring)

## Merged Evaluation Results

When both static and E2E results are available:

```
Final Score = (Static Score × 0.7) + (E2E Score × 0.3)
```

### Example Calculation
- Static Score: 85/100
- E2E Score: 92/100
- Final Score: (85 × 0.7) + (92 × 0.3) = 59.5 + 27.6 = **87.1/100**

### Quality Tiers
- **90-100**: Production-Ready
- **75-89**: Deployable
- **60-74**: Functional
- **0-59**: Needs Work

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
    "failed": 2,
    "scores": {
      "cartridge_structure": 95,
      "code_quality": 80,
      "docker_deployment": 90,
      "kubernetes_config": 85,
      "integration": 88,
      "e2e_and_other": 75
    }
  },
  "test_details": {
    "cartridge_structure": {
      "passed": 4,
      "failed": 0,
      "score": 95,
      "max": 20,
      "tests": [...]
    }
    // ... other categories
  },
  "strengths": ["pom.xml exists", "Spring Boot dependencies configured", ...],
  "weaknesses": ["No Kubernetes replicas configured", ...],
  "status": "COMPLETED"
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
      "tests": [...]
    },
    "frontend": {
      "accessible": true,
      "total": 4,
      "passed": 3,
      "failed": 1,
      "tests": [...]
    },
    "cleanup": {
      "status": "stopped"
    }
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
    "e2e_enabled": true,
    "e2e_timestamp": "2026-06-08T10:35:00.000Z",
    "e2e_duration_ms": 1200000
  },
  "quality": {
    "overall_score": 87,
    "overall_score_before_e2e": 85,
    "e2e_impact": 2,
    "tier": "Production-Ready",
    "pass_rate_including_e2e": 0.91,
    "static_scores": {
      "cartridge_structure": 95,
      "code_quality": 80,
      ...
    }
  },
  "runtime_validation": {
    "executed": true,
    "status": "passed",
    "e2e_score": 92,
    "passed": 18,
    "failed": 1,
    "total": 19,
    "tests": [
      {
        "name": "Backend builds successfully",
        "status": "passed",
        "details": ""
      },
      {
        "name": "Frontend builds successfully",
        "status": "passed",
        "details": ""
      },
      {
        "name": "Docker Compose services start",
        "status": "passed",
        "details": ""
      },
      {
        "name": "Services reach health/ready state",
        "status": "passed",
        "details": "",
        "duration_ms": 45000
      },
      {
        "name": "API endpoint: Health endpoint responds",
        "status": "passed",
        "details": "Status: 200"
      },
      {
        "name": "API endpoint: GET /api/todos",
        "status": "passed",
        "details": "Status: 200"
      },
      {
        "name": "Frontend: Frontend accessible on port 80",
        "status": "passed",
        "details": "Status: 200"
      }
    ],
    "phases": {
      "build": {...},
      "docker": {...},
      "health": {...},
      "api": {...},
      "frontend": {...}
    }
  },
  "test_details": {
    // ... all static test details
  },
  "strengths": [...],
  "weaknesses": [...]
}
```

## Usage Examples

### View Static Score Only
```bash
jq '.quality.overall_score' RESULTS/static-evaluation.json
# Output: 85
```

### View E2E Score
```bash
jq '.runtime_validation.e2e_score' RESULTS/evaluation-results.json
# Output: 92
```

### View Final Merged Score
```bash
jq '.quality.overall_score' RESULTS/evaluation-results.json
# Output: 87
```

### Compare Before/After E2E
```bash
jq '{before: .quality.overall_score_before_e2e, after: .quality.overall_score, impact: .quality.e2e_impact}' RESULTS/evaluation-results.json
# Output: {"before": 85, "after": 87, "impact": 2}
```

### Get All Failed Tests
```bash
jq '.test_details[] | select(.failed > 0) | {name: .name, failed: .failed, tests: [.tests[] | select(.status == "failed")]}' RESULTS/evaluation-results.json
```

## Benchmark Aggregation

For multi-model benchmarks, aggregate results across all projects:

```bash
# Collect all final scores
jq -r '.quality.overall_score' RESULTS/*/evaluation-results.json | sort -n

# Calculate average score per model
for model in opencode-glm-5.1 opencode-kimi-2.6; do
  scores=$(jq -r '.quality.overall_score' RESULTS/$model/*/evaluation-results.json)
  avg=$(echo "$scores" | awk '{sum+=$1; count++} END {print sum/count}')
  echo "$model: $avg"
done
```

## Integration with CI/CD

The evaluation pipeline integrates cleanly into CI workflows:

```bash
# Generate → Evaluate → Report
./scripts/generate-project.sh ... && \
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview && \
jq '.quality | {score: .overall_score, tier: .tier, passed: .total_passed_including_e2e, total: .total_tests_including_e2e}' \
  RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json
```

## Performance Impact

| Evaluation Type | Duration | Output Size |
|-----------------|----------|-------------|
| Static only | 10 sec | ~50 KB |
| E2E only | 20-40 min | ~150 KB |
| Combined (static + E2E) | 20-40 min | ~200 KB |

For faster feedback, run static evaluation first (10 sec); add E2E testing for full validation.
