---
name: eval-complete-pipeline
description: Run complete evaluation pipeline (static analysis + E2E testing + result merging) on a generated project. Use when you need comprehensive benchmark results with combined metrics.
---

# Complete Evaluation Pipeline

## Overview

Use this skill when you need to evaluate a generated project with full metrics: static code analysis, runtime E2E validation, and merged scoring. The pipeline runs three sequential steps and produces final benchmark results.

## Architecture

```
Generated Project
       ↓
   [STATIC]
   Static code analysis (5-10 sec)
   → static-evaluation.json
       ↓
   [E2E] (optional)
   Runtime: build → docker → api → frontend (20-40 min)
   → e2e-execution.json
       ↓
   [MERGE]
   Combine static + E2E with 70/30 weighting
   → evaluation-results.json (FINAL)
```

## Workflow

1. Ensure generated project exists and is complete
2. Run `./scripts/eval-complete.sh` with project details
3. Script automatically executes: static → E2E → merge
4. Final results written to `evaluation-results.json`
5. Inspect results for quality metrics

## Command Reference

```bash
./scripts/eval-complete.sh \
  --project-dir <path> \
  --backend <backend> \
  --frontend <frontend> \
  --results-dir <path> \
  [--model <model>] \
  [--level <level>] \
  [--provider <provider>] \
  [--harness <harness>] \
  [--skip-e2e] \
  [--build-timeout <ms>] \
  [--compose-timeout <ms>] \
  [--health-timeout <ms>]
```

### Required Parameters

| Parameter | Format | Example | Notes |
|-----------|--------|---------|-------|
| `--project-dir` | Path | `WORKSPACE/opencode-glm-5.1/overview` | Generated project location |
| `--backend` | Name | `spring-boot`, `node-js`, `quarkus` | Backend framework used; `quarkus` requires `--skip-e2e` |
| `--frontend` | Name | `angular`, `react` | Frontend framework used |
| `--results-dir` | Path | `RESULTS/opencode-glm-5.1/spring-boot-angular/overview` | Where to save results |

### Optional Parameters (Metadata)

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `--model` | Model used (recorded in results) | `GLM-5.1Z.AI` |
| `--level` | Spec level (recorded in results) | `overview`, `detailed` |
| `--provider` | Provider used (recorded in results) | `z-ai`, `openrouter` |
| `--harness` | Harness used (recorded in results) | `opencode`, `pi` |

### Optional Parameters (Control)

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `--skip-e2e` | Off | Skip E2E testing (static only) |
| `--build-timeout` | `900000` ms (15 min) | Backend build time limit |
| `--compose-timeout` | `120000` ms (2 min) | Docker compose startup time |
| `--health-timeout` | `120000` ms (2 min) | App health check time |

## Pipeline Steps Explained

### Step 1: Static Analysis

**Duration**: 5-10 seconds

**What it checks**:
- Project structure (directories, layout)
- Code quality (style, patterns, issues)
- Build configuration (pom.xml, package.json, etc.)
- Dependencies and versions
- Docker/compose files
- Integration signals
- E2E-related patterns

**Output**: `static-evaluation.json`

**Score**: Contributes 70% to final score

**Example static result**:
```json
{
  "summary": {
    "score": 85.5,
    "total_score": 100,
    "grade": "A"
  },
  "checks": {
    "structure": { "score": 90, "status": "passed" },
    "code_quality": { "score": 82, "status": "passed" },
    "build_config": { "score": 85, "status": "passed" },
    "docker": { "score": 88, "status": "passed" }
  }
}
```

### Step 2: E2E Runtime Testing (Optional)

**Duration**: 20-40 minutes per stack

**What it tests**:
1. **Build Phase**: Compile backend + bundle frontend (5-10 min)
2. **Docker Phase**: Start services via docker-compose (2-5 min)
3. **API Phase**: Probe REST endpoints (1 min)
4. **Frontend Phase**: Verify bundle and routes (2 min)

**Output**: `e2e-execution.json`

**Score**: Contributes 30% to final score (when available)

**Supported Stacks**:
- Spring Boot + Angular ✅
- Spring Boot + React ✅
- Node.js + Angular ✅
- Node.js + React ✅

**Example E2E result**:
```json
{
  "summary": {
    "score": 90,
    "status": "passed",
    "duration_seconds": 1800
  },
  "phases": {
    "build": { "status": "success", "duration": 300 },
    "docker": { "status": "success", "duration": 120 },
    "api": { "status": "success", "duration": 60 },
    "frontend": { "status": "success", "duration": 30 }
  }
}
```

