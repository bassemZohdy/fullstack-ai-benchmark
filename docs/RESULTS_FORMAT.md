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
    "timestamp": "2026-06-07T11:20:18.306Z",
    "evaluation_version": "4.0",
    "evaluation_type": "comprehensive"
  },
  "quality": {
    "overall_score": 91,
    "tier": "Production-Ready",
    "pass_rate": 0.9090909090909091,
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
  "test_details": {
    "cartridge_structure": { "passed": 21, "failed": 2, "score": 91, "max": 20, "tests": [] },
    "code_quality": { "passed": 5, "failed": 0, "score": 100, "max": 15, "tests": [] },
    "docker_deployment": { "passed": 4, "failed": 0, "score": 100, "max": 20, "tests": [] },
    "kubernetes_config": { "passed": 14, "failed": 2, "score": 88, "max": 15, "tests": [] },
    "integration": { "passed": 3, "failed": 1, "score": 75, "max": 20, "tests": [] },
    "e2e_and_other": { "passed": 3, "failed": 0, "score": 100, "max": 10, "tests": [] }
  },
  "strengths": [],
  "weaknesses": [],
  "status": "COMPLETED"
}
```

## Notes

- `strengths` and `weaknesses` are derived from individual test outcomes.
- Token counts, session ids, and cost estimates are stored in `.opencode-session`, not in this file.
- Comparison summaries should use real benchmark data only. Do not add invented scores.
