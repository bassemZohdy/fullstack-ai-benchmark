# Evaluation Criteria

## Scoring Rubric (100 points total)

### Code Structure (25 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Backend directory exists | 5 | `backend/` with build file and source code |
| Frontend directory exists | 5 | `frontend/` with package.json and source code |
| Separation of concerns | 5 | Clean MVC/service/controller layers |
| Configuration management | 5 | Environment variables, config files |
| README quality | 5 | Setup instructions, API docs, architecture overview |

### Build & Deploy (25 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Backend compiles | 5 | Build tool succeeds (`mvn package`, `npm run build`) |
| Frontend compiles | 5 | `ng build` or `npm run build` succeeds |
| Docker support | 5 | Dockerfile builds successfully |
| Docker Compose | 5 | Both services defined, correct ports |
| Kubernetes manifests | 5 | Deployment + Service for both backend and frontend |

### Functionality (25 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| CRUD operations | 5 | Create, Read, Update, Delete endpoints |
| API validation | 5 | Input validation, error responses |
| Frontend routing | 5 | Multiple views/pages |
| State management | 5 | Proper data flow |
| Error handling | 5 | Graceful error display |

### Testing (25 points)

| Criterion | Points | Description |
|-----------|--------|-------------|
| Backend unit tests | 5 | Service/controller tests |
| Frontend unit tests | 5 | Component/service tests |
| Test configuration | 5 | Test runners configured |
| Test coverage | 5 | Key paths covered |
| Integration tests | 5 | API integration tests |

## Tier Classification

| Score | Tier | Description |
|-------|------|-------------|
| 90-100 | **S** | Production-ready, all features, comprehensive tests |
| 80-89 | **A** | Fully functional, good structure, adequate tests |
| 70-79 | **B** | Working application, reasonable structure |
| 60-69 | **C** | Basic functionality present, some gaps |
| 50-59 | **D** | Partial implementation, significant issues |
| 0-49 | **F** | Non-functional or missing critical components |

## Static Checks (automated)

These can be verified without running the application:

1. **File existence**: Check required files are present
2. **Build file syntax**: Verify pom.xml/package.json are valid JSON/XML
3. **Docker syntax**: Verify Dockerfile and docker-compose.yml are valid
4. **Import consistency**: Verify imports reference existing packages
5. **Test file presence**: Verify test files exist in expected locations
