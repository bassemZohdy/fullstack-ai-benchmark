# TODO

Repository review notes and fix plan for the benchmark system.

Priority guide:
- `P0` = blocking correctness issue
- `P1` = important correctness / maintainability issue
- `P2` = useful hardening or coverage gap
- `P3` = longer-term improvement

## P0 Blockers

- [ ] Preserve session resume in `scripts/generate-project.sh`.
  - Problem: the script loads `SESSION_ID` from `.opencode-session-id` and then clears it before the retry loop, so resume support is effectively disabled.
  - Files: `scripts/generate-project.sh`
  - Fix: keep the loaded session id available for the first generation attempt, only update it after each capture, and make sure the retry loop passes `--session <id>` when present.
  - Acceptance: rerunning generation with an existing session file resumes the prior session instead of starting a fresh one.

- [ ] Fix E2E timeout propagation from the wrapper into the runner.
  - Problem: `scripts/run-e2e-tests.sh` accepts `--build-timeout` and `--compose-timeout`, but `E2E_TESTS/e2e-runner.js` ignores those values and always uses defaults.
  - Files: `scripts/run-e2e-tests.sh`, `E2E_TESTS/e2e-runner.js`
  - Fix: parse the timeout flags in the Node runner, pass them to `buildValidator.validate()` and `dockerRunner.startup()`, and keep the help text aligned with the actual behavior.
  - Acceptance: changing the CLI timeout values changes the effective build/startup timeout used by the E2E pipeline.

- [ ] Fix Docker health polling in `E2E_TESTS/helpers/docker-runner.js`.
  - Problem: `waitForHealth()` starts HTTP requests and checks `anyPortOpen` immediately, before the async callbacks have a chance to update it, which can cause false health failures.
  - Files: `E2E_TESTS/helpers/docker-runner.js`
  - Fix: await request completion per probe or aggregate the probe promises before evaluating readiness.
  - Acceptance: a reachable service is detected reliably without timing out because of callback race conditions.

- [ ] Ensure container cleanup happens on early E2E exits.
  - Problem: `E2E_TESTS/e2e-runner.js` returns on build/docker/health failures without guaranteeing `docker compose down` runs after Docker has started.
  - Files: `E2E_TESTS/e2e-runner.js`, `E2E_TESTS/helpers/docker-runner.js`
  - Fix: track whether containers started and always invoke cleanup in a `finally` path or equivalent guarded cleanup block.
  - Acceptance: failed runs do not leave containers behind.

## P1 Important Correctness

- [ ] Replace shell-string `eval` command execution with argument arrays.
  - Problem: `scripts/eval-complete.sh` and `scripts/run-e2e-tests.sh` build commands as strings and execute them with `eval`, which is brittle and unsafe for quoting, spaces, and special characters.
  - Files: `scripts/eval-complete.sh`, `scripts/run-e2e-tests.sh`, possibly `scripts/eval-generated-project.sh`
  - Fix: construct command arrays and invoke them directly.
  - Acceptance: commands run correctly with paths containing spaces and no `eval` is required for normal execution.

- [ ] Align supported-stack documentation with actual evaluation support.
  - Problem: the docs claim support for Spring Boot + React and Node.js combinations, but the comprehensive evaluator currently only supports Spring Boot + Angular.
  - Files: `README.md`, `docs/SCRIPTS.md`, `docs/EVALUATION_SYSTEM.md`, `docs/E2E_TESTING.md`, `docs/PROJECT_STATUS.md`, `scripts/run-benchmark.sh`, `EVAL/comprehensive-evaluator.js`
  - Fix: either implement the missing evaluators or explicitly gate unsupported combinations before evaluation and document that generation-only runs are supported for them.
  - Acceptance: docs, scripts, and evaluator behavior all agree on the supported combinations.

- [ ] Refresh stale completion/status claims in documentation.
  - Problem: several docs describe the system as fully production-ready and list counts or capabilities that are not verified in code.
  - Files: `README.md`, `docs/PROJECT_STATUS.md`, `docs/EVALUATION_METRICS.md`, `docs/ARCHITECTURE.md`
  - Fix: update status language, supported-stack tables, score descriptions, and result examples so they match the current implementation.
  - Acceptance: documentation does not overstate completeness or unsupported features.

- [ ] Normalize user-facing output encoding.
  - Problem: several shell scripts and docs display mojibake/garbled Unicode in the current checkout, which reduces readability and can break console output on Windows terminals.
  - Files: `scripts/*.sh`, `README.md`, `docs/*.md`
  - Fix: convert messages to clean UTF-8 or plain ASCII consistently.
  - Acceptance: terminal output and markdown render cleanly without broken symbols.

## P2 Hardening

- [ ] Add regression coverage for session resume and timeout forwarding.
  - Files: `scripts/generate-project.sh`, `scripts/run-e2e-tests.sh`, `E2E_TESTS/e2e-runner.js`
  - Fix: add a lightweight validation harness or scripted smoke test that confirms session resumption and timeout flags are honored.
  - Acceptance: regressions in these paths are caught before manual benchmark runs.

- [ ] Harden evaluator filesystem assumptions.
  - Problem: some evaluator helpers assume specific directory layouts and file names without a clear fallback strategy.
  - Files: `EVAL/comprehensive-evaluator.js`, `EVAL/cartridge-evaluator.js`, `EVAL/cartridges/*`, `EVAL/phases/kubernetes-config.js`
  - Fix: centralize path detection and make missing-directory behavior explicit and consistent.
  - Acceptance: unsupported layouts fail predictably, and supported layouts are evaluated consistently.

- [ ] Improve result-merging validation.
  - Problem: the merger assumes the static and E2E result shapes are valid and only minimally validates inputs.
  - Files: `EVAL/e2e-results-merger.js`
  - Fix: validate required fields before merging, and fail with a clear message when the input format is incomplete.
  - Acceptance: malformed result files do not produce misleading final reports.

- [ ] Add cleanup and failure-path tests for the E2E stack.
  - Files: `E2E_TESTS/e2e-runner.js`, `E2E_TESTS/helpers/docker-runner.js`, `E2E_TESTS/helpers/build-validator.js`, `E2E_TESTS/helpers/api-tester.js`, `E2E_TESTS/helpers/frontend-tester.js`
  - Fix: cover build failure, docker startup failure, health timeout, API failure, and frontend failure cases.
  - Acceptance: the most failure-prone runtime paths are covered by repeatable automated checks.

## P3 Improvements

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

