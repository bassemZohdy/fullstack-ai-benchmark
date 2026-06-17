# Prompt Specifications

## Objective

This benchmark compares generation quality across two specification levels and selected technology cartridges.

Both levels share the same runtime acceptance bar: the generated project must compile, keep backend and frontend in separate top-level folders, and start in development mode with `docker compose up`.

## Built-In Levels

### overview

Short product-level request. It defines the application goal and expected deliverables without detailed implementation steps.

### detailed

Expanded implementation specification. It includes functional requirements, technical constraints, structure expectations, testing, deployment, and quality criteria.

## Prompt Composition

Generation does not use stack-specific prompt files. `scripts/generate-project.sh` renders one prompt from:

```text
PROMPTS/templates/project-generation.md
PROMPTS/<level>.md
PROMPTS/cartridges/backend/<backend>.md
PROMPTS/cartridges/frontend/<frontend>.md
```

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
- `scripts/generate-project.sh` cartridge selection
- documentation examples

Add a new stack by creating the appropriate cartridge under `PROMPTS/cartridges/`. Use `run-benchmark.sh` with individual selectors.
