# Skills Index

Project-specific skills for the full-stack AI benchmark project. Each skill documents a major workflow with comprehensive details to ensure consistent outcomes across different agents.

## Core Skills

| Skill | Purpose | Script(s) |
|-------|---------|-----------|
| `repo-orientation` | Navigate repo, find scripts and docs, confirm supported stacks and conventions | All |
| `environment-setup` | Validate tools, dependencies, config files before benchmarking | `test-setup.sh` |
| `prompt-rendering` | Build final prompts from templates, specs, and cartridges | `render-prompt.sh` |
| `project-generation` | Generate projects with harness abstraction, session management, timeouts | `generate-project.sh` |
| `cleanup-benchmark` | Remove generated projects and results safely | `cleanup-benchmark.sh` |
| `evaluation-workflow` | Run static analysis and understand scoring model | `eval-generated-project.sh` |
| `eval-complete-pipeline` | Execute full pipeline: static → E2E → merge | `eval-complete.sh` |
| `e2e-testing` | Validate builds, Docker, API, and frontend | `run-e2e-tests.sh` |
| `docs-maintenance` | Keep documentation aligned with script behavior | README.md, docs/ |

## Supplementary Documentation

| Document | Purpose |
|----------|---------|
| `project-generation/EXTENDED.md` | Detailed implementation of harness abstraction, session management, timeouts, retries |

## Suggested Routing

### Start Here
- **Unsure where to begin?** → `repo-orientation`
- **Never run a benchmark before?** → `environment-setup` (first), then `project-generation`

### By Task Type

**I want to...**

| Task | Skills to Use | Order |
|------|---------------|-------|
| Validate my system is ready | `environment-setup` | 1 |
| Run a single project generation | `project-generation` | 1 |
| Build and test a generated project | `e2e-testing` | 1 |
| Get full benchmark results | `project-generation` → `eval-complete-pipeline` | 2 |
| Debug generation issues | `project-generation` (EXTENDED.md) | 1 |
| Debug E2E test failures | `e2e-testing` + `eval-complete-pipeline` | 2 |
| Reset a benchmark run | `cleanup-benchmark` | 1 |
| Update benchmark documentation | `docs-maintenance` | 1 |
| Create a new prompt variant | `prompt-rendering` | 1 |
| Run complete multi-stack benchmark | `environment-setup` → `project-generation` → `eval-complete-pipeline` | 3 |

### By Script Reference

| Script | Primary Skill | Extended Docs |
|--------|--------------|---|
| `test-setup.sh` | `environment-setup` | - |
| `render-prompt.sh` | `prompt-rendering` | - |
| `generate-project.sh` | `project-generation` | `EXTENDED.md` |
| `cleanup-benchmark.sh` | `cleanup-benchmark` | - |
| `eval-generated-project.sh` | `evaluation-workflow` | - |
| `eval-complete.sh` | `eval-complete-pipeline` | - |
| `run-e2e-tests.sh` | `e2e-testing` | - |
| `run-benchmark.sh` | `project-generation` + `eval-complete-pipeline` | - |

## Key Features Documented

### Harness Abstraction
- **Skill**: `project-generation` (EXTENDED.md section 1)
- **Coverage**: CLI resolution, provider mapping, model normalization

### Session Management
- **Skill**: `project-generation` (EXTENDED.md section 2)
- **Coverage**: Resume protocol, session files, session export

### Timeout & Activity Monitoring
- **Skill**: `project-generation` (EXTENDED.md section 4)
- **Coverage**: Activity-based detection, hard limits, inactivity thresholds

### Retry Logic
- **Skill**: `project-generation` (EXTENDED.md section 5)
- **Coverage**: Automatic retries, session resumption, attempt tracking

### Complete Evaluation Pipeline
- **Skill**: `eval-complete-pipeline`
- **Coverage**: Three-step orchestration (static → E2E → merge), scoring model, result files

### E2E Stack Coverage
- **Skill**: `e2e-testing`
- **Coverage**: All 4 stacks (Spring Boot + Angular/React, Node.js + Angular/React)

### Environment Validation
- **Skill**: `environment-setup`
- **Coverage**: Tools, harnesses, specs, evaluators, directories, credentials

## Navigation Examples

**Example 1: New developer, first benchmark**
```
environment-setup → repo-orientation → project-generation → eval-complete-pipeline
```

**Example 2: Debugging generation timeout**
```
project-generation (EXTENDED.md section 4)
```

**Example 3: E2E test failure investigation**
```
e2e-testing → eval-complete-pipeline (if need full pipeline)
```

**Example 4: Resetting a failed run**
```
cleanup-benchmark → project-generation
```

**Example 5: Multi-harness comparison**
```
project-generation → eval-complete-pipeline (run twice: once per harness)
```

## Quality Standards

Each skill includes:
- ✅ Clear overview of purpose and when to use
- ✅ Complete command reference with all parameters
- ✅ Working examples with real values
- ✅ Supported stacks and configurations
- ✅ Common failure modes and solutions
- ✅ Troubleshooting guide
- ✅ File locations and dependencies
- ✅ Performance expectations
- ✅ Links to related skills

## Critical Updates (2026-06-12)

**Fixed**:
- `e2e-testing`: Updated supported stacks (was "Spring Boot + Angular only", now correctly lists all 4)

**Created**:
- `cleanup-benchmark`: New skill for `cleanup-benchmark.sh`
- `eval-complete-pipeline`: New skill for `eval-complete.sh`
- `environment-setup`: New skill for `test-setup.sh`
- `project-generation/EXTENDED.md`: Detailed documentation for harness abstraction, session management, timeouts

**Enhanced**:
- `project-generation`: EXTENDED.md provides comprehensive implementation details
- `evaluation-workflow`: Aligned with new eval-complete-pipeline skill

## Related Documentation

- **SKILLS_AUDIT.md**: Detailed audit of skill coverage and gaps (for maintainers)
- **MEMORY.md**: Project memory including architecture decisions and performance baselines
- **README.md**: User-facing project overview
- **docs/**: Architecture, evaluation system, E2E testing details
