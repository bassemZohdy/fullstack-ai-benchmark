# Evaluation Integration Guide

**Status**: ✅ COMPLETE | **Commit**: `f640f2a` | **Date**: 2026-06-08

## What Was Delivered

A unified evaluation system that combines static code analysis with runtime E2E testing into a single comprehensive quality score:

```
Static Analysis (70%)     +     E2E Testing (30%)     =     Final Score
85/100                         92/100                        87/100
```

## The Complete Workflow

### One-Command Complete Evaluation
```bash
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --model GLM-5.1Z.AI \
  --level overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```

**What happens**:
1. **Static Analysis** (5-10 sec) - Code structure, architecture, quality checks
2. **E2E Testing** (20-40 min) - Build, Docker, API, frontend validation
3. **Result Merge** (1 sec) - Combines both into unified metrics
4. **Output** - Single `evaluation-results.json` with complete assessment

### Three-Phase Breakdown

#### Phase 1: Static Evaluation (Fast, Foundation)
```bash
./scripts/eval-generated-project.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/static-evaluation.json
```

**Tests**:
- Code organization (6 checks)
- Quality metrics (4 checks)
- Docker configuration (4 checks)
- Kubernetes setup (2 checks)
- Integration readiness (4 checks)
- Unit tests (2 checks)

**Score**: 0-100  
**Duration**: 5-10 seconds  
**Output**: `static-evaluation.json`

#### Phase 2: E2E Testing (Thorough, Reality)
```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-file RESULTS/e2e-execution.json
```

**Tests**:
- Backend compilation (Maven/npm)
- Frontend compilation (Angular/React build)
- Docker Compose startup
- Service health and readiness
- API endpoint availability
- Frontend accessibility

**Score**: 0-100  
**Duration**: 20-40 minutes  
**Output**: `e2e-execution.json`

#### Phase 3: Results Merge (Automatic)
```bash
node EVAL/e2e-results-merger.js \
  --static-results RESULTS/static-evaluation.json \
  --e2e-results RESULTS/e2e-execution.json \
  --output RESULTS/evaluation-results.json
```

**Formula**: `(static × 0.7) + (e2e × 0.3) = final`

**Score**: 0-100  
**Duration**: < 1 second  
**Output**: `evaluation-results.json`

## Result Files Explained

### evaluation-results.json (Final, Merged)
```json
{
  "metadata": {
    "evaluation_type": "comprehensive+e2e",
    "e2e_enabled": true,
    "e2e_duration_ms": 1200000
  },
  "quality": {
    "overall_score": 87,
    "overall_score_before_e2e": 85,
    "e2e_impact": 2,
    "tier": "Production-Ready"
  },
  "runtime_validation": {
    "e2e_score": 92,
    "executed": true,
    "passed": 18,
    "failed": 1
  }
}
```

**Key Fields**:
- `overall_score`: Final merged score (70% static, 30% E2E)
- `e2e_impact`: How much E2E testing changed the score
- `tier`: Quality classification (Production-Ready, Deployable, etc.)
- `runtime_validation`: Detailed E2E results

### static-evaluation.json (Code Analysis Only)
Contains:
- 6 evaluation categories (cartridge, code quality, docker, k8s, integration, tests)
- Category-specific scores
- Per-test results with details
- Lists of strengths and weaknesses

### e2e-execution.json (Runtime Testing Only)
Contains:
- 6 test phases (build, docker, health, api, frontend, cleanup)
- Per-phase status and metrics
- Individual test results
- Timing information

## Scoring Breakdown

### Static Evaluation (100 points)
| Category | Points | What It Tests |
|----------|--------|---------------|
| Cartridge Structure | 20 | Backend/frontend organization, dependencies |
| Code Quality | 15 | README, .env, .gitignore, structure |
| Docker Deployment | 20 | docker-compose, Dockerfiles, buildability |
| Kubernetes Config | 15 | K8s manifests, services, resources |
| Integration | 20 | API routes, service connections, ports |
| Unit Tests | 10 | Backend/frontend test files |

