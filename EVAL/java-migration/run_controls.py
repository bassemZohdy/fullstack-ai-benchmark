"""Run hand-authored fixture tests and a known mutation, without invoking any model."""
import argparse
import json
import re
from pathlib import Path
import shutil
import subprocess
import tempfile
from evidence import execution_evidence


def run_controls(repository=None, offline=False):
    with tempfile.TemporaryDirectory() as directory:
        project = Path(directory) / 'corpus'
        shutil.copytree(Path(__file__).parent / 'corpus', project,
                        ignore=shutil.ignore_patterns('target'))
        args = [shutil.which('mvn') or 'mvn', '-B', '-ntp']
        if repository:
            args.append('-Dmaven.repo.local=' + str(Path(repository).resolve()))
        if offline:
            args.append('-o')
        assertion_sources = '\n'.join(path.read_text() for path in project.glob('*/src/test/java/**/*.java'))
        assertions = bool(re.search(r'\bassert\w+\s*\(', assertion_sources))
        compilation = subprocess.run(args+['test-compile'], cwd=project, capture_output=True, text=True, timeout=180)
        baseline = subprocess.run(args+['test'], cwd=project, capture_output=True, text=True, timeout=180)
        evidence = execution_evidence(project, compile_exit=compilation.returncode,
                                      test_exit=baseline.returncode, assertions_present=assertions)
        # A fresh mutant tree prevents earlier passing reports from being reused.
        mutant = Path(directory) / 'mutant'
        shutil.copytree(Path(__file__).parent / 'corpus', mutant,
                        ignore=shutil.ignore_patterns('target'))
        source = mutant / 'core/src/main/java/fixture/Ledger.java'
        source.write_text(source.read_text().replace('first + second', 'first - second'), encoding='utf-8')
        mutation_compile = subprocess.run(args+['test-compile'], cwd=mutant, capture_output=True, text=True, timeout=180)
        mutation = subprocess.run(args+['test'], cwd=mutant, capture_output=True, text=True, timeout=180)
        mutation_evidence = execution_evidence(mutant, compile_exit=mutation_compile.returncode,
                                               test_exit=mutation.returncode, assertions_present=assertions)
        killed = (mutation_evidence['compiled'] and mutation.returncode != 0
                  and mutation_evidence['executed_tests'] > 0 and mutation_evidence['failures'] > 0
                  and mutation_evidence['errors'] == 0 and mutation_evidence['skipped'] == 0)
        if not evidence['accepted']:
            raise RuntimeError('Control baseline failed:\n' + baseline.stdout[-4000:] + baseline.stderr[-1000:])
        if not killed:
            raise RuntimeError('Known arithmetic mutation was not killed by an assertion')
        return dict(kind='hand-authored-harness-control', model_calls=0, provider_cost=0,
                    baseline=evidence, known_mutations=1, killed_mutations=1,
                    mutation=mutation_evidence,
                    engine_generated_compile_rate=None, engine_generated_mutation_score=None)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--maven-repository')
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = run_controls(args.maven_repository, args.offline)
    Path(args.output).write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))
