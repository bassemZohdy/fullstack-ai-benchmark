---
name: harness-claude
description: Use Claude Code CLI as the generation harness. Scaffolded — installation and known CLI details are documented; unconfirmed gaps are marked [TODO]. generate-project.sh exits with "not yet implemented" until the gaps in §8 are resolved.
---

# Claude Code Harness — Scaffolded

## Status

**Scaffolded.** `--harness claude` is accepted by validation but `generate-project.sh` exits with:
```
❌ ERROR: harness claude is scaffolded and not yet implemented
  See implementation guide: .agents/skills/harness-claude/SKILL.md
```
Resolve the gaps in §8, then implement the `claude)` case in `build_gen_cmd()` in `scripts/generate-project.sh`.

## 1. Prerequisites & Install

```bash
# Via npm
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
```

Alternatively, install via the Claude desktop app (bundled automatically).

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic authentication token |
| `BENCHMARK_CLAUDE_CLI` | Optional | Explicit path to `claude` binary if not on PATH |

## 3. CLI Invocation Pattern

Claude Code non-interactive mode (known):

```bash
claude --print "<message>" --dangerously-skip-permissions
```

For file-based prompts (avoids shell escaping for large prompts):
```bash
claude --print "$(cat <rendered-prompt-file>)" --dangerously-skip-permissions
```

[TODO: confirm whether `--file <path>` exists to pass the prompt without subshell expansion]
[TODO: confirm flag to set the working/output directory (equivalent to `opencode --dir`)]

## 4. Provider & Model Mapping

| `--provider` | Claude provider string |
|---|---|
| `anthropic` | `anthropic` (native) |
| `openrouter` | [TODO: confirm if Claude CLI supports OpenRouter routing] |

| `--model` | Claude model string |
|---|---|
| `claude-sonnet-4-6` | `claude-sonnet-4-6` |
| `claude-opus-4-8` | `claude-opus-4-8` |
| `claude-haiku-4-5` | `claude-haiku-4-5-20251001` |

[TODO: verify exact model ID strings accepted by `claude --model`]

## 5. Session Management

[TODO: determine whether Claude Code CLI supports session resume and confirm the flag]

**Planned session files** in the output directory:

| File | Content |
|------|---------|
| `.claude-session-id` | Resume token if supported; empty otherwise |
| `.claude-session` | JSON audit record with attempt metadata |

## 6. generate-project.sh Integration (once implemented)

```bash
export ANTHROPIC_API_KEY=<key>
./scripts/generate-project.sh \
  --model claude-sonnet-4-6 \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness claude \
  --provider anthropic
# Expected output: WORKSPACE/claude-claude-sonnet-4-6/overview/
```

## 7. Current Behavior

```bash
# Accepted by validation but fails at build_gen_cmd:
./scripts/generate-project.sh \
  --model claude-sonnet-4-6 --level overview \
  --backend spring-boot --frontend angular \
  --harness claude
# ❌ ERROR: harness claude is scaffolded and not yet implemented
#   See implementation guide: .agents/skills/harness-claude/SKILL.md
```

## 8. Gaps — Resolve Before Implementing

| Gap | What to confirm |
|-----|----------------|
| Prompt file injection | Does `claude` accept `--file <path>` or must the prompt be inlined? |
| Output directory control | What flag sets the working directory (equivalent to `opencode --dir`)? |
| Non-interactive flags | Complete flag set for fully headless, non-interactive run |
| Session resume | Is `--session <id>` or equivalent supported? Session ID format? |
| OpenRouter routing | Can `claude` route through OpenRouter? Provider string? |
| `build_gen_cmd` | Fill in `claude)` case in `scripts/generate-project.sh` once confirmed |

## Helper

No separate helper script is retained. The benchmark integration lives in `scripts/generate-project.sh`.
