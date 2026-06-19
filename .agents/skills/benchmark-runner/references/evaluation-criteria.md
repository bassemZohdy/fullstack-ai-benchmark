# Evaluation Criteria

## Scoring Model

The evaluator (`EVAL/comprehensive-evaluator.js`) uses weighted categories that sum to 100%:

| Category | Weight | Description |
|----------|--------|-------------|
| **Cartridge Structure** | 20% | Backend/frontend framework-specific structure (Spring Boot, Node.js, Angular, React) |
| **Code Quality** | 15% | README, .env.example, .gitignore, directory layout, Docker config |
| **Docker Deployment** | 20% | docker-compose.yml, Dockerfiles, build validation |
| **Kubernetes Config** | 15% | k8s/ directory with Deployments, Services, Ingress |
| **Integration** | 20% | Controllers, services, environment config, port mappings |
| **E2E & Other** | 10% | Frontend test files, build tools |

When a category is skipped (e.g., cartridge evaluation for unsupported combos), its weight is redistributed proportionally across the remaining categories.

## Tier Classification

| Score | Tier | Description |
|-------|------|-------------|
| 90-100 | **Production-Ready** | All features, comprehensive tests, production-grade |
| 75-89 | **Deployable** | Good structure, working features, adequate tests |
| 60-74 | **Functional** | Basic functionality present, some gaps |
| 0-59 | **Needs Work** | Missing critical components or significant issues |

## Merged Score (Static + E2E)

When E2E testing is enabled, the final score is:

- **Static evaluation**: 70% of merged score
- **E2E evaluation**: 30% of merged score

E2E scoring breakdown (100 points):

| Category | Points | Description |
|----------|--------|-------------|
| Build | 25 | Backend and frontend compile successfully |
| Docker Startup | 20 | `docker compose up` starts without errors |
| Health Check | 20 | Backend responds with HTTP 200 |
| API Tests | 20 | Todo CRUD contract passes |
| Frontend | 15 | Frontend accessible on expected port |

## Static Checks (automated)

These can be verified without running the application:

1. **File existence**: Check required files are present
2. **Build file syntax**: Verify pom.xml/package.json are valid JSON/XML
3. **Docker syntax**: Verify Dockerfile and docker-compose.yml are valid
4. **Import consistency**: Verify imports reference existing packages
5. **Test file presence**: Verify test files exist in expected locations

## Supported Patterns

The evaluator recognizes framework-specific patterns:

| Category | Spring Boot | Node.js | Angular | React |
|----------|------------|---------|---------|-------|
| Controllers | `*Controller.java` | `controllers/`, `*controller.js` | — | — |
| Services | `*Service.java` | — | `*.service.ts` | `services/`, `*Service.ts` |
| Tests | `*Test.java` | `*.test.js` | `*.spec.ts` | `*.test.tsx` |
| Config | `application.yml` | — | `environment.ts` | `.env`, `vite.config.ts` |
| K8s | `k8s/` or `kubernetes/` | `k8s/` or `kubernetes/` | — | — |
