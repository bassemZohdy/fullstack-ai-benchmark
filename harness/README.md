# Harness-Loaded Skills Architecture

The benchmark has a harness layer that discovers and executes machine-readable skills from `skills/*/skill.json`. This is the canonical runtime path; root scripts are compatibility/reference wrappers.

## Architecture

```text
node harness/benchmark-harness.js run --workflow benchmark
  -> discover skills/*/skill.json
  -> validate inputs and prerequisites
  -> build execution plan
  -> execute skill steps
  -> write structured logs to logs/harness/*.jsonl
  -> stop or recover according to each skill contract
```

The existing root scripts remain available as compatibility/reference wrappers. New implementation logic should be added under `skills/_shared` or `skills/<skill>/scripts/`, then exposed through `skill.json`.

## Folder Structure

```text
harness/
  benchmark-harness.js        skill discovery, planning, validation, execution
  schemas/skill.schema.json   skill contract schema
skills/
  _shared/lib/benchmark.js   reusable skill runtime functions
  <skill>/SKILL.md            human-readable operating guide
  <skill>/skill.json          machine-readable harness contract
  <skill>/scripts/            skill-owned executable helpers
logs/harness/                 structured execution diagnostics
```

## Skill Contract

Each `skill.json` defines:

- `name` and `description`
- `supportedPlatforms` and `supportedEnvironments`
- `requiredInputs` and `optionalInputs`
- `prechecks`
- `execution`
- `expectedOutputs`
- `failureHandling`
- `recovery`
- `validation`

The JSON schema is in `harness/schemas/skill.schema.json`.

## Usage

List skills:

```bash
node harness/benchmark-harness.js list
```

Validate skill contracts:

```bash
node harness/benchmark-harness.js validate
```

Preview a benchmark plan:

```bash
node harness/benchmark-harness.js plan \
  --workflow benchmark \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --skip-e2e
```

Run the benchmark through the harness:

```bash
node harness/benchmark-harness.js run --workflow benchmark \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --skip-e2e
```

## Migration Notes

- `run-benchmark.sh` delegates orchestration to the harness.
- Root `scripts/*.sh` files are retained only as compatibility/reference wrappers.
- Benchmark implementation lives under `skills/_shared` and `skills/<skill>/scripts/`.
- Future migrations should move adapter internals into reusable skill helpers only after the harness contract for that responsibility is stable.
