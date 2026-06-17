# Full-Stack Project Generation Request

You are generating a benchmark project for the following selected stack.

## Selected Parameters

- Specification level: {{LEVEL}}
- Backend: {{BACKEND}}
- Frontend: {{FRONTEND}}

## Instructions

Write the complete generated application directly into the current working directory.
Do not create an extra wrapper directory.
Use separate top-level `backend/` and `frontend/` directories for the generated project.
Place all backend files under `backend/` and all frontend files under `frontend/`.
Follow the selected specification level and the backend/frontend cartridges below.
Include tests, Docker, Kubernetes manifests, environment example, and a project README.
Use the framework defaults emitted by the generated scaffold for package versions, build settings, and browser configuration unless the selected cartridges or spec explicitly require otherwise.
Keep the generated project internally consistent with its own scaffold; do not invent newer framework patch versions or custom build settings in the first pass.

## Build Strategy

- Start by writing a minimal, compileable project scaffold before polishing features.
- Create the core backend, frontend, and Docker files early so the workspace has visible progress quickly.
- Prefer the simplest working implementation that satisfies the contract over extra abstractions or optional subsystems.
- If a tradeoff is needed, prioritize compileability and the benchmark contract first, then add supporting files.

## Specification

{{SPEC_CONTENT}}

## Backend Cartridge

{{BACKEND_CARTRIDGE}}

## Frontend Cartridge

{{FRONTEND_CARTRIDGE}}