**Weight in final score**: 70%

### E2E Evaluation (100 points)
| Phase | Points | What It Tests |
|-------|--------|---------------|
| Build Success | 25 | Maven/npm compilation |
| Docker Startup | 20 | Service container launch |
| Service Health | 20 | Readiness/availability |
| API Functionality | 20 | Endpoint responses |
| Frontend | 15 | Application accessibility |

**Weight in final score**: 30%

### Quality Tiers
- **90-100**: Production-Ready (deploy with confidence)
- **75-89**: Deployable (requires minor fixes)
- **60-74**: Functional (significant improvements needed)
- **0-59**: Needs Work (not production-ready)

## Usage Patterns

### Pattern 1: Quick Validation (10 sec)
For fast feedback during development:
```bash
./scripts/eval-generated-project.sh --project-dir ... --results-file ...
# Get quick assessment without waiting 20-40 minutes
```

### Pattern 2: Full Validation (20-40 min)
For production readiness assessment:
```bash
./scripts/eval-complete.sh --project-dir ... --results-dir ...
# Get complete picture with both static and runtime validation
```

### Pattern 3: Benchmark Suite (Parallel)
For comparing multiple models:
```bash
# Terminal 1
./scripts/eval-complete.sh --project-dir WORKSPACE/model-1 --results-dir RESULTS/model-1 &

# Terminal 2
./scripts/eval-complete.sh --project-dir WORKSPACE/model-2 --results-dir RESULTS/model-2 &

# Terminal 3
./scripts/eval-complete.sh --project-dir WORKSPACE/model-3 --results-dir RESULTS/model-3 &

# Wait for all to complete, then aggregate
for dir in RESULTS/model-*/evaluation-results.json; do
  jq '.quality | {model: input_filename, score: .overall_score, tier: .tier}' "$dir"
done
```

## Querying Results

### View Final Score
```bash
jq '.quality.overall_score' RESULTS/evaluation-results.json
# Output: 87
```

### View Impact of E2E Testing
```bash
jq '.quality | {before: .overall_score_before_e2e, after: .overall_score, impact: .e2e_impact}' \
  RESULTS/evaluation-results.json
# Output: {"before": 85, "after": 87, "impact": 2}
```

### List All Failed Tests
```bash
jq '.runtime_validation.tests[] | select(.status == "failed") | .name' \
  RESULTS/evaluation-results.json
```

### Get E2E Phase Details
```bash
jq '.runtime_validation.phases' RESULTS/evaluation-results.json
```

### Aggregate Multiple Projects
```bash
jq -r '.quality.overall_score' RESULTS/*/evaluation-results.json | \
  awk '{sum+=$1; count++} END {print "Average: " sum/count}'
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Generate Project
  run: ./scripts/generate-project.sh --model GLM-5.1Z.AI --level overview ...

- name: Complete Evaluation
  run: ./scripts/eval-complete.sh --project-dir WORKSPACE/... --results-dir RESULTS/...

- name: Check Quality Gate
  run: |
    SCORE=$(jq '.quality.overall_score' RESULTS/evaluation-results.json)
    if [ $SCORE -lt 75 ]; then
      echo "Quality gate failed: $SCORE < 75"
      exit 1
    fi
```

### Local Development
```bash
# Generate → Evaluate → View Results
./scripts/generate-project.sh ... && \
./scripts/eval-complete.sh ... && \
jq '.quality' RESULTS/evaluation-results.json
```

## Performance Characteristics

| Operation | Time | Details |
|-----------|------|---------|
| Static analysis | 5-10 sec | Fast, deterministic |
| Build phase | 8-15 min | Maven builds are slowest |
| Docker startup | 2-3 min | Image pulls, container creation |
| Health checks | 30-60 sec | Port scanning, HTTP probes |
| API testing | 30-60 sec | 5-6 endpoints per backend |
| Frontend | 30-60 sec | 4-port scan + app paths |
| Result merge | <1 sec | JSON parsing and recalculation |
| **Total E2E** | **20-40 min** | Per project |

