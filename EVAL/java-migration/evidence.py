"""Read execution evidence without treating compilation or placeholders as success."""
from pathlib import Path
import xml.etree.ElementTree as ET


def execution_evidence(project, *, compile_exit, fallback=False):
    reports = sorted(Path(project).glob('**/target/surefire-reports/TEST-*.xml'))
    tests = failures = errors = skipped = 0
    for path in reports:
        suite = ET.parse(path).getroot()
        tests += int(suite.get('tests', 0))
        failures += int(suite.get('failures', 0))
        errors += int(suite.get('errors', 0))
        skipped += int(suite.get('skipped', 0))
    executed = tests - skipped
    return dict(compiled=compile_exit == 0, executed_tests=executed,
                failures=failures, errors=errors, skipped=skipped, fallback=fallback,
                accepted=compile_exit == 0 and bool(reports) and executed > 0
                         and failures == 0 and errors == 0 and skipped == 0 and not fallback)


def parser_contract(actual, expected):
    """An adapter must report exactly the primary class's public method names."""
    return all(actual.get(key) == expected[key]
               for key in ('class', 'package', 'public_methods')) and not actual.get('error')
