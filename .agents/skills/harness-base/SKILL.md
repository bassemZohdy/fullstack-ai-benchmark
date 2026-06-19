---
name: harness-base
description: Orientation guide for benchmark harnesses. Read this first to choose the right harness, then switch to the per-harness skill for invocation details. Use when unsure which harness to pick or how the harness abstraction works.
---

# Harness Orientation

## What Is a Harness

A harness is the AI coding tool that generates a full-stack project from a rendered prompt. All harnesses are invoked through `scripts/generate-project.sh` with `--harness <name>`. The benchmark supports multiple harnesses so generation quality and speed can be compared across tools.

## Routing Table

| Harness | `--harness` value | Speed | Session resume | Status | Skill |
|---------|------------------|-------|---------------|--------|-------|
| OpenCode | `opencode` | ~11 min (overview) | ✅ Full | Ready | `harness-opencode` |
| PI | `pi` | ~4 min (overview) | ⚠️ Internal only | Ready | `harness-pi` |
| Claude Code | `claude` | TBD | TBD | Scaffolded | `harness-claude` |
| Codex | `codex` | TBD | TBD | Scaffolded | `harness-codex` |
| Kilo Code | `kilo-code` | TBD | TBD | Scaffolded | `harness-kilo-code` |
| mimo-code | `mimo-code` | TBD | TBD | Ready | `harness-mimo-code` |

**Scaffolded** — harness name is accepted by `generate-project.sh` validation but `build_gen_cmd` exits with "not yet implemented" until the CLI integration is completed.

## Shared Invariants

These apply to every harness without exception:

1. **Output directory**: `WORKSPACE/{harness}-{model-slug}/{level}/` — derived by `benchmark_workspace_dir` in `scripts/benchmark-support.sh`
2. **Session files**: `.{harness}-session-id` (resume token) and `.{harness}-session` (JSON audit record) live inside the output directory
3. **Activity monitoring**: file creation in the output directory is polled every second; 90 s with no new files triggers termination
4. **Retry**: up to `--retries N` (default 3) attempts; each attempt is appended to the session JSON
5. **Prompt**: every harness receives the same rendered prompt produced by `scripts/render-prompt.sh`

## Common Parameters (generate-project.sh)

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| `--harness` | `opencode` `pi` `claude` `codex` `kilo-code` `mimo-code` | `opencode` | Selects the generation tool |
| `--provider` | `z-ai` `openrouter` | `z-ai` | Provider namespace; mapped per-harness internally |
| `--model` | `GLM-5.1Z.AI` `kimi/2.6` … | — | Normalized per-harness internally |
| `--timeout` | seconds | `600` | Hard generation time limit |
| `--retries` | integer | `3` | Attempts before failure |

## Next Step

Switch to the per-harness skill for installation, exact CLI flags, provider/model mapping, and examples:

- **Ready to use**: `harness-opencode`, `harness-pi`, `harness-mimo-code`
- **Scaffolded** (gaps marked `[TODO]`): `harness-claude`, `harness-codex`, `harness-kilo-code`
