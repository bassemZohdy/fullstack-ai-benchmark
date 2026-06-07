# Prompt Specifications

## Objective

This benchmark compares generation quality across two specification levels and selected technology cartridges. The goal is to measure how much additional requirement detail changes generated project quality.

Both levels share the same runtime acceptance bar: the generated project must compile, keep backend and frontend in separate top-level folders, and start in development mode with `docker compose up`.

## Built-In Levels

### overview

Short product-level request. It defines the application goal and expected deliverables without detailed implementation steps.

Use it when testing model defaults, assumptions, and ability to infer a reasonable full-stack application from sparse requirements.

Path:

```text
PROMPTS/overview.md
```

### detailed

Expanded implementation specification. It includes functional requirements, technical constraints, structure expectations, testing, deployment, and quality criteria.

Use it when testing how well a model follows a richer project brief.

Path:

```text
PROMPTS/detailed.md
```

## Prompt Composition

Generation does not use stack-specific prompt files. `scripts/generate-project.sh` renders one prompt from:

```text
PROMPTS/templates/project-generation.md
PROMPTS/<level>.md
PROMPTS/cartridges/backend/<backend>.md
PROMPTS/cartridges/frontend/<frontend>.md
```

Template tokens:

| Token | Source |
| --- | --- |
| `{{LEVEL}}` | `--level` |
| `{{BACKEND}}` | `--backend` |
| `{{FRONTEND}}` | `--frontend` |
| `{{SPEC_CONTENT}}` | selected spec file |
| `{{BACKEND_CARTRIDGE}}` | selected backend cartridge |
| `{{FRONTEND_CARTRIDGE}}` | selected frontend cartridge |

## Supported Cartridges

Backend:

- `node-js`
- `spring-boot`
- `quarkus`

Frontend:

- `react`
- `angular`

## Running One Prompt

```bash
./scripts/run-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --provider z-ai
```

## Extending Prompts

Add a new built-in level only if it is added consistently to:

- `PROMPTS/<level>.md`
- `scripts/generate-project.sh` level validation
- `scripts/generate-project.sh` cartridge selection (if backend/frontend specific)
- documentation examples

Add a new stack by creating the appropriate cartridge under `PROMPTS/cartridges/`. No automatic matrix wiring is needed; use `run-benchmark.sh` with individual selectors.
