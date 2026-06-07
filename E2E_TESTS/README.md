# E2E Tests

This directory is reserved for future expanded end-to-end suites.

Current benchmark evaluation is implemented in:

```text
EVAL/evaluate.js
```

The package scripts in this directory call the evaluator for compatibility:

```bash
cd E2E_TESTS
npm run test:project -- --project-dir ../WORKSPACE/<model-slug> --results-file ../RESULTS/manual/evaluation-results.json
```

Do not add root-level Node.js scripts. Keep evaluation dependencies isolated under `EVAL/` or `E2E_TESTS/`.
