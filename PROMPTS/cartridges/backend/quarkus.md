# Backend Cartridge: Quarkus

- Use Java with Quarkus.
- Prefer a minimal, conventional Maven build unless Gradle is clearly needed.
- Keep the dependency set small and standard: RESTEasy Reactive, Jackson, Hibernate ORM if persistence is needed, and test support.
- Build a minimal compileable API first, then add persistence and tests.
- Provide REST endpoints for todo CRUD with straightforward request and response models.
- Keep the layer structure simple and avoid unnecessary abstraction.
- Include CORS configuration for the selected frontend.
- Use Quarkus conventions for configuration and dependency injection.
- Include automated tests only where they improve confidence without delaying the first compileable build.
- Keep tests compatible with the generated Quarkus scaffold; use only APIs and annotations that the generated project actually includes on its classpath.
- Include environment-based configuration, but do not add optional infrastructure unless the spec requires it.