### Step 3: Result Merging

**Duration**: <1 second

**What it does**:
- Combines static and E2E scores
- Applies weighting: 70% static + 30% E2E
- Produces unified report
- Records evaluation timestamp

**Output**: `evaluation-results.json` (FINAL)

**Formula**:
```
final_score = (static_score × 0.70) + (e2e_score × 0.30)
```

**Example merged result**:
```json
{
  "summary": {
    "final_score": 86.4,
    "static_score": 85.5,
    "e2e_score": 90,
    "static_weight": 0.70,
    "e2e_weight": 0.30,
    "grade": "B+",
    "status": "passed"
  },
  "metadata": {
    "model": "GLM-5.1Z.AI",
    "level": "overview",
    "backend": "spring-boot",
    "frontend": "angular",
    "evaluated_at": "2026-06-12T14:30:00Z"
  }
}
```

## Working Examples

### Example 1: Complete Pipeline (Static + E2E)

```bash
# Generate project first
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular

# Run complete evaluation
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview \
  --model GLM-5.1Z.AI \
  --level overview \
  --provider z-ai \
  --harness opencode

# Output files created:
# RESULTS/opencode-glm-5.1/spring-boot-angular/overview/
#   ├── static-evaluation.json
#   ├── e2e-execution.json
#   └── evaluation-results.json (merged)
```

### Example 2: Static Analysis Only

```bash
# Skip E2E if not supported or to save time
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-kimi-2.6/overview \
  --backend node-js \
  --frontend react \
  --results-dir RESULTS/opencode-kimi-2.6/node-js-react/overview \
  --skip-e2e

# Output files created:
# RESULTS/opencode-kimi-2.6/node-js-react/overview/
#   └── static-evaluation.json (only)
# 
# Note: No E2E results, so merged score = static score only
```

### Example 3: Extended Timeouts

```bash
# For slower systems or detailed specs
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/detailed \
  --backend spring-boot \
  --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/detailed \
  --model GLM-5.1Z.AI \
  --level detailed \
  --build-timeout 1200000 \
  --compose-timeout 180000 \
  --health-timeout 180000

# Extended timeouts:
# Build: 20 minutes (detailed spec might have more deps)
# Compose: 3 minutes (large containers)
# Health: 3 minutes (complex startup sequence)
```

### Example 4: Evaluate Multiple Stacks

```bash
# Evaluate all combinations for one model
for backend in spring-boot node-js; do
  for frontend in angular react; do
    ./scripts/eval-complete.sh \
      --project-dir "WORKSPACE/opencode-glm-5.1/overview/$backend" \
      --backend "$backend" \
      --frontend "$frontend" \
      --results-dir "RESULTS/opencode-glm-5.1/$backend-$frontend/overview" \
      --model GLM-5.1Z.AI \
      --level overview
  done
done
```

## Scoring Model

### Static Score Components

| Component | Weight | What's Measured |
|-----------|--------|-----------------|
| Structure | 20% | Directory layout, file organization |
| Code Quality | 30% | Style, patterns, best practices |
| Build Config | 25% | Tooling, dependencies, compatibility |
| Docker | 15% | Dockerfile, docker-compose quality |
| Integration | 10% | API contracts, integration patterns |

**Final static score**: 0-100

### E2E Score Components

| Component | Status | What's Measured |
|-----------|--------|-----------------|
| Build Success | Pass/Fail | Backend compiles, frontend bundles |
| Docker Success | Pass/Fail | Services start via docker-compose |
| API Contract | Pass/Fail | Endpoints respond correctly |
| Frontend Render | Pass/Fail | Bundle loads, routes work |

**Final E2E score**: 0-100 (success = 100, failure = 0, partial = graduated)

### Combined Score

```
final = (static_score × 0.70) + (e2e_score × 0.30)

Examples:
- Static 85, E2E 90 → (85 × 0.70) + (90 × 0.30) = 59.5 + 27 = 86.5
- Static 80, E2E fail → (80 × 0.70) + (0 × 0.30) = 56
- Static only → static_score (100% weight, since E2E not run)
```

## Result Files

### static-evaluation.json

Contains detailed static analysis scores and findings.

```json
{
  "model": "GLM-5.1Z.AI",
  "backend": "spring-boot",
  "frontend": "angular",
  "timestamp": "2026-06-12T14:30:00Z",
  "summary": { ... scores ... },
  "detailed_scores": { ... breakdown ... }
}
```

