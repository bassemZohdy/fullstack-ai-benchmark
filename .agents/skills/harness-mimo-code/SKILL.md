---
name: harness-mimo-code
description: Use mimo-code as the generation harness. Binary is `mimo` (npm global package, v0.1.0). Interface mirrors OpenCode — uses --dir, --dangerously-skip-permissions, --file, -m, -s flags. Default model: mimo/mimo-auto.
---

# mimo-code Harness

## Status

**Implemented.** `--harness mimo-code` is fully supported in `generate-project.sh`.

Binary: `mimo` (installed at `/c/Users/Bassem/AppData/Roaming/npm/mimo`, v0.1.0)
No API key required — runs locally.

## 1. Prerequisites & Install

```bash
npm install -g mimocode   # or whatever the package name is
mimo --version            # verify: 0.1.0
```

No environment variables required for auth. The tool runs with local credentials.

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BENCHMARK_MIMO_CODE_CLI` | Optional | Override path to `mimo` binary |

## 3. CLI Invocation Pattern

```bash
mimo run \
  -m <provider/model> \
  --dir <output-dir> \
  --file <prompt-file> \
  --title "<session title>" \
  --dangerously-skip-permissions \
  [-s <session-id>] \
  "<message>"
```

Key flags:
- `-m` / `--model` — model in `provider/model` format
- `--dir` — directory for file creation (benchmark output dir)
- `--file` — attach file(s) to the message
- `--dangerously-skip-permissions` — auto-approve all tool use
- `-s` / `--session` — continue an existing session
- `--title` — session title (used for identification)

## 4. Provider & Model Mapping

Provider for mimo-code is passed through unchanged (the model string already encodes provider).

| `--model` arg | Resolved `mimo -m` value | Notes |
|---|---|---|
| `mimo/mimo-auto` | `mimo/mimo-auto` | Default auto-routing model |
| `xiaomi/mimo-v2.5` | `xiaomi/mimo-v2.5` | Specific Xiaomi model |
| `xiaomi/mimo-v2.5-pro` | `xiaomi/mimo-v2.5-pro` | Pro variant |
| `xiaomi/mimo-v2.5-pro-ultraspeed` | `xiaomi/mimo-v2.5-pro-ultraspeed` | Fastest |

Full model list: `mimo models`

## 5. Session Management

Sessions are tracked the same way as OpenCode.

| File | Content |
|------|---------|
| `.mimo-session-id` | Latest session ID (resume token) |
| `.mimo-session` | JSON audit record |

Session capture: `mimo session list --format json -n 1`
Session export: `mimo export <sessionID>`

Session JSON fields: `id`, `sessionID`, or `sessionId` (same probe as OpenCode).

## 6. generate-project.sh Integration

```bash
./scripts/generate-project.sh \
  --model mimo/mimo-auto \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness mimo-code \
  --provider mimo
# Output: WORKSPACE/mimo-code-mimo-mimo-auto/overview/
```

With a specific model:
```bash
./scripts/generate-project.sh \
  --model xiaomi/mimo-v2.5-pro \
  --level overview \
  --backend spring-boot --frontend angular \
  --harness mimo-code --provider mimo
# Output: WORKSPACE/mimo-code-xiaomi-mimo-v2-5-pro/overview/
```

## 7. Current Behavior

```
Model:        mimo/mimo-auto
Harness:      mimo-code
Harness Model: mimo/mimo-auto
Command:      mimo run -m mimo/mimo-auto --dir <OUTPUT_DIR> --file <PROMPT> \
                --title "benchmark ..." --dangerously-skip-permissions "<message>"
```

## 8. Gaps

None known. Harness is fully implemented. Flag any issues found during runs.
