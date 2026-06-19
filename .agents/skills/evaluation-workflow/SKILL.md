---
name: evaluation-workflow
description: Run static evaluation, complete evaluation, and result merging for generated projects. Use when working on `scripts/eval-generated-project.sh`, `scripts/eval-complete.sh`, `EVAL/`, or benchmark result files. Keep scripted evaluation as the canonical scoring path, and switch to `evaluation-audit` when scores look suspicious or need source-level review against the cartridges.
---

# Evaluation Workflow

## Overview

Use this skill when the task is to run or interpret the benchmark evaluator. It covers the static evaluator, the merged evaluation flow, and the output artifacts in `RESULTS/`.

The canonical benchmark score must still come from scripts and JSON outputs, not from free-form agent judgment. Skills are guidance for running and auditing the process.

## Workflow

1. Confirm the target generated project and the intended output directory.
2. Run `scripts/eval-generated-project.sh` for static checks, or `scripts/eval-complete.sh` for the full merged pipeline.
3. Read the evaluator output before changing scoring logic or acceptance criteria.
4. Keep `EVAL/comprehensive-evaluator.js` and the result merger aligned with the documented score model.
5. Treat missing structure, missing build tools, or bad paths as evaluation failures to fix explicitly.
6. If a result conflicts with the generated source or with the backend/frontend cartridges, use `evaluation-audit` to inspect whether the evaluator is too narrow.

## What To Check

- Static results in `static-evaluation.json`
- E2E results in `e2e-execution.json`
- Merged results in `evaluation-results.json`
- Supported-stack and score explanations in `docs/EVALUATION_SYSTEM.md`, `docs/RESULTS_FORMAT.md`, and `README.md`
- Relevant stack constraints in `PROMPTS/cartridges/backend/<backend>.md` and `PROMPTS/cartridges/frontend/<frontend>.md`

## Guardrails

- Do not invent scores or claim coverage the evaluator does not implement.
- Keep unsupported runtime combinations clearly labeled.
- If the evaluator assumes a directory layout, verify the assumption in code before changing the docs around it.
- Keep score summaries machine-readable when possible, but do not sacrifice the canonical JSON outputs.
- Do not replace the scripted evaluator with a skill-only scoring path. Use skills to audit, refine, and extend the scripted evaluator.
