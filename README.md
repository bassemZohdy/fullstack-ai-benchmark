# Full-Stack Generation Benchmark

Benchmark framework for comparing full-stack project generation across tools, models, and specification methodologies.

Current implementation:

- Harness: OpenCode
- Validation model: Z.ai GLM (`GLM-5.1Z.AI`)
- Matrix provider: OpenRouter
- Initial matrix models: `kimi/2.6`, `minimax/1.5`, `xiaomi/mimo-2.5`
- Root architecture: shell-only orchestration, no root `package.json`
- OpenCode mode: non-interactive `opencode run`

## Running Benchmarks

Run a single benchmark:

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --provider z-ai
```

Outputs are normalized by model slug:

```text
WORKSPACE/opencode-<model-slug>/<level>/
RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json
```

Example:

```text
RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json
```

## Repository Layout

```text
benchmark-ai/
├── scripts/
├── EVAL/
├── E2E_TESTS/
├── PROMPTS/
│   ├── overview.md
│   ├── detailed.md
│   ├── templates/project-generation.md
│   └── cartridges/
├── WORKSPACE/
├── RESULTS/
└── docs/
```

## How It Works

- `overview` and `detailed` are the only built-in spec levels.
- Prompt rendering combines `PROMPTS/templates/project-generation.md`, the selected spec file, and backend/frontend cartridges.
- `scripts/generate-project.sh` clears the active workspace before each run and preserves `.opencode-session-id` when present.
- OpenCode generates `README.md` directly in the workspace.
- Each run also writes `.opencode-session` with retry history and token/cost metadata from `opencode export`.
- `scripts/eval-generated-project.sh` delegates to `EVAL/comprehensive-evaluator.js`.
- `overview` and `detailed` stay in separate workspaces so the generated projects can be compared side by side.
- The current comprehensive evaluator is implemented for Spring Boot backend and Angular frontend. Other cartridge combinations can still be generated, but evaluation support for them is not implemented yet.

## Documentation

Start here:

1. [docs/START.md](./docs/START.md)
2. [docs/SCRIPTS.md](./docs/SCRIPTS.md)
3. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
4. [docs/PROMPT_SPECIFICATIONS.md](./docs/PROMPT_SPECIFICATIONS.md)
5. [docs/EVALUATION_SYSTEM.md](./docs/EVALUATION_SYSTEM.md)
6. [docs/RESULTS_FORMAT.md](./docs/RESULTS_FORMAT.md)
