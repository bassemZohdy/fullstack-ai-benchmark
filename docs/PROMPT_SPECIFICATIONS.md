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

Generation does not use stack-specific prompt files. The `project-generation` skill renders one prompt from:

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
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --provider z-ai
```

## Extending Prompts

Add a new built-in level only if it is added consistently to:

- `PROMPTS/<level>.md`
- `skills/_shared/lib/benchmark.js` level validation
- `skills/project-generation/scripts/generate-project.js` cartridge selection
- documentation examples

Add a new stack by creating the appropriate cartridge under `PROMPTS/cartridges/`. Use `node harness/benchmark-harness.js run --workflow benchmark` with individual selectors.
