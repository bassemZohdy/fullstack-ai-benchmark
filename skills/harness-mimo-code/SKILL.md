---
name: harness-mimo-code
description: Use mimo-code as the generation harness. Scaffolded — tool identity and CLI interface are unconfirmed. May map to Xiaomi's mimo model via a dedicated CLI or via OpenRouter. Check §8 before using.
---

# mimo-code Harness — Scaffolded

## Status

**Scaffolded.** `--harness mimo-code` is accepted by validation but `generate-project.sh` exits with:
```
❌ ERROR: harness mimo-code is scaffolded and not yet implemented
  See implementation guide: skills/harness-mimo-code/SKILL.md
```
The tool identity and CLI interface are unconfirmed. See §8.

## 1. Prerequisites & Install

[TODO: tool identity and distribution method unconfirmed]

Candidate interpretations:
- A dedicated `mimo-code` CLI tool from Xiaomi
- The Xiaomi mimo model accessed via an existing harness (e.g., `--harness opencode --provider openrouter --model xiaomi/mimo-2.5`)

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BENCHMARK_MIMO_CODE_CLI` | Optional | Path to mimo-code binary if standalone |
| [TODO] | [TODO] | Auth token or API key required |

## 3. CLI Invocation Pattern

[TODO: entire invocation pattern unconfirmed]

## 4. Provider & Model Mapping

[TODO: all mappings unconfirmed]

Candidate model mapping (if mimo-code exposes the Xiaomi OpenRouter model):

| `--model` | OpenRouter model string |
|---|---|
| `xiaomi/mimo-2.5` | `xiaomi/mimo-v2.5-pro` |

## 5. Session Management

[TODO: session protocol unconfirmed]

**Planned session files** in the output directory:

| File | Content |
|------|---------|
| `.mimo-code-session-id` | Resume token if supported |
| `.mimo-code-session` | JSON audit record |

## 6. generate-project.sh Integration (once implemented)

```bash
./scripts/generate-project.sh \
  --model xiaomi/mimo-2.5 \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness mimo-code
# Expected output: WORKSPACE/mimo-code-xiaomi-mimo-2.5/overview/
```

## 7. Current Behavior

```bash
./scripts/generate-project.sh \
  --model xiaomi/mimo-2.5 --level overview \
  --backend spring-boot --frontend angular \
  --harness mimo-code
# ❌ ERROR: harness mimo-code is scaffolded and not yet implemented
#   See implementation guide: skills/harness-mimo-code/SKILL.md
```

## 8. Gaps — Resolve Before Implementing

| Gap | What to confirm |
|-----|----------------|
| Tool identity | Is mimo-code a standalone CLI or the mimo model via another harness? |
| Distribution | How is it installed? npm, pip, binary download? |
| Invocation pattern | Full command syntax for non-interactive generation |
| Provider/model IDs | What provider strings and model IDs does it accept? |
| Auth requirements | What environment variables or credentials are needed? |
| Session resume | Supported? If so, how? |
| `build_gen_cmd` | Fill in `mimo-code)` case in `scripts/generate-project.sh` once confirmed |
