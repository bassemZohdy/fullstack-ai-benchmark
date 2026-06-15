# Scripts Reference

The repository root keeps shell wrappers for compatibility and reference only. Canonical execution goes through `harness/benchmark-harness.js` or skill-owned helpers under `skills/<skill>/scripts/`.

The shared supported matrix and reusable benchmark functions live in `skills/_shared/lib/benchmark.js`. Skill contracts call helpers under `skills/<skill>/scripts/`.

## Harness First

New orchestration should be added as loadable skills under `skills/*/skill.json` and executed by `harness/benchmark-harness.js`. Do not add new standalone host orchestration scripts.

Validate loadable skills:

```bash
node harness/benchmark-harness.js validate
```

List loadable skills:

```bash
node harness/benchmark-harness.js list
```

Run the benchmark directly through the harness:

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

Preview the planned skill order without running it:

```bash
node harness/benchmark-harness.js plan --workflow benchmark \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e
```

## run-benchmark.sh

Reference wrapper for the harness-loaded benchmark workflow.

```bash
./scripts/run-benchmark.sh [OPTIONS]
```

Equivalent wrapper command for previewing the plan:

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --skip-e2e --plan
```

Options:

| Option | Default | Required | Purpose |
| --- | --- | --- | --- |
| `--model <model>` | none | yes | Model id to use |
| `--level <level>` | none | yes | Spec level: `overview` or `detailed` |
| `--backend <backend>` | none | yes | Backend framework: `node-js`, `spring-boot`, `quarkus` |
| `--frontend <frontend>` | none | yes | Frontend framework: `react`, `angular` |
| `--harness <harness>` | `opencode` | no | Generation harness |
| `--provider <provider>` | `z-ai` | no | Provider namespace: `z-ai` or `openrouter` |
| `--auto-approve true|false` | `true` | no | Pass OpenCode's non-interactive permission approval flag |
| `--retries <count>` | `3` | no | Number of generation attempts before failing |
| `--skip-gen` | false | no | Evaluate an existing workspace |
| `--skip-eval` | false | no | Generate only |
| `--skip-e2e` | false | no | Skip runtime validation |
| `--reset` | false | no | Clear the selected workspace and results before the run starts |
| `--timeout <seconds>` | `600` | no | Generation timeout |
| `--health-timeout <ms>` | `120000` | no | E2E health/readiness timeout |
| `--quiet` | `false` | no | Suppress detailed harness output |
| `--plan` | `false` | no | Print the harness plan and exit |

E2E runtime validation is supported for Spring Boot + Angular, Spring Boot + React, Node.js + Angular, and Node.js + React. Use `quarkus` with `--skip-e2e` for static analysis only.

## Compatibility Wrappers

The scripts below remain callable for focused debugging and backward compatibility. Treat them as references for the underlying command; implementation belongs in the harness or skill-owned Node helpers.

## generate-project.sh

Reference wrapper for `skills/project-generation/scripts/generate-project.js`.

Generates one active project in the selected model-level workspace. The skill helper composes the prompt, invokes the selected harness, monitors activity, retries, and writes session metadata.

Default generation timeout is `600` seconds.

## eval-generated-project.sh

Reference wrapper for `skills/evaluation-workflow/scripts/evaluate-static.js`.

## test-setup.sh

Reference wrapper for `skills/environment-setup/scripts/validate-setup.js`.

## cleanup-benchmark.sh

Reference wrapper for `skills/cleanup-benchmark/scripts/cleanup.js`.

Use `--scope workspace`, `--scope results`, or `--scope all` when you need to reset a model/backend/frontend/level combination before rerunning a benchmark.

## render-prompt.sh

Reference wrapper for `skills/prompt-rendering/scripts/render-prompt.js`.

```bash
./scripts/render-prompt.sh \
  --template PROMPTS/templates/project-generation.md \
  --spec PROMPTS/overview.md \
  --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md \
  --frontend-cartridge PROMPTS/cartridges/frontend/angular.md \
  --level overview --backend spring-boot --frontend angular
```

## eval-complete.sh

Reference wrapper for `skills/eval-complete-pipeline/scripts/evaluate-complete.js`.

```bash
./scripts/eval-complete.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --model GLM-5.1Z.AI --level overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```

## run-e2e-tests.sh

Reference wrapper for `skills/e2e-testing/scripts/run-e2e.js`.

```bash
./scripts/run-e2e-tests.sh \
  --project-dir WORKSPACE/opencode-glm-5.1/overview \
  --backend spring-boot --frontend angular \
  --results-file RESULTS/opencode-glm-5.1/spring-boot-angular/overview/e2e-results.json
```

## test-regressions.sh

Reference wrapper for `skills/environment-setup/scripts/test-regressions.js`.

## Output Paths

```text
WORKSPACE/opencode-<model-slug>/<level>/
RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json
```

Model slugs are normalized from model ids. Examples:

| Model id | Slug |
| --- | --- |
| `GLM-5.1Z.AI` | `opencode-glm-5.1` |
| `kimi/2.6` | `opencode-kimi-2.6` |
| `minimax/1.5` | `opencode-minimax-1.5` |
| `xiaomi/mimo-2.5` | `opencode-xiaomi-mimo-2.5` |
