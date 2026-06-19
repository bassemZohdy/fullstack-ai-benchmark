---
name: evaluation-audit
description: Audit benchmark scores against generated source code, result JSON, and the relevant backend/frontend cartridges. Use when evaluation results look suspicious, when a project appears under- or over-scored, when refining `EVAL/` logic, or when double-checking whether failures are real runtime defects or evaluator false negatives.
---

# Evaluation Audit

Use this skill to review whether benchmark results are justified by the generated project and by the stack cartridges.

Keep the benchmark scripts as the source of truth for final machine-readable outputs. This skill exists to find gaps in the scripted evaluator and to tighten its rules.

## Workflow

1. Read the relevant result files:
   - `static-evaluation.json`
   - `e2e-execution.json`
   - `evaluation-results.json`
2. Read the relevant generated source in `WORKSPACE/<harness>-<model-slug>/<level>/`.
3. Read only the relevant cartridges for the stack:
   - `PROMPTS/cartridges/backend/<backend>.md`
   - `PROMPTS/cartridges/frontend/<frontend>.md`
4. Compare each failed or skipped evaluation check against actual source evidence.
5. Decide whether the result is:
   - a real project defect
   - an evaluator false negative
   - an evaluator rule that is stricter than the cartridge requires
6. If the evaluator is wrong, patch `EVAL/`, add or update regression coverage in `scripts/test-regressions.sh`, rerun evaluation, and record the corrected result.

## What To Verify

- Structure checks match real project layouts
- Cartridge expectations are reflected in evaluator rules
- Optional tooling is not treated as mandatory unless the cartridge requires it
- Runtime failures reduce the final tier appropriately
- Weakness summaries and failed counts match the JSON details

## Guardrails

- Do not assign scores manually in place of rerunning the evaluator.
- Do not treat prompt preferences as hard requirements unless the cartridge clearly makes them required.
- Do not relax runtime failures away; if E2E fails, keep that failure visible even when static scoring improves.
- Prefer deterministic rule changes in `EVAL/` over one-off result edits.

## References

Read [references/audit-checklist.md](references/audit-checklist.md) for the detailed audit checklist and common false-negative patterns.
