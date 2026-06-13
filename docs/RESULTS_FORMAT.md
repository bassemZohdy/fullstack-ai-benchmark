# Results Format

Evaluation results are stored under:

```text
RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/evaluation-results.json
```

Example:

```text
RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json
```

## Schema

```json
{
  "metadata": {
    "model": "GLM-5.1Z.AI",
    "provider": "z-ai",
    "harness": "opencode",
    "level": "overview",
    "backend_cartridge": "spring-boot",
    "frontend_cartridge": "angular",
    "timestamp": "2026-06-08T11:20:18.306Z",
    "evaluation_version": "4.1",
    "evaluation_type": "comprehensive+e2e"
  },
  "quality": {
    "overall_score": 92,
    "overall_score_before_e2e": 93,
    "e2e_impact": -1,
    "tier": "Production-Ready",
    "static_pass_rate": 0.8840579710144928,
    "static_test_count": 55,
    "static_passed": 50,
    "static_failed": 5,
    "pass_rate": 0.8840579710144928,
    "pass_rate_including_e2e": 0.8840579710144928,
    "test_count": 55,
    "passed": 50,
    "failed": 5,
    "scores": {
      "cartridge_structure": 91,
      "code_quality": 100,
      "docker_deployment": 100,
      "kubernetes_config": 88,
      "integration": 75,
      "e2e_and_other": 100
    }
  },
  "runtime_validation": {
    "executed": true,
    "status": "passed",
    "e2e_score": 100,
    "passed": 4,
    "failed": 0,
    "total": 4,
    "tests": [],
    "phases": {}
  },
  "status": "COMPLETED"
}
```

## Notes

- `runtime_validation` is only present when runtime testing runs
- In merged results, top-level `quality.pass_rate`, `quality.test_count`, `quality.passed`, and `quality.failed` refer to the merged totals; static values are preserved under `static_*` fields
- Token counts, session ids, and cost estimates are stored in `.opencode-session`, not in this file
- Comparison summaries should use real benchmark data only
