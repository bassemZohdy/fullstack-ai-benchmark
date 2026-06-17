# Frontend Cartridge: Angular

- Use Angular with TypeScript.
- Prefer the current stable Angular CLI app scaffold and keep the first pass compileable.
- Use `HttpClient` and `provideHttpClient` from `@angular/common/http`; do not import HTTP helpers from deprecated paths such as `@angular/platform-browser/http`.
- Use the standard Angular CLI Browserslist defaults; do not add custom browser queries such as `last 2 iOS Safari major versions`.
- Prefer the package versions emitted by the generated Angular scaffold; do not invent or override package versions in the first pass.
- Provide todo list, create, update, delete, and completion interactions.
- Use Angular services and HttpClient for backend calls.
- Use Angular forms for input handling.
- Keep the component tree and state management simple unless the spec requires more.
- Include loading, empty, and error states.
- Include basic component or service tests only after the app compiles cleanly.
