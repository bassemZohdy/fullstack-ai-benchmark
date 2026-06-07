# System Architecture

## Design Principles

- Pure shell orchestration at the repository root
- No root `package.json`
- Template-driven prompt composition
- One active generated project per model and spec level
- Evaluation is self-contained and runs from the repository tree

## Directory Structure

```text
benchmark-ai/
├── scripts/
│   ├── generate-project.sh
│   ├── eval-generated-project.sh
│   ├── run-benchmark.sh
│   └── test-setup.sh
├── EVAL/
│   ├── comprehensive-evaluator.js
│   ├── cartridges/
│   └── phases/
├── PROMPTS/
│   ├── overview.md
│   ├── detailed.md
│   ├── templates/project-generation.md
│   └── cartridges/
├── WORKSPACE/
│   └── opencode-<model-slug>/<level>/
├── RESULTS/
│   └── opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json
└── docs/
```

## Execution Flow

```text
run-benchmark.sh
  ├─ generate-project.sh
  │  ├─ Select overview.md or detailed.md
  │  ├─ Load backend/frontend cartridges
  │  ├─ Render PROMPTS/templates/project-generation.md
  │  ├─ Reset WORKSPACE/opencode-<model-slug>/<level>/
  │  └─ Run opencode run --file <rendered-prompt> --dir <workspace>
  └─ eval-generated-project.sh
     ├─ Run EVAL/comprehensive-evaluator.js
     └─ Save RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json
```

## Components

### scripts/generate-project.sh

Generates the workspace for one model and one spec level.

- Builds the rendered prompt from the shared template, selected spec, and cartridges
- Clears the active workspace before generation
- Preserves `.opencode-session-id`
- Writes `.opencode-session` with attempt history and exported token/cost metadata

### scripts/eval-generated-project.sh

Evaluates the generated project with the comprehensive evaluator.

- Fails fast when the evaluator is missing, the project is missing, or no application structure is recognized
- Writes normalized JSON results

### PROMPTS/

Prompt inputs are composed at runtime from:

```text
PROMPTS/<level>.md
PROMPTS/templates/project-generation.md
PROMPTS/cartridges/backend/<backend>.md
PROMPTS/cartridges/frontend/<frontend>.md
```

## Key Decisions

| Decision | Why |
| --- | --- |
| Generic scripts | Support any allowed model, level, backend, and frontend |
| No root Node.js | Keeps the root repository lightweight and script-driven |
| Template prompt composition | Prevents duplicated stack-specific prompt files |
| Separate generation and evaluation | Keeps outputs inspectable and repeatable |
| One active workspace per model and level | Supports direct `overview` vs `detailed` comparison |