### Optimization Tips
1. **Skip E2E for fast feedback**: `./scripts/eval-generated-project.sh` (10 sec)
2. **Parallelize E2E tests**: Run multiple projects in separate terminals
3. **Cache dependencies**: Docker layer caching speeds up rebuilds
4. **Use --skip-e2e during debugging**: Only enable when validating final builds

## Troubleshooting

### E2E Tests Timeout
**Symptom**: Build phase exceeds 15 minutes

**Solution**:
```bash
./scripts/eval-complete.sh ... --build-timeout 1800000  # 30 minutes
```

### Build Fails But Static Passes
**Symptom**: Code structure looks good, but Maven/npm fails

**Diagnosis**:
```bash
# Check what's in E2E results
jq '.runtime_validation.phases.build' RESULTS/e2e-execution.json
# Shows actual error messages
```

**Common Causes**:
- Missing dependencies in pom.xml or package.json
- Version conflicts
- Typos in source code
- Java version mismatch

### Docker Compose Fails to Start
**Symptom**: E2E shows docker phase failed

**Diagnosis**:
```bash
# Check docker-compose.yml syntax
docker-compose -f WORKSPACE/.../docker-compose.yml config

# Check for port conflicts
lsof -i :8080  # if backend uses port 8080
```

### Health Check Timeout
**Symptom**: Services start but health check fails

**Diagnosis**:
```bash
# Check if containers are actually running
docker ps | grep project-name

# Check container logs
docker logs <container-id>

# Check if port is actually listening
curl -v http://localhost:8080/health
```

## Customization

### Add New Static Checks
Edit `EVAL/comprehensive-evaluator.js` to add new test categories.

### Add New E2E Tests
Edit `E2E_TESTS/helpers/*.js` to add new testing phases or endpoints.

### Adjust Weights
Modify `EVAL/e2e-results-merger.js` line ~144 to change 0.7/0.3 split.

### Change Quality Tiers
Modify `EVAL/comprehensive-evaluator.js` function `getTier()` to adjust thresholds.

## Files Reference

### Core Evaluation
- `EVAL/comprehensive-evaluator.js` - Static analysis engine
- `EVAL/e2e-results-merger.js` - Results merging and scoring
- `E2E_TESTS/e2e-runner.js` - Runtime test orchestrator

### Scripts
- `scripts/eval-generated-project.sh` - Static eval wrapper
- `scripts/run-e2e-tests.sh` - E2E test wrapper
- `scripts/eval-complete.sh` - Complete pipeline wrapper

### Documentation
- `docs/EVALUATION_METRICS.md` - Detailed scoring formulas
- `E2E_IMPLEMENTATION_SUMMARY.md` - E2E testing guide
- `E2E_TESTS/README.md` - E2E test details

## Next Steps

1. **Run on real projects**: Test the evaluation pipeline on your generated projects
2. **Monitor performance**: Track static vs E2E scores to identify patterns
3. **Tune timeouts**: Adjust if your projects consistently exceed defaults
4. **Add custom checks**: Extend evaluators for your specific requirements
5. **Integrate with CI**: Add evaluation gates to your build pipeline

## Example Output

```json
{
  "quality": {
    "overall_score": 87,
    "tier": "Production-Ready",
    "pass_rate_including_e2e": 0.91,
    "total_tests_including_e2e": 43,
    "total_passed_including_e2e": 39,
    "total_failed_including_e2e": 4,
    "overall_score_before_e2e": 85,
    "e2e_impact": 2
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

This tells you: Generated project scores 87/100 (Production-Ready tier). Static code analysis gave 85; runtime testing confirmed quality with 92/100, resulting in +2 point boost from E2E validation.
