# TODO

Repository review notes and fix plan for the benchmark system.

Priority guide:
- `P0` = blocking correctness issue
- `P1` = important correctness / maintainability issue
- `P2` = useful hardening or coverage gap
- `P3` = longer-term improvement

## Open Work

### P2 Hardening

- [ ] Add regression coverage for session resume and timeout forwarding.
  - Files: `scripts/generate-project.sh`, `scripts/run-e2e-tests.sh`, `E2E_TESTS/e2e-runner.js`
  - Fix: add a lightweight validation harness or scripted smoke test that confirms session resumption and timeout flags are honored.
  - Acceptance: regressions in these paths are caught before manual benchmark runs.

- [ ] Harden evaluator filesystem assumptions.
  - Problem: some evaluator helpers assume specific directory layouts and file names without a clear fallback strategy.
  - Files: `EVAL/comprehensive-evaluator.js`, `EVAL/cartridge-evaluator.js`, `EVAL/cartridges/*`, `EVAL/phases/kubernetes-config.js`
  - Fix: centralize path detection and make missing-directory behavior explicit and consistent.
  - Acceptance: unsupported layouts fail predictably, and supported layouts are evaluated consistently.

- [ ] Add cleanup and failure-path tests for the E2E stack.
  - Files: `E2E_TESTS/e2e-runner.js`, `E2E_TESTS/helpers/docker-runner.js`, `E2E_TESTS/helpers/build-validator.js`, `E2E_TESTS/helpers/api-tester.js`, `E2E_TESTS/helpers/frontend-tester.js`
  - Fix: cover build failure, docker startup failure, health timeout, API failure, and frontend failure cases.
  - Acceptance: the most failure-prone runtime paths are covered by repeatable automated checks.

### P3 Improvements

- [ ] Add a single source of truth for supported models, backends, frontends, and harnesses.
  - Files: `scripts/*.sh`, `PROMPTS/*.md`, `docs/*.md`
  - Fix: define the supported matrix once and reuse it in validation, docs, and prompt generation.
  - Acceptance: support updates happen in one place and do not drift across docs and scripts.

- [ ] Make benchmark output summaries more machine-friendly.
  - Files: `scripts/run-benchmark.sh`, `scripts/eval-complete.sh`, `scripts/eval-generated-project.sh`
  - Fix: emit concise JSON or structured summary output alongside the human-readable logs.
  - Acceptance: CI and other automation can parse the final status without scraping console text.

- [ ] Review the static evaluator scoring model for calibration.
  - Files: `EVAL/comprehensive-evaluator.js`, `EVAL/e2e-results-merger.js`
  - Fix: confirm the weighting, category thresholds, and tier labels still reflect the intended benchmark goals.
  - Acceptance: the score formulas are documented, intentional, and aligned with the outputs.

## Completed

- [x] Preserve session resume in `scripts/generate-project.sh`.
- [x] Fix E2E timeout propagation from the wrapper into the runner.
- [x] Fix Docker health polling in `E2E_TESTS/helpers/docker-runner.js`.
- [x] Ensure container cleanup happens on early E2E exits.
- [x] Replace shell-string `eval` command execution with argument arrays.
- [x] Align supported-stack documentation with actual evaluation support.
- [x] Improve result-merging validation.
- [x] Normalize user-facing output encoding in runtime logs.
- [x] Refresh stale completion/status claims in documentation.
- [x] Add regression coverage for session resume and timeout forwarding.
- [x] Harden evaluator filesystem assumptions.
- [x] Add cleanup and failure-path tests for the E2E stack.
