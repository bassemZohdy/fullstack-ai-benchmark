---
name: evaluation-workflow
description: Run static evaluation, complete evaluation, and result merging for generated projects. Use when working on `scripts/eval-generated-project.sh`, `scripts/eval-complete.sh`, `EVAL/`, or benchmark result files.
---

# Evaluation Workflow

## Overview

Use this skill when the task is to judge a generated project and write benchmark results. It covers the static evaluator, the merged evaluation flow, and the output artifacts in `RESULTS/`.

## Workflow

1. Confirm the target generated project and the intended output directory.
2. Run `scripts/eval-generated-project.sh` for static checks, or `scripts/eval-complete.sh` for the full merged pipeline.
3. Read the evaluator output before changing scoring logic or acceptance criteria.
4. Keep `EVAL/comprehensive-evaluator.js` and the result merger aligned with the documented score model.
5. Treat missing structure, missing build tools, or bad paths as evaluation failures to fix explicitly.

## What To Check

- Static results in `static-evaluation.json`
- E2E results in `e2e-execution.json`
- Merged results in `evaluation-results.json`
- Supported-stack and score explanations in `docs/EVALUATION_SYSTEM.md`, `docs/RESULTS_FORMAT.md`, and `README.md`

## Guardrails

- Do not invent scores or claim coverage the evaluator does not implement.
- Keep unsupported runtime combinations clearly labeled.
- If the evaluator assumes a directory layout, verify the assumption in code before changing the docs around it.
- Keep score summaries machine-readable when possible, but do not sacrifice the canonical JSON outputs.
