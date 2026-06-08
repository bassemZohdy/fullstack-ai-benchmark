# Scripts Reference

The root project is shell-only. Do not add root Node.js scripts for benchmark orchestration.

The shared supported matrix for levels, backends, frontends, harnesses, and providers lives in [scripts/benchmark-support.sh](../scripts/benchmark-support.sh). The shell scripts source that file for validation so the allowed values stay consistent.

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
| `--auto-approve true\|false` | `true` | no | Pass OpenCode's non-interactive permission approval flag |
| `--retries <count>` | `3` | no | Number of generation attempts before failing |
| `--skip-gen` | false | no | Evaluate existing active workspace |
| `--skip-eval` | false | no | Generate only |
| `--timeout <seconds>` | `120` | no | Generation timeout |
| `--quiet true\|false` | `false` | no | Suppress detailed output |

Examples:

```bash
./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --provider z-ai
./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --skip-gen
```

Current end-to-end evaluation support is implemented for Spring Boot + Angular only. Use other backend/frontend combinations for generation-only runs until the matching evaluators exist.

## generate-project.sh

Generates one active project in the selected model-level workspace.

```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --output-dir WORKSPACE/opencode-glm-5.1/overview \
  --harness opencode \
  --provider z-ai \
  --auto-approve true \
  --retries 3
```

The script composes a rendered prompt from `PROMPTS/templates/project-generation.md`, the selected spec level, and cartridges under `PROMPTS/cartridges/`.

It clears generated files in the output directory before generation, preserving only `.opencode-session-id`. OpenCode then generates `README.md` itself and the script writes a structured `.opencode-session` file with attempt history plus token and cost metadata from `opencode export`. When `total` is missing, the script derives it from input, output, and reasoning tokens.

Internally it runs OpenCode non-interactively:

```bash
opencode run \
  --model zai-coding-plan/glm-5.1 \
  --file /tmp/benchmark-ai-prompt.<id> \
  --dir WORKSPACE/opencode-glm-5.1/overview \
  --title "benchmark GLM-5.1Z.AI spring-boot-angular overview" \
  --dangerously-skip-permissions \
  "Generate the complete full-stack project described in the attached rendered specification file..."
```

OpenCode documents `--model` as `provider/model`. The benchmark script builds that value from `--provider` and `--model`.

Retry and resume behavior:

```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --output-dir WORKSPACE/opencode-glm-5.1/overview \
  --retries 5 \
  --session-file WORKSPACE/opencode-glm-5.1/overview/.opencode-session-id
```

If `--session-file` exists, the script passes `--session <id>` to `opencode run`. After each attempt it asks OpenCode for the latest session and stores it back in that file when available. The richer per-run record is written to `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session`.

## eval-generated-project.sh

Evaluates a generated project with the self-contained evaluator.

```bash
./scripts/eval-generated-project.sh \
  --generated-dir WORKSPACE/opencode-glm-5.1/overview \
  --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview \
  --model GLM-5.1Z.AI \
  --provider z-ai \
  --harness opencode \
  --level overview \
  --backend spring-boot \
  --frontend angular
```

The script calls:

```bash
node EVAL/comprehensive-evaluator.js
```

It fails if the evaluator is missing, Node.js is unavailable, the generated project is missing, or the generated output has no recognizable application structure.

## test-setup.sh

Validates local setup and performs GLM workflow generation with `overview`.

```bash
./scripts/test-setup.sh --harness opencode --provider z-ai --auto-approve true --retries 3
```

By default, generated setup files are removed after validation. Use `--keep-test-files` only when you need to inspect the temporary `WORKSPACE/.test-setup/overview` output.

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
