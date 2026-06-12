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

## Harness Skills

Use these skills when selecting or configuring a generation harness. Start with `harness-base` to pick the right tool, then switch to the per-harness skill for invocation details.

| Skill | Harness | `--harness` value | Status |
|-------|---------|------------------|--------|
| `harness-base` | All | — | Orientation & routing |
| `harness-opencode` | OpenCode | `opencode` | Ready |
| `harness-pi` | PI | `pi` | Ready |
| `harness-claude` | Claude Code CLI | `claude` | Scaffolded |
| `harness-codex` | OpenAI Codex CLI | `codex` | Scaffolded |
| `harness-kilo-code` | Kilo Code | `kilo-code` | Scaffolded |
| `harness-mimo-code` | mimo-code | `mimo-code` | Scaffolded |

## Supplementary Documentation

| Document | Purpose |
|----------|---------|
| `project-generation/EXTENDED.md` | Session protocol, timeout monitoring, retry logic, session record schema |

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
| `generate-project.sh` (harness selection) | `harness-base` → `harness-<name>` | - |
| `cleanup-benchmark.sh` | `cleanup-benchmark` | - |
| `eval-generated-project.sh` | `evaluation-workflow` | - |
| `eval-complete.sh` | `eval-complete-pipeline` | - |
| `run-e2e-tests.sh` | `e2e-testing` | - |
| `run-benchmark.sh` | `project-generation` + `eval-complete-pipeline` | - |

## Key Features Documented

### Harness Selection
- **Skill**: `harness-base` → per-harness skill (`harness-opencode`, `harness-pi`, etc.)
- **Coverage**: CLI resolution, provider mapping, model normalization, session capture

### Session Management
- **Skill**: `project-generation` (EXTENDED.md section 1)
- **Coverage**: Resume protocol, session files, session export

### Timeout & Activity Monitoring
- **Skill**: `project-generation` (EXTENDED.md section 2)
- **Coverage**: Activity-based detection, hard limits, inactivity thresholds

### Retry Logic
- **Skill**: `project-generation` (EXTENDED.md section 3)
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
project-generation (EXTENDED.md section 2)
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
harness-base → project-generation → eval-complete-pipeline (run twice: once per harness)
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

## Skill Currency

All skills are verified against the actual script implementations. Key invariants:

- `benchmark-support.sh` is the single source of truth for valid levels, backends, frontends, harnesses, and providers
- `quarkus` is a valid backend for generation and static evaluation but not for E2E — always pair it with `--skip-e2e`
- E2E timeout params (`--build-timeout`, `--compose-timeout`, `--health-timeout`) are forwarded from `eval-complete.sh` through to `run-e2e-tests.sh`
- Workspace and results paths use the `{harness}-{model-slug}` prefix derived by `benchmark_slugify_model` in `benchmark-support.sh`

## Related Documentation

- **README.md**: User-facing project overview
- **docs/**: Architecture, evaluation system, E2E testing details
