# Full-Stack Project Generation Benchmark

**Status**: ✅ Production-Ready | **Latest**: Integrated E2E evaluation with unified metrics

A comprehensive benchmarking system for comparing full-stack project generation across models and specifications, combining **static code analysis** + **E2E runtime testing** into unified quality metrics.

## Quick Start

### Generate and evaluate a project (quick - 10 sec)
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

### Full validation with E2E testing (complete - 20-40 min)
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
```

Output: `RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json`

## System Overview

```
Input: Model, Level, Backend, Frontend
  ↓
Generate Project (5-10 min)
  ├─ render-prompt.sh (templating)
  └─ generate-project.sh (orchestration)
  
Evaluate Project
  ├─ Quick Mode (--skip-e2e)
  │  └─ Static Analysis (5-10 sec)
  │     ├─ Code structure
  │     ├─ Quality metrics
  │     └─ Config validation
  │
  └─ Complete Mode (default)
     ├─ Static Analysis (5-10 sec)
     ├─ E2E Testing (20-40 min)
     │  ├─ Build validation
     │  ├─ Docker deployment
     │  ├─ API testing
     │  └─ Frontend checks
     └─ Merge Results → evaluation-results.json
```

## What's Implemented

✅ **Project Generation**
- OpenCode and PI harness support
- Automatic session tracking and retries
- Activity-based timeout monitoring (90s inactivity threshold)

✅ **Prompt Templating** (Separate, Reusable)
- Template + spec + cartridge combination
- Clean separation from generation

✅ **Static Evaluation** (Fast: 5-10 sec)
- 22 code quality checks
- Code organization, Docker, Kubernetes, integration readiness

✅ **E2E Testing** (Comprehensive: 20-40 min)
- Maven/npm build validation
- Docker Compose deployment and health checks
- API endpoint testing
- Frontend accessibility validation
- Automatic container cleanup

✅ **Unified Metrics** (Integrated)
- Formula: `(static × 0.7) + (E2E × 0.3) = final score`
- Quality tiers: Production-Ready | Deployable | Functional | Needs Work

✅ **Supported Stacks**
- Spring Boot + Angular, Spring Boot + React
- Node.js + Angular, Node.js + React

## Quality Tiers

| Score | Tier | Meaning |
|-------|------|---------|
| 90-100 | Production-Ready | ✅ Deploy with confidence |
| 75-89 | Deployable | ⚠️ Minor improvements needed |
| 60-74 | Functional | ⚠️ Significant improvements needed |
| 0-59 | Needs Work | ❌ Not production-ready |

## Result Files

**evaluation-results.json** (Unified metrics when E2E enabled):
```json
{
  "overall_score": 87,
  "tier": "Production-Ready",
  "e2e_impact": 2,
  "pass_rate_including_e2e": 0.91,
  "runtime_validation": {
    "e2e_score": 92,
    "executed": true,
    "passed": 18,
    "failed": 1
  }
}
```

## Repository Structure

```text
scripts/
├── generate-project.sh          # Project generation
├── render-prompt.sh             # Prompt templating (separate)
├── eval-generated-project.sh    # Static evaluation
├── run-e2e-tests.sh            # E2E testing
├── eval-complete.sh            # Complete pipeline
└── run-benchmark.sh            # Orchestrator (UPDATED)

EVAL/
├── comprehensive-evaluator.js   # Static analysis engine
└── e2e-results-merger.js       # Score merging

E2E_TESTS/
├── e2e-runner.js               # E2E orchestrator
└── helpers/                     # Build, Docker, API, Frontend testers

PROMPTS/
├── overview.md, detailed.md     # Specification levels
├── templates/project-generation.md
└── cartridges/                 # Backend and frontend templates

RESULTS/
└── opencode-<model>/<stack>/<level>/evaluation-results.json

docs/
└── Comprehensive documentation
```

## Evaluation Methods

### Option 1: Quick Feedback (10 sec)
```bash
./scripts/eval-generated-project.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular
```
Output: Code quality score only

### Option 2: Complete Validation (20-40 min)
```bash
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```
Output: Unified score (static + E2E)

### Option 3: Full Benchmark Pipeline
```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
```
Output: Generation + Evaluation + Complete results

## Documentation

**Quick Navigation**:
1. [docs/START.md](./docs/START.md) - Getting started
2. [docs/SCRIPTS.md](./docs/SCRIPTS.md) - Script reference
3. [docs/EVALUATION_SYSTEM.md](./docs/EVALUATION_SYSTEM.md) - How evaluation works
4. [docs/EVALUATION_METRICS.md](./docs/EVALUATION_METRICS.md) - Scoring details
5. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
6. [docs/RESULTS_FORMAT.md](./docs/RESULTS_FORMAT.md) - Output format
7. [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) - Completion status

**Component Guides**:
- E2E Testing: [docs/E2E_TESTING.md](./docs/E2E_TESTING.md)
- Metrics & Scoring: [docs/EVALUATION_METRICS.md](./docs/EVALUATION_METRICS.md)
- Integration: [docs/EVALUATION_SYSTEM.md](./docs/EVALUATION_SYSTEM.md)

## Performance Profile

| Scenario | Duration | Components |
|----------|----------|------------|
| Quick (--skip-e2e) | ~10 min | Generate + Static Analysis |
| Complete | ~35-50 min | Generate + Static + E2E + Merge |
| Static Only | ~10 sec | Code analysis (no generation) |
| E2E Only | ~20-40 min | Build + Docker + API tests |

## Integration with CI/CD

```bash
# Quality gate example
./scripts/run-benchmark.sh ... && \
SCORE=$(jq '.quality.overall_score' RESULTS/*/evaluation-results.json) && \
[ $SCORE -ge 75 ] || exit 1
```

## Project Rules

See [CLAUDE.md](./CLAUDE.md) for project contract, [AGENTS.md](./AGENTS.md) for commands.

**Key points**:
- Harness: OpenCode for generation
- Validation: Z.ai GLM (GLM-5.1Z.AI) + runtime E2E
- Specs: `overview` and `detailed` only
- Results include both static and runtime metrics
