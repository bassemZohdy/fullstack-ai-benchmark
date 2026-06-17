# Harness Skills Design

**Date**: 2026-06-12
**Status**: Approved
**Scope**: Add harness skill hierarchy (base + per-harness) and stub support for four new harnesses

---

## Problem

Harness knowledge currently lives in `.agents/skills/project-generation/EXTENDED.md` as a section, not as standalone navigable skills. There are no per-harness skills for OpenCode or PI, and no support at all for Claude Code, Codex, Kilo Code, or mimo-code. Agents cannot find harness-specific instructions without reading the entire EXTENDED doc.

---

## Chosen Approach: Option C — Base for orientation, self-contained per-harness skills

`harness-base` is a short routing/orientation document. Each per-harness skill is fully self-contained — executable without reading any other skill. Helper scripts live inside the skill directory when the logic is too procedural for prose.

---

## Directory Structure

```
.agents/skills/
  harness-base/
    SKILL.md                     # orientation + routing table + shared invariants

  harness-opencode/
    SKILL.md                     # fully self-contained
    helpers/
      capture-session.sh         # parses `opencode session list` JSON → writes session file

  harness-pi/
    SKILL.md                     # fully self-contained

  harness-claude/
    SKILL.md                     # scaffolded — Claude Code CLI, known gaps marked [TODO]
    helpers/
      invoke.sh                  # non-interactive invocation wrapper (stub)

  harness-codex/
    SKILL.md                     # scaffolded — OpenAI Codex CLI
    helpers/
      invoke.sh                  # non-interactive invocation wrapper (stub)

  harness-kilo-code/
    SKILL.md                     # scaffolded — VS Code extension, headless path TBD

  harness-mimo-code/
    SKILL.md                     # scaffolded — mimo-code CLI, gaps marked [TODO]
```

---

## harness-base/SKILL.md Content

Short (~60 lines). Contains:

1. **Routing table** — when to use each harness (speed, cost, session support, OS compatibility)
2. **Shared invariants** — output dir naming convention, session file protocol, activity monitoring, retry behavior
3. **Common parameters** — `--harness`, `--provider`, `--model` as accepted by `generate-project.sh`
4. **Links** — pointer to each per-harness skill

Does NOT contain: CLI invocation details, provider/model mappings, environment variables — those live in each per-harness skill.

---

## Per-Harness SKILL.md Template

Every harness skill uses the same eight-section structure in the same order. This ensures deterministic output across agents.

| # | Section | Fully-known harnesses | Scaffolded harnesses |
|---|---------|----------------------|---------------------|
| 1 | Prerequisites & install | Exact commands | Best-effort + `[TODO]` |
| 2 | Environment variables | Complete list | Known vars + `[TODO]` |
| 3 | CLI invocation pattern | Exact flags | Known pattern + `[TODO]` |
| 4 | Provider/model mapping | Full table | Partial table + `[TODO]` |
| 5 | Session capture | Exact logic or helper ref | Stub + `[TODO]` |
| 6 | generate-project.sh integration | `--harness <name>` examples | Same (pending impl) |
| 7 | Working examples | 3–4 real examples | 1 example + caveat |
| 8 | Gaps & TODOs | n/a | Explicit unresolved list |

### Helper script rule

A helper script is created in `.agents/skills/harness-<name>/helpers/` only when the logic is multi-step shell that is harder to follow as prose. The skill references the helper by filename and explains what it does. For scaffolded harnesses, helpers are stubs that print their intended behavior and exit 0.

---

## Fully-known Harnesses

### OpenCode

- **Install**: `pip install opencode` or follow opencode.ai/docs
- **CLI pattern**: `opencode run --model <provider>/<model> --file <prompt> --dir <output> --dangerously-skip-permissions [--session <id>] "<message>"`
- **Provider mapping**: `z-ai` → `zai-coding-plan`; `openrouter` → `openrouter`
- **Model mapping**: `GLM-5.1Z.AI` → `glm-5.1` (for zai-coding-plan); `kimi/2.6` → `moonshotai/kimi-k2.6` (openrouter); `minimax/1.5` → `minimax/minimax-m3`; `xiaomi/mimo-2.5` → `xiaomi/mimo-v2.5-pro`
- **Session capture**: `opencode session list --format json --max-count 1` — parsed by `capture-session.sh` helper
- **Session export**: `opencode export <session-id>` — writes JSON with tokens, cost, timings
- **Env vars**: `OPENROUTER_API_KEY` (only when using openrouter provider)

### PI

- **Install**: Locate binary; set `$BENCHMARK_PI_CLI` or `$PI_CLI` env var, or install to PATH
- **CLI pattern**: `pi --provider <provider> --model <model> --no-context-files -p "@<prompt-file>"` — runs from inside output directory
- **Provider mapping**: `z-ai` → `zai-coding-cn`; `openrouter` → `openrouter`
- **Model mapping**: same model IDs as OpenCode
- **Session capture**: PI tracks sessions internally; no explicit capture step
- **Session export**: not supported (no-op)
- **Env vars**: `BENCHMARK_PI_CLI` or `PI_CLI` (path to binary)

---

## Scaffolded Harnesses

### Claude (Claude Code CLI)

