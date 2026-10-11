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
Compilation and test execution have separate exit results. A fresh mutation tree
prevents a failed invocation from reusing earlier passing reports.

## Evidence boundaries

On the initial local JDK 17 run, all five control tests passed, with zero failures,
errors or skips; the single arithmetic mutation was killed. These results validate
the fixture/evidence harness. They do not measure an engine's generated test quality.
Engine-generated compilation, execution, mutation usefulness, repair rate, provider
cost and generation latency must remain `null` until those engine runs exist.
The adapter startup time is not a model latency benchmark.

For generation comparisons, record the engine revision, installed model identifier
and quantization, runtime, corpus hashes, full input/output traces, context/output
token limits, request timeouts, total call budget and the native repair budget.
Use the same original production sources and dependencies for every engine. Run
requests sequentially when sharing a local model server; queue time and interrupted
attempts cannot establish comparative engine quality or latency. Preserve failed
attempts. A length/context stop or time limit is incomplete evidence, not proof of
inferior generation quality or grounds for retirement.

Invoke each actual workflow through generation, normalization, review and its native
bounded repairs. Disclose transport substitutions, disabled retrieval, platform
constraints and engines that return templates without a native file-writing or
compile-repair stage. Hand-materialized or hand-repaired candidates must be reported
separately from native workflow acceptance. Model review success is not compilation.
Compile and execute the actual generated candidate in a fresh workspace and use
separate process exits plus current nonzero Surefire reports and assertion-bearing
sources. The evidence helper fails closed without test-process and assertion evidence.
Only an independently accepted baseline can enter mutation evaluation; a mutation
must compile and then fail an assertion to count as killed. Unrun mutation metrics
remain null. Private engine prompts and results stay outside this public repository.

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
