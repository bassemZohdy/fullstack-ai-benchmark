import tempfile
from pathlib import Path
import unittest
from evidence import execution_evidence, parser_contract


class EvidenceTests(unittest.TestCase):
    def test_execution_requires_reports_and_nonzero_assertion_tests(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertFalse(execution_evidence(directory, compile_exit=0)['accepted'])
            report = Path(directory) / 'core/target/surefire-reports/TEST-Ledger.xml'
            report.parent.mkdir(parents=True)
            for attributes in ('tests="0"', 'tests="1" failures="1"',
                               'tests="1" errors="1"', 'tests="1" skipped="1"'):
                report.write_text(f'<testsuite {attributes}/>', encoding='utf-8')
                self.assertFalse(execution_evidence(directory, compile_exit=0)['accepted'])
            report.write_text('<testsuite tests="3" failures="0" errors="0" skipped="0"/>', encoding='utf-8')
            self.assertTrue(execution_evidence(directory, compile_exit=0)['accepted'])
            self.assertFalse(execution_evidence(directory, compile_exit=1)['accepted'])
            self.assertFalse(execution_evidence(directory, compile_exit=0, fallback=True)['accepted'])

    def test_primary_class_contract_rejects_nested_or_missing_methods(self):
        expected = dict(class_='Ledger', package='fixture', public_methods=['divide', 'total'])
        expected['class'] = expected.pop('class_')
        self.assertTrue(parser_contract(expected, expected))
        for methods in ([], ['total'], ['divide', 'nestedOnly', 'total']):
            self.assertFalse(parser_contract({**expected, 'public_methods': methods}, expected))


if __name__ == '__main__':
    unittest.main()
