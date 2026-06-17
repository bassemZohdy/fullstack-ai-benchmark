# Detailed Specification

Build a production-oriented full-stack todo application for the selected backend and frontend stack.

## Functional Requirements

- Users can view all todos.
- Users can create todos with title, optional description, and completion status.
- Users can update todo title, description, and completion status.
- Users can delete todos.
- The frontend shows loading, empty, and error states.
- The backend validates required fields and returns JSON error responses.

## Backend Requirements

- Provide RESTful CRUD endpoints.
- Use clear separation between API/controller, domain/model, persistence/repository, and configuration concerns.
- Persist todo records in a database or an embedded development database.
- Include automated backend tests where practical.
- Expose health or readiness endpoint when practical.

## Frontend Requirements

- Use the selected frontend framework.
- Provide a clean todo list screen and form workflow.
- Use a dedicated service/API layer for backend communication.
- Keep components organized and reusable.
- Include automated frontend tests where practical.

## DevOps Requirements

- Include Dockerfile(s) for generated services.
- Include `docker-compose.yml` for local multi-service execution.
- Include Kubernetes deployment and service manifests.
- Include `.env.example` documenting required configuration.
- Include a README with local, Docker, and Kubernetes run instructions.

## Quality Requirements

- Use idiomatic conventions for the selected frameworks.
- Avoid hardcoded secrets.
- Keep generated files directly in the target output directory.
- Use separate top-level `backend/` and `frontend/` directories for the generated project.
- Place all backend files under `backend/` and all frontend files under `frontend/`.
- Do not create an extra wrapper project directory.
- The project must compile successfully and start in development mode with `docker compose up`.
- Build a minimal compileable scaffold first, then expand to the full feature set.
- Prefer the smallest working architecture that satisfies the contract.
