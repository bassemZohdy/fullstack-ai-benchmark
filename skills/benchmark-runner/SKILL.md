---
name: benchmark-runner
description: Execute a full-stack benchmark run. Generate a project from spec, validate structure and build readiness, run static evaluation, and report results. Use when asked to run a benchmark, generate a benchmark project, evaluate a generated project, or execute a benchmark test for any model/harness/stack combination.
---

# Benchmark Runner

Execute a full-stack benchmark run end-to-end. The agent manages all steps — no external orchestration scripts needed.

## Parameters

Determine these from the user's request (or ask if missing):

| Parameter | Values | Default |
|-----------|--------|---------|
| **Spec level** | `overview`, `detailed` | `overview` |
| **Backend** | `spring-boot`, `node-js`, `quarkus` | `spring-boot` |
| **Frontend** | `angular`, `react` | `angular` |
| **Output dir** | path | `./benchmark-output` |

## Workflow

### Step 1: Load Specification

Read the spec and cartridges:

1. Read `PROMPTS/{level}.md` — the specification
2. Read `PROMPTS/cartridges/backend/{backend}.md` — backend cartridge
3. Read `PROMPTS/cartridges/frontend/{frontend}.md` — frontend cartridge

### Step 2: Generate Project

Create the full-stack project in the output directory:

1. Create `{output-dir}/backend/` and `{output-dir}/frontend/` directories
2. Generate backend files per the backend cartridge and spec
3. Generate frontend files per the frontend cartridge and spec
4. Generate Docker support (`Dockerfile`, `docker-compose.yml`)
5. Generate Kubernetes manifests (`k8s/`)
6. Generate `.env.example` with required environment variables
7. Generate `README.md` with local run instructions
8. Generate tests for both backend and frontend

**Build strategy:**
- Write a minimal, compileable scaffold first
- Create core backend + frontend + Docker files early
- Prefer the simplest working implementation
- Prioritize compileability over features

### Step 3: Validate Output

Self-check the generated project before reporting:

1. **Structure check**: Verify `backend/`, `frontend/`, `Dockerfile`, `docker-compose.yml`, `k8s/`, `.env.example`, `README.md` all exist
2. **Backend check**: Verify build file exists (`pom.xml`/`build.gradle` for Spring Boot, `package.json` for Node.js, `pom.xml`/`build.gradle` for Quarkus)
3. **Frontend check**: Verify `package.json` and framework config exist
4. **Docker check**: Verify `Dockerfile` references the correct build tool and `docker-compose.yml` defines both services
5. **Test check**: Verify test files exist in both backend and frontend

If any check fails, fix the issue before proceeding.

### Step 4: Run Static Evaluation

Read `EVAL/comprehensive-evaluator.js` and run it against the generated project:

```bash
node EVAL/comprehensive-evaluator.js \
  --project-dir {output-dir} \
  --backend {backend} \
  --frontend {frontend}
```

Or manually evaluate using the criteria in `references/evaluation-criteria.md`.

### Step 5: Report Results

Output a summary:

```
## Benchmark Results

- **Spec level**: {level}
- **Stack**: {backend} + {frontend}
- **Output**: {output-dir}

### Structure Validation
- [ ] Backend directory
- [ ] Frontend directory
- [ ] Docker support
- [ ] Kubernetes manifests
- [ ] Tests
- [ ] README

### Static Evaluation Score
- Overall: {score}/100
- Tier: {tier}

### Files Generated
{file count and list}
```

## Evaluation Criteria

See `references/evaluation-criteria.md` for detailed scoring rubric.

## Available Cartridges

| Backend | File |
|---------|------|
| Spring Boot | `PROMPTS/cartridges/backend/spring-boot.md` |
| Node.js | `PROMPTS/cartridges/backend/node-js.md` |
| Quarkus | `PROMPTS/cartridges/backend/quarkus.md` |

| Frontend | File |
|----------|------|
| Angular | `PROMPTS/cartridges/frontend/angular.md` |
| React | `PROMPTS/cartridges/frontend/react.md` |
