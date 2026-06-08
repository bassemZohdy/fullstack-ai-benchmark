---
name: docs-maintenance
description: Keep benchmark docs, status pages, and result examples aligned with the implemented behavior. Use when editing `README.md`, `docs/`, `TODO.md`, or any user-facing claims about support and scoring.
---

# Docs Maintenance

## Overview

Use this skill when updating documentation that describes what the benchmark actually does. The priority is consistency: the README, docs, and TODO notes should agree with the scripts and evaluator behavior.

## Workflow

1. Compare the docs against the live scripts and evaluator behavior first.
2. Update related docs together when a support matrix, path, or score claim changes.
3. Prefer concrete supported stacks and exact output paths over vague status language.
4. If a doc says something is complete, make sure the code and tests actually back that claim.
5. Keep examples and result samples aligned with the current file layout.

## High-Risk Files

- `README.md`
- `docs/PROJECT_STATUS.md`
- `docs/EVALUATION_SYSTEM.md`
- `docs/RESULTS_FORMAT.md`
- `docs/ARCHITECTURE.md`
- `TODO.md`

## Guardrails

- Do not overstate runtime coverage beyond what exists.
- Do not leave stale stack tables or result examples after changing scripts.
- Keep generated or derived metrics labeled as such.
- If a doc is being updated for a bug fix, align the wording with the actual behavior change instead of rewriting the history.
