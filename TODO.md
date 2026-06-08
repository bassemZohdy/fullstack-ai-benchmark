# TODO

Repository review notes and fix plan for the benchmark system.

Priority guide:
- `P0` = blocking correctness issue
- `P1` = important correctness / maintainability issue
- `P2` = useful hardening or coverage gap
- `P3` = longer-term improvement

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
- [x] Add a single source of truth for supported models, backends, frontends, and harnesses.
- [x] Make benchmark output summaries more machine-friendly.
- [x] Review the static evaluator scoring model for calibration.
