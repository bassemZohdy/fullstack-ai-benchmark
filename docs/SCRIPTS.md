# Scripts Reference

The repository root is shell-only. Do not add root Node.js scripts for benchmark orchestration.

The shared supported matrix for levels, backends, frontends, harnesses, and providers lives in `scripts/benchmark-support.sh`. The shell scripts source that file so allowed values stay consistent.

## run-benchmark.sh

Main orchestrator.

```bash
./scripts/run-benchmark.sh [OPTIONS]
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
| `--quiet true|false` | `false` | no | Suppress detailed output |

The runtime benchmark currently supports Spring Boot + Angular only. Use other backend/frontend combinations for generation-only runs until matching evaluators exist.

## generate-project.sh

Generates one active project in the selected model-level workspace.

The script composes a rendered prompt from `PROMPTS/templates/project-generation.md`, the selected spec level, and cartridges under `PROMPTS/cartridges/`.

It clears generated files in the output directory before generation, preserving only `.opencode-session-id`. OpenCode then generates `README.md` itself and the script writes a structured `.opencode-session` file with attempt history plus token and cost metadata from `opencode export`.

Default generation timeout is `600` seconds.

## eval-generated-project.sh

Evaluates a generated project with the self-contained evaluator.

The script calls:

```bash
node EVAL/comprehensive-evaluator.js
```

It fails if the evaluator is missing, Node.js is unavailable, the generated project is missing, or the generated output has no recognizable application structure.

## test-setup.sh

Validates local setup and performs GLM workflow generation with `overview`.

By default, generated setup files are removed after validation. Use `--keep-test-files` only when you need to inspect the temporary output.

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
