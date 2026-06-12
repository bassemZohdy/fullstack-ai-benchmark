---
name: harness-kilo-code
description: Use Kilo Code as the generation harness. Heavily scaffolded — Kilo Code is primarily a VS Code extension; headless CLI path is unconfirmed. Check §8 before using.
---

# Kilo Code Harness — Scaffolded

## Status

**Heavily scaffolded.** `--harness kilo-code` is accepted by validation but `generate-project.sh` exits with:
```
❌ ERROR: harness kilo-code is scaffolded and not yet implemented
  See implementation guide: skills/harness-kilo-code/SKILL.md
```
The entire CLI interface is unconfirmed. See §8.

## 1. Prerequisites & Install

Kilo Code is distributed as a VS Code extension:
- VS Code Marketplace: search **Kilo Code**
- Extension ID: `kilocode.kilo-code`

[TODO: confirm if a standalone CLI binary exists outside VS Code]
[TODO: confirm if headless VS Code is the intended headless approach]

## 2. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BENCHMARK_KILO_CODE_CLI` | Optional | Path to Kilo Code CLI binary if one exists |
| [TODO] | [TODO] | Auth token or API key required by Kilo Code |

## 3. CLI Invocation Pattern

[TODO: entire invocation pattern unconfirmed]

Candidate approaches:
- Standalone binary: `kilo-code "<message>"` or `kilo "<message>"`
- Headless VS Code: `code --headless ...`

## 4. Provider & Model Mapping

[TODO: all mappings unconfirmed]

## 5. Session Management

[TODO: session resume protocol unconfirmed]

**Planned session files** in the output directory:

| File | Content |
|------|---------|
| `.kilo-code-session-id` | Resume token if supported |
| `.kilo-code-session` | JSON audit record |

## 6. generate-project.sh Integration (once implemented)

```bash
./scripts/generate-project.sh \
  --model <kilo-code-model> \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness kilo-code
# Expected output: WORKSPACE/kilo-code-<model-slug>/overview/
```

## 7. Current Behavior

```bash
./scripts/generate-project.sh \
  --model <model> --level overview \
  --backend spring-boot --frontend angular \
  --harness kilo-code
# ❌ ERROR: harness kilo-code is scaffolded and not yet implemented
#   See implementation guide: skills/harness-kilo-code/SKILL.md
```

## 8. Gaps — Resolve Before Implementing

| Gap | What to confirm |
|-----|----------------|
| CLI availability | Does Kilo Code have a standalone CLI binary outside VS Code? |
| Headless mode | If VS Code extension only, how to invoke headlessly? |
| Invocation pattern | Full command syntax for non-interactive generation |
| Providers supported | What providers and model IDs does Kilo Code accept? |
| Auth/credentials | What environment variables are required? |
| Session resume | Supported? If so, how? |
| `build_gen_cmd` | Fill in `kilo-code)` case in `scripts/generate-project.sh` once confirmed |
