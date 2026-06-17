---
name: benchmark-runner
description: Execute a full-stack benchmark run. Generate a project from spec, validate structure and build readiness, run static evaluation, and report results. Use when asked to run a benchmark, generate a benchmark project, or execute a benchmark test.
---

# Benchmark Runner

Execute a full-stack benchmark run. You manage all steps — generate, validate, evaluate, report.

## Parameters

Determine from the user's request (ask if missing):

- **Spec level**: `overview` (default) or `detailed`
- **Backend**: `spring-boot` (default), `node-js`, or `quarkus`
- **Frontend**: `angular` (default) or `react`
- **Output dir**: `./benchmark-output` (default)

## Workflow

### Step 1: Load Specification

Read these files from the repository root:

1. `PROMPTS/{level}.md` — the specification
2. `PROMPTS/cartridges/backend/{backend}.md` — backend cartridge
3. `PROMPTS/cartridges/frontend/{frontend}.md` — frontend cartridge

### Step 2: Generate Project

Create the full-stack project in the output directory:

1. Create `{output-dir}/backend/` and `{output-dir}/frontend/`
2. Generate backend files per the backend cartridge and spec
3. Generate frontend files per the frontend cartridge and spec
4. Generate `Dockerfile` and `docker-compose.yml`
5. Generate `k8s/` with Kubernetes manifests
6. Generate `.env.example`
7. Generate `README.md` with setup instructions
8. Generate tests for both backend and frontend

**Build strategy**: Write a minimal compileable scaffold first. Prioritize the simplest working implementation.

### Step 3: Validate Output

Self-check before reporting:

- [ ] `backend/` exists with build file and source code
- [ ] `frontend/` exists with `package.json` and source code
- [ ] `Dockerfile` and `docker-compose.yml` exist and are valid
- [ ] `k8s/` exists with deployment manifests
- [ ] `.env.example` exists
- [ ] `README.md` exists with setup instructions
- [ ] Test files exist in both backend and frontend

Fix any issues before proceeding.

### Step 4: Run Evaluation

Run the static evaluator:

```bash
node EVAL/comprehensive-evaluator.js --project-dir {output-dir} --backend {backend} --frontend {frontend}
```

Or manually score using the rubric in `.agents/skills/benchmark-runner/references/evaluation-criteria.md`.

### Step 5: Report Results

Output a summary with structure validation checklist, evaluation score, tier, and file count.
