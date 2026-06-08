# Getting Started

## 1. Validate Tools

```bash
./scripts/test-setup.sh --harness opencode --provider z-ai --auto-approve true --retries 3
```

## 2. Run GLM Workflow Validation

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --provider z-ai \
  --reset
```

Validation output:

```text
WORKSPACE/opencode-glm-5.1/overview/
RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json
```

If the runtime stack needs more time to become ready, add `--health-timeout 180000` to the same command.

## 3. Run Additional Benchmarks

After validation works, run benchmarks with different models and stacks using OpenRouter:

```bash
export OPENROUTER_API_KEY="your-key"
./scripts/run-benchmark.sh --model kimi/2.6 --level overview --backend spring-boot --frontend angular --provider openrouter
```

## Notes

- OpenCode is the harness for all current runs
- `--auto-approve true` passes OpenCode's `--dangerously-skip-permissions` flag so generation can write files without interactive prompts
- `--retries <count>` controls generation retry attempts
- `--timeout <seconds>` controls generation timeouts; the benchmark default is 600 seconds
- `--health-timeout <ms>` controls runtime readiness; the benchmark default is 120000 milliseconds
- `--reset` clears the selected workspace and results before a fresh rerun
- OpenCode session ids are persisted in `WORKSPACE/opencode-<model-slug>/<level>/.opencode-session-id` and reused with `opencode run --session <id>` when available
- Built-in levels are `overview` and `detailed`
- Active level workspaces are cleared before generation; `.opencode-session-id` is preserved and `.opencode-session` is refreshed
- The root project intentionally has no `package.json`

## Troubleshooting

**OPENROUTER_API_KEY not set**

Only required for `--provider openrouter`:

```bash
export OPENROUTER_API_KEY="your-key"
```
