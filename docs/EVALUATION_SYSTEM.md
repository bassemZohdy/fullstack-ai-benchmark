# Evaluation System

Complete evaluation pipeline combining **static code analysis** (22 checks) with **E2E runtime testing** (18+ checks) into unified quality metrics.

## Architecture

```
Static Analysis (70%)       E2E Testing (30%)        Merged Result
├─ Code structure          ├─ Build validation       ├─ Final Score
├─ Quality signals         ├─ Docker deployment      ├─ Quality Tier
├─ Docker config           ├─ Service health        ├─ E2E Impact
├─ Kubernetes setup        ├─ API testing           └─ Component Scores
├─ Integration signals     └─ Frontend checks
└─ Unit tests
```

## Evaluation Modes

### Mode 1: Static Analysis Only (Fast)
```bash
./scripts/eval-generated-project.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular
```
**Duration**: 5-10 seconds  
**Output**: Code quality score only

### Mode 2: Complete Evaluation (Comprehensive)
```bash
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```
**Duration**: 20-40 minutes  
**Output**: Unified quality score (static + E2E)

### Mode 3: Full Benchmark Pipeline
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
```
**Duration**: ~35-50 minutes  
**Output**: Generated project + complete evaluation

## Static Analysis (22 checks)

### Categories (6)
| Category | Checks | What It Tests |
|----------|--------|---------------|
| Cartridge Structure | 4 | Backend/frontend organization, dependencies |
| Code Quality | 4 | README, .env.example, .gitignore, structure |
| Docker Deployment | 4 | docker-compose, Dockerfiles, buildability |
| Kubernetes Config | 2 | K8s manifests, services, resources |
| Integration | 4 | API routes, service connections, ports |
| Unit Tests | 2 | Backend/frontend test files |

### Score Weight in Final Result
**70%** of unified quality score

## E2E Testing (18+ checks)

See [E2E_TESTING.md](./E2E_TESTING.md) for complete details.

### Phases (6)
| Phase | Checks | What It Tests | Duration |
|-------|--------|---------------|----------|
| Build | 2 | Backend/frontend compilation | 8-15 min |
| Docker | 1 | Compose startup | 1-2 min |
| Health | 1 | Service readiness | 30-60 sec |
| API | 5-6 | Endpoint responses | 30-60 sec |
| Frontend | 4 | HTML serving, accessibility | 30-60 sec |
| Cleanup | 1 | Container removal | 15-30 sec |

### Score Weight in Final Result
**30%** of unified quality score

## Scoring Formula

```
Final Score = (Static Score × 0.7) + (E2E Score × 0.3)
```

**Example**:
- Static: 85/100
- E2E: 92/100
- Final: (85 × 0.7) + (92 × 0.3) = 59.5 + 27.6 = **87.1/100**

## Quality Tiers

| Score | Tier | Meaning |
|-------|------|---------|
| 90-100 | Production-Ready | ✅ Deploy with confidence |
| 75-89 | Deployable | ⚠️ Minor improvements |
| 60-74 | Functional | ⚠️ Significant improvements |
| 0-59 | Needs Work | ❌ Not production-ready |

## Result Files

### evaluation-results.json (Unified, when E2E enabled)
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
    "tier": "Production-Ready",
    "pass_rate_including_e2e": 0.91,
    "static_scores": {
      "cartridge_structure": 95,
      "code_quality": 80,
      "docker_deployment": 90,
      "kubernetes_config": 85,
      "integration": 88,
      "e2e_and_other": 75
    }
  },
  "runtime_validation": {
    "executed": true,
    "status": "passed",
    "e2e_score": 92,
    "passed": 18,
    "failed": 1,
    "total": 19,
    "phases": { ... }
  }
}
```

### static-evaluation.json (Code Analysis Only)
Contains:
- 6 evaluation categories
- Category-specific scores
- Per-test results
- Strengths and weaknesses lists

### e2e-execution.json (Runtime Testing Only)
Contains:
- 6 test phases
- Per-phase status
- Individual test results
- Timing information

## Supported Stacks

✅ End-to-end evaluation: Spring Boot + Angular  
✅ Generation-only: Spring Boot + React, Node.js + Angular, Node.js + React

Other combinations report as "not implemented" in the runtime evaluators.

## Usage Patterns

### Pattern 1: Fast Feedback
For development iteration:
```bash
./scripts/eval-generated-project.sh --project-dir ... --results-file ...
# Get instant feedback (~10 sec)
```

### Pattern 2: Full Validation
For production readiness:
```bash
./scripts/eval-complete.sh --project-dir ... --results-dir ...
# Get comprehensive assessment (~40 min)
```

### Pattern 3: Benchmark Suite
For comparing multiple models:
```bash
# Run in parallel
./scripts/eval-complete.sh --project-dir WORKSPACE/model-1 --results-dir RESULTS/model-1 &
./scripts/eval-complete.sh --project-dir WORKSPACE/model-2 --results-dir RESULTS/model-2 &

# Aggregate results
jq -r '.quality.overall_score' RESULTS/*/evaluation-results.json | \
  awk '{sum+=$1; count++} END {print "Average: " sum/count}'
```

## Querying Results

```bash
# Final score
jq '.quality.overall_score' RESULTS/evaluation-results.json

# Impact of E2E testing
jq '.quality | {before: .overall_score_before_e2e, after: .overall_score, impact: .e2e_impact}' \
  RESULTS/evaluation-results.json

# Failed tests
jq '.runtime_validation.tests[] | select(.status == "failed") | .name' \
  RESULTS/evaluation-results.json

# E2E phase details
jq '.runtime_validation.phases' RESULTS/evaluation-results.json
```

## Customization

### Add Static Checks
Edit `EVAL/comprehensive-evaluator.js` to add new categories.

### Add E2E Tests
Edit `E2E_TESTS/helpers/*.js` to add new testing phases.

### Adjust Weights
Modify `EVAL/e2e-results-merger.js` to change 0.7/0.3 split.

### Change Quality Tiers
Modify `EVAL/comprehensive-evaluator.js` function `getTier()`.

## CI/CD Integration

```bash
# Quality gate example
./scripts/run-benchmark.sh ... && \
SCORE=$(jq '.quality.overall_score' RESULTS/evaluation-results.json)
if [ $SCORE -lt 75 ]; then
  echo "Quality gate failed: $SCORE < 75"
  exit 1
fi
```

## Components

- **Static Evaluator**: `EVAL/comprehensive-evaluator.js`
- **E2E Engine**: `E2E_TESTS/e2e-runner.js`
- **Results Merger**: `EVAL/e2e-results-merger.js`
- **Wrappers**:
  - `scripts/eval-generated-project.sh` (static)
  - `scripts/run-e2e-tests.sh` (E2E)
  - `scripts/eval-complete.sh` (full pipeline)
