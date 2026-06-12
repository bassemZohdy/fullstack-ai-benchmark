---
name: harness-codex
description: Use OpenAI Codex CLI as the generation harness. Scaffolded — known CLI details documented; unconfirmed gaps marked [TODO]. generate-project.sh exits with "not yet implemented" until §8 gaps are resolved.
---

# Codex Harness — Scaffolded

## Status

**Scaffolded.** `--harness codex` is accepted by validation but `generate-project.sh` exits with:
```
❌ ERROR: harness codex is scaffolded and not yet implemented
  See implementation guide: skills/harness-codex/SKILL.md
```
Resolve §8 gaps, then implement the `codex)` case in `build_gen_cmd()`.

## 1. Prerequisites & Install

```bash
# Via npm (open-source Codex CLI by OpenAI)
npm install -g @openai/codex

# Or build from source: github.com/openai/codex
# Verify:
codex --version
```

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI authentication token |
| `BENCHMARK_CODEX_CLI` | Optional | Explicit path to `codex` binary if not on PATH |

## 3. CLI Invocation Pattern

Codex non-interactive mode (known):

```bash
codex --approval-mode full-auto --quiet "<message>"
```

Codex runs in the current working directory. To target a specific output directory:

```bash
cd <output-directory> && codex --approval-mode full-auto --quiet "<message>"
```

[TODO: confirm whether a `--model <id>` flag exists]
[TODO: confirm how to pass a large prompt from a file rather than inline]

## 4. Provider & Model Mapping

| `--provider` | Codex provider string |
|---|---|
| `openai` | `openai` (native) |
| `openrouter` | [TODO] |

| `--model` | Codex model string |
|---|---|
| `o4-mini` | `o4-mini` |
| `gpt-4o` | `gpt-4o` |

[TODO: verify exact model ID strings accepted by `codex --model`]

## 5. Session Management

[TODO: determine if Codex CLI supports session resume]

**Planned session files** in the output directory:

| File | Content |
|------|---------|
| `.codex-session-id` | Resume token if supported; empty otherwise |
| `.codex-session` | JSON audit record with attempt metadata |

## 6. generate-project.sh Integration (once implemented)

```bash
export OPENAI_API_KEY=<key>
./scripts/generate-project.sh \
  --model o4-mini \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness codex \
  --provider openai
# Expected output: WORKSPACE/codex-o4-mini/overview/
```

## 7. Current Behavior

```bash
./scripts/generate-project.sh \
  --model o4-mini --level overview \
  --backend spring-boot --frontend angular \
  --harness codex
# ❌ ERROR: harness codex is scaffolded and not yet implemented
#   See implementation guide: skills/harness-codex/SKILL.md
```

## 8. Gaps — Resolve Before Implementing

| Gap | What to confirm |
|-----|----------------|
| File-based prompt | How to pass a large rendered prompt without shell escaping issues |
| Output directory | Does a flag exist, or must the script `cd` into the output dir? |
| Model flag | Does `--model` exist? What model IDs are valid? |
| Session resume | Is session resume supported? If so, how? |
| OpenRouter routing | Can `codex` route through OpenRouter? |
| `build_gen_cmd` | Fill in `codex)` case in `scripts/generate-project.sh` once confirmed |

## Helper

`skills/harness-codex/helpers/invoke.sh` — stub. Replace once gaps are resolved.
