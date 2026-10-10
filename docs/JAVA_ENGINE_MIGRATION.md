# Java engine migration acceptance

This is a separate offline acceptance corpus under `EVAL/java-migration/`, not a new
full-stack generation level. It contains original fixtures written for this migration:
JUnit 4 arithmetic and exception tests, JUnit 5 constructor injection with Mockito,
and a Spring `@Service` marker. Maven runs two modules on JDK 17.
No private engine implementation, provider credential, or private evaluation data is included.

Run the evaluator regressions:

```sh
python -m unittest discover -s EVAL/java-migration -v
python EVAL/java-migration/run_controls.py --output /tmp/java-controls.json
```

For a previously populated Maven repository, add `--offline` and optionally
`--maven-repository /path/to/cache`. The control runner copies fixtures into a temporary
workspace, runs the hand-written tests, and changes `first + second` to `first - second`.
The mutation is accepted as killed only by a test assertion failure, not a compiler error.
It never invokes a model. Dependencies may be downloaded on the first build.

## Evidence boundaries

On the initial local JDK 17 run, all five control tests passed, with zero failures,
errors or skips; the single arithmetic mutation was killed. These results validate
the fixture/evidence harness. They do not measure an engine's generated test quality.
Engine-generated compilation, execution, mutation usefulness, repair rate, provider
cost and generation latency must remain `null` until those engine runs exist.
The adapter startup time is not a model latency benchmark.

Each engine's offline metadata adapter must read the same three production sources
and emit an array of `{class, package, public_methods, error}` records in the order
specified by `expected.json`. Only the primary class's public methods count; nested
methods and private methods must be excluded. Hash production sources before and
after each adapter run. Engine-specific adapters belong with their source engine,
and private comparison evidence stays private.

## Retirement gates

Passing three parser cases is a baseline, not canonical acceptance. Before retiring
an engine, preserve and restore-check every remote branch/tag and unpublished local
change; retain each source file's commit/blob, visibility, rights and attribution.
Migrate useful unique provider accounting, recovery, prompts, fixtures and rollback
behavior only to a destination with compatible rights and visibility.

Require consumer inventory and import/install compatibility, malformed/modern Java
rejection, bounded repairs, production-source integrity, preservation of existing
tests, and generated assertions that compile, execute and kill meaningful mutations.
Commented, TODO, disabled or zero-test output is failure. The current corpus checks
a Spring marker and dependency use; it does not establish Spring context behavior,
all Java language versions, arbitrary projects, or all multi-module dependency layouts.

Missing license decisions, incomplete capability migration, unknown consumers,
unpreserved work or missing generated-test evidence keep archival blocked.