- **Install**: Claude Code CLI (`claude`) — available via claude.ai/code or npm
- **CLI pattern**: `claude -p "<message>" --output-format stream-json --dangerously-skip-permissions` — runs inside output directory; prompt file passed via stdin or `--file` if supported
- **Provider mapping**: native Anthropic (`anthropic`); OpenRouter TBD
- **Model mapping**: maps to claude model IDs (e.g., `claude-sonnet-4-6`)
- **Session capture**: `[TODO]` — Claude Code session protocol TBD
- **Env vars**: `ANTHROPIC_API_KEY`
- **Gaps**: non-interactive prompt injection, session resume protocol, output directory flag

### Codex (OpenAI Codex CLI)

- **Install**: `npm install -g @openai/codex` or build from source
- **CLI pattern**: `codex --approval-mode full-auto --quiet "<message>"` — runs inside output directory
- **Provider mapping**: native OpenAI; OpenRouter TBD
- **Model mapping**: maps to OpenAI model IDs (e.g., `o4-mini`, `gpt-4o`)
- **Session capture**: `[TODO]` — Codex session protocol TBD
- **Env vars**: `OPENAI_API_KEY`
- **Gaps**: prompt file injection, session resume, working directory control

### Kilo Code

- **Install**: VS Code extension (primary); standalone CLI path TBD
- **CLI pattern**: `[TODO]` — may require headless VS Code or a wrapper
- **Provider mapping**: `[TODO]`
- **Model mapping**: `[TODO]`
- **Session capture**: `[TODO]`
- **Env vars**: `[TODO]`
- **Gaps**: entire CLI interface is unconfirmed; may need a VS Code headless approach

### mimo-code

- **Install**: `[TODO]` — tool identity and distribution method unconfirmed
- **CLI pattern**: `[TODO]`
- **Provider mapping**: `[TODO]`; likely maps to Xiaomi mimo model IDs
- **Model mapping**: `[TODO]`; candidate: `xiaomi/mimo-v2.5-pro` via OpenRouter
- **Session capture**: `[TODO]`
- **Env vars**: `[TODO]`
- **Gaps**: entire tool interface unconfirmed; scaffold only

---

## Script Changes

### benchmark-support.sh

```bash
# Before
BENCHMARK_HARNESSES=("opencode" "pi")

# After
BENCHMARK_HARNESSES=("opencode" "pi" "claude" "codex" "kilo-code" "mimo-code")
```

### generate-project.sh — function stubs

| Function | Change |
|----------|--------|
| `resolve_harness_cli` | Add cases for each new harness; check `$BENCHMARK_<NAME>_CLI` env var then PATH |
| `map_harness_provider` | Pass-through for new harnesses (no mapping defined yet) |
| `map_harness_model` | Pass-through for new harnesses |
| `build_gen_cmd` | Stub: `echo "harness <name> not yet implemented"; exit 1` with clear message |
| `capture_latest_session_id` | No-op for new harnesses |
| `capture_latest_session_export` | No-op for new harnesses |

The stub `build_gen_cmd` cases fail fast with an actionable error rather than silently misbehaving.

### project-generation/EXTENDED.md

Sections 1–2 (harness abstraction, model/provider mapping) are removed and replaced with a short note pointing to the per-harness skills. Sections 3–7 (session protocol, timeout/activity monitoring, retry logic, session record schema, troubleshooting) are retained as-is.

---

## INDEX.md Changes

Add a **Harness Skills** section:

```markdown
## Harness Skills

| Skill | Harness | Status |
|-------|---------|--------|
| `harness-base` | All | Orientation & routing |
| `harness-opencode` | OpenCode | Full |
| `harness-pi` | PI | Full |
| `harness-claude` | Claude Code CLI | Scaffolded |
| `harness-codex` | OpenAI Codex CLI | Scaffolded |
| `harness-kilo-code` | Kilo Code | Scaffolded |
| `harness-mimo-code` | mimo-code | Scaffolded |
```

---

## Success Criteria

- [ ] `harness-base/SKILL.md` exists and routes correctly to each per-harness skill
- [ ] `harness-opencode/SKILL.md` is fully self-contained with no cross-skill dependencies
- [ ] `harness-pi/SKILL.md` is fully self-contained with no cross-skill dependencies
- [ ] `harness-claude/SKILL.md` scaffolded with all known details and explicit `[TODO]` gaps
- [ ] `harness-codex/SKILL.md` scaffolded with all known details and explicit `[TODO]` gaps
- [ ] `harness-kilo-code/SKILL.md` scaffolded with explicit `[TODO]` gaps
- [ ] `harness-mimo-code/SKILL.md` scaffolded with explicit `[TODO]` gaps
- [ ] `benchmark-support.sh` lists all six harnesses in `BENCHMARK_HARNESSES`
- [ ] `generate-project.sh` accepts `--harness claude/codex/kilo-code/mimo-code` without crashing (stub exit with clear message)
- [ ] `project-generation/EXTENDED.md` §1–2 migrated out; §3–7 intact
- [ ] `.agents/skills/INDEX.md` updated with harness skills section
- [ ] Each helper script in `helpers/` is referenced explicitly from its parent skill

---

## Out of Scope

- Completing the scaffolded harnesses (requires confirming CLI interfaces)
- Adding new model mappings beyond what is already known
- Evaluator or E2E changes — harness selection is generation-only
