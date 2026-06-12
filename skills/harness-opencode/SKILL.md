---
name: harness-opencode
description: Use OpenCode as the generation harness. Covers installation, provider/model mapping, session management, and working examples. Use when running generate-project.sh with --harness opencode (the default).
---

# OpenCode Harness

## 1. Prerequisites & Install

```bash
pip install opencode
opencode --version   # verify
```

Requires Python 3.8+. On Windows, ensure the `opencode` binary is on PATH after install.

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | Only with `--provider openrouter` | OpenRouter authentication token |

Z.ai credentials are embedded in the OpenCode binary; no key is needed for `--provider z-ai`.

## 3. CLI Invocation Pattern

```bash
opencode run \
  --model <provider>/<model-id> \
  --file <rendered-prompt-file> \
  --dir <output-directory> \
  --dangerously-skip-permissions \
  [--session <session-id>] \
  --title "benchmark <model> <backend>-<frontend> <level>" \
  "<generation-message>"
```

`generate-project.sh` constructs this command automatically. Do not call `opencode` directly.

## 4. Provider & Model Mapping

`generate-project.sh` translates `--provider` and `--model` to OpenCode-specific values before invoking the CLI.

| `--provider` | OpenCode provider string |
|---|---|
| `z-ai` | `zai-coding-plan` |
| `openrouter` | `openrouter` |

| `--model` | OpenCode model string |
|---|---|
| `GLM-5.1Z.AI` | `zai-coding-plan/glm-5.1` |
| `kimi/2.6` | `openrouter/moonshotai/kimi-k2.6` |
| `minimax/1.5` | `openrouter/minimax/minimax-m3` |
| `xiaomi/mimo-2.5` | `openrouter/xiaomi/mimo-v2.5-pro` |

## 5. Session Management

OpenCode creates a resumable session for every run. `generate-project.sh` captures and persists the session ID automatically after each attempt using `skills/harness-opencode/helpers/capture-session.sh`.

**Session files** in the output directory:

| File | Content |
|------|---------|
| `.opencode-session-id` | Single line — the resume token |
| `.opencode-session` | JSON from `opencode export <id>` — tokens, cost, timings |

**Resume a specific session**:
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --session-id ses_1453440baffe1MUkLhrVu1LI69
```

`generate-project.sh` also auto-loads the session ID from `.opencode-session-id` if the file exists and `--session-id` is not passed.

## 6. generate-project.sh Integration

```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness opencode \
  --provider z-ai
```

`--harness opencode` is the default; omit it for Z.ai runs.

## 7. Working Examples

### Z.ai model (default)
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular
# Output: WORKSPACE/opencode-glm-5.1/overview/
```

### OpenRouter model
```bash
export OPENROUTER_API_KEY=<key>
./scripts/generate-project.sh \
  --model kimi/2.6 --level overview \
  --backend node-js --frontend react \
  --provider openrouter
# Output: WORKSPACE/opencode-kimi-2.6/overview/
```

### Detailed spec with extended timeout
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level detailed \
  --backend spring-boot --frontend angular \
  --timeout 900
```

### Dry run (prints command, no API calls)
```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI --level overview \
  --backend spring-boot --frontend angular \
  --dry-run true
```

## File Locations

- Script functions: `scripts/generate-project.sh` — `resolve_harness_cli`, `build_gen_cmd`, `capture_latest_session_id`, `capture_latest_session_export`
- Session capture helper: `skills/harness-opencode/helpers/capture-session.sh`
- Session/timeout/retry deep-dive: `skills/project-generation/EXTENDED.md`
