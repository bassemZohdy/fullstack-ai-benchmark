---
name: harness-pi
description: Use PI as the generation harness. Covers binary installation via env var, provider/model mapping, session conventions, and working examples. Use when running generate-project.sh with --harness pi.
---

# PI Harness

## 1. Prerequisites & Install

PI is distributed as a binary. Point the benchmark at it via an environment variable:

```bash
export BENCHMARK_PI_CLI="/path/to/pi.cmd"   # Windows
export BENCHMARK_PI_CLI="/path/to/pi"       # Linux/macOS
```

Alternatively install PI to PATH so `pi` is resolvable. `generate-project.sh` checks `$BENCHMARK_PI_CLI`, `$PI_CLI`, `~/AppData/Local/pi-node/current/pi.cmd`, `~/AppData/Local/pi-node/current/pi`, and system PATH — in that order.

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BENCHMARK_PI_CLI` | Recommended | Explicit path to PI binary |
| `PI_CLI` | Alternative | Alternate env var for PI binary path |
| `OPENROUTER_API_KEY` | Only with `--provider openrouter` | OpenRouter authentication token |

## 3. CLI Invocation Pattern

PI runs from inside the output directory and reads the prompt from a file:

```bash
cd <output-directory>
pi \
  --provider <harness-provider> \
  --model <model-id> \
  --no-context-files \
  -p "@<rendered-prompt-file>"
```

`generate-project.sh` handles the `cd` via a subshell. Do not call `pi` directly.

## 4. Provider & Model Mapping

| `--provider` | PI provider string |
|---|---|
| `z-ai` | `zai-coding-cn` |
| `openrouter` | `openrouter` |

| `--model` | PI model string |
|---|---|
| `GLM-5.1Z.AI` | `glm-5.1` |
| `kimi/2.6` | `moonshotai/kimi-k2.6` |
| `minimax/1.5` | `minimax/minimax-m3` |
| `xiaomi/mimo-2.5` | `xiaomi/mimo-v2.5-pro` |

## 5. Session Management

PI tracks sessions internally. The benchmark does not capture or persist a PI session ID.

**Session files** in the output directory:

| File | Content |
|------|---------|
| `.pi-session-id` | Placeholder — empty (PI does not expose a session ID) |
| `.pi-session` | JSON audit record; `tokens` and `cost_usd` fields are `null` |

Session resume is not supported for PI. Each retry starts a fresh session.

## 6. generate-project.sh Integration

```bash
export BENCHMARK_PI_CLI="/path/to/pi"
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness pi \
  --provider z-ai
```

## 7. Working Examples

### Z.ai model
```bash
export BENCHMARK_PI_CLI="/home/user/.local/bin/pi"
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --harness pi
# Output: WORKSPACE/pi-glm-5.1/overview/
```

### Side-by-side comparison with OpenCode
```bash
# OpenCode run (default)
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular

# PI run (same model, separate output directory)
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --harness pi
# WORKSPACE/opencode-glm-5.1/overview/  ← OpenCode
# WORKSPACE/pi-glm-5.1/overview/        ← PI
```

### Fast iteration (PI is ~3× faster than OpenCode)
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend node-js --frontend react \
  --harness pi \
  --timeout 360
```

## File Locations

- Script functions: `scripts/generate-project.sh`
- Session/timeout/retry deep-dive: `skills/project-generation/EXTENDED.md`
