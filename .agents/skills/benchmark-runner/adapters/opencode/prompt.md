# Benchmark Runner — OpenCode Prompt

You are executing a full-stack benchmark run. Follow these steps exactly.

## Parameters

These will be injected below. Follow them precisely.

- **Spec level**: {{LEVEL}}
- **Backend**: {{BACKEND}}
- **Frontend**: {{FRONTEND}}
- **Output directory**: Current working directory

## Step 1: Read Specification

Read these files from the repository:
1. `PROMPTS/{{LEVEL}}.md`
2. `PROMPTS/cartridges/backend/{{BACKEND}}.md`
3. `PROMPTS/cartridges/frontend/{{FRONTEND}}.md`

## Step 2: Generate Project

Create the full-stack project in the current directory:
- `backend/` — API server per the backend cartridge
- `frontend/` — UI app per the frontend cartridge
- `Dockerfile` and `docker-compose.yml`
- `k8s/` — Kubernetes deployment manifests
- `.env.example` — environment configuration
- `README.md` — setup and run instructions
- Tests for both backend and frontend

Build strategy: minimal compileable scaffold first, simplest working implementation.

## Step 3: Validate

After generation, verify:
- All required directories and files exist
- Build files are syntactically valid
- Docker configuration references correct services
- Test files exist

Fix any issues found.

## Step 4: Report

Output a summary:
- Structure validation checklist (pass/fail for each item)
- List of generated files
- Any issues encountered and how they were resolved