### e2e-execution.json

Contains runtime test results and timing.

```json
{
  "backend": "spring-boot",
  "frontend": "angular",
  "timestamp": "2026-06-12T14:31:00Z",
  "phases": {
    "build": { "status": "success", "duration_ms": 300000 },
    "docker": { "status": "success", "duration_ms": 120000 },
    "api": { "status": "success", "endpoints_tested": 5 },
    "frontend": { "status": "success", "routes_tested": 3 }
  },
  "summary": { "status": "passed", "score": 100 }
}
```

### evaluation-results.json (FINAL)

Merged final results with combined metrics.

```json
{
  "evaluation_id": "eval_1234567890",
  "timestamp": "2026-06-12T14:32:00Z",
  "model": "GLM-5.1Z.AI",
  "level": "overview",
  "backend": "spring-boot",
  "frontend": "angular",
  "provider": "z-ai",
  "harness": "opencode",
  "final_score": 86.4,
  "grade": "B+",
  "static_score": 85.5,
  "static_weight": 0.70,
  "e2e_score": 90.0,
  "e2e_weight": 0.30,
  "static_available": true,
  "e2e_available": true,
  "metrics": { ... detailed breakdown ... }
}
```

## Common Patterns

### Pattern 1: Complete Benchmark Run

```bash
# 1. Generate
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular

# 2. Evaluate completely
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview \
  --model GLM-5.1Z.AI \
  --level overview

# 3. View results
cat RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json | jq .
```

### Pattern 2: Quick Static-Only Validation

```bash
# Fast feedback during development
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot \
  --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview \
  --skip-e2e

# Takes ~10 seconds vs 30+ minutes
```

### Pattern 3: Multi-Level Evaluation

```bash
# Evaluate both spec levels
for level in overview detailed; do
  ./scripts/eval-complete.sh \
    --project-dir "WORKSPACE/opencode-glm-5.1/$level" \
    --backend spring-boot \
    --frontend angular \
    --results-dir "RESULTS/opencode-glm-5.1/spring-boot-angular/$level" \
    --model GLM-5.1Z.AI \
    --level "$level"
done
```

## Troubleshooting

### Issue: E2E Tests Fail During Build

**Cause**: Generated project has build errors

**Solution**:
1. Check build output in E2E logs
2. Inspect project for missing dependencies
3. Verify backend/frontend compilation
4. Re-generate if project is broken

### Issue: Docker Compose Fails to Start

**Cause**: Services not healthy after startup

**Solution**:
1. Increase `--compose-timeout` (default 2 min)
2. Check docker-compose.yml configuration
3. Verify Docker is running
4. Check available disk space/memory

### Issue: API Tests Fail

**Cause**: Endpoints not matching expected contract

**Solution**:
1. Check generated API routes
2. Verify it matches todo contract:
   - GET /api/todos
   - POST /api/todos
   - DELETE /api/todos/{id}
3. Check API implementation in generated code

### Issue: Results Directory Not Created

**Cause**: Path doesn't exist or permissions issue

**Solution**:
```bash
# Ensure results directory exists
mkdir -p RESULTS/opencode-glm-5.1/spring-boot-angular/overview

# Check permissions
ls -la RESULTS/
```

## File Locations

- Script: `scripts/eval-complete.sh`
- Static evaluator: `EVAL/comprehensive-evaluator.js`
- E2E runner: `E2E_TESTS/e2e-runner.js`
- Result merger: `EVAL/e2e-results-merger.js`

## Dependencies

- Node.js (for evaluation execution)
- Docker & Docker Compose (for E2E testing)
- Backend build tools:
  - Maven/Gradle (for Spring Boot)
  - npm/yarn (for Node.js)

## Performance

| Phase | Duration | Notes |
|-------|----------|-------|
| Static Analysis | 5-10 sec | Lightweight file scanning |
| Build (Spring Boot) | 5-10 min | First build is slow |
| Build (Node.js) | 2-5 min | Faster than Java |
| Docker Startup | 2-5 min | Depends on image size |
| API Testing | 1-2 min | 5 endpoints tested |
| Frontend Testing | 1-2 min | Bundle and routes |
| **Total** | **20-40 min** | Varies by stack |

## Related Skills

- **project-generation**: Generate projects to evaluate
- **evaluation-workflow**: Understand scoring in detail
- **e2e-testing**: Debug individual E2E failures
- **cleanup-benchmark**: Remove results for re-evaluation
