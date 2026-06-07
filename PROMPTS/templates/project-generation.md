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

## Specification

{{SPEC_CONTENT}}

## Backend Cartridge

{{BACKEND_CARTRIDGE}}

## Frontend Cartridge

{{FRONTEND_CARTRIDGE}}
