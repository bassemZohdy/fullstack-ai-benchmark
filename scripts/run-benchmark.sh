#!/usr/bin/env bash
set -euo pipefail

################################################################################
# Benchmark Harness Entrypoint
#
# Compatibility wrapper for the harness-loaded skills model.
# Orchestration is handled by harness/benchmark-harness.js:
#   - skill discovery
#   - prerequisite validation
#   - execution planning
#   - failure handling and recovery hooks
#   - structured logs and diagnostics
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HARNESS_RUNNER="$PROJECT_ROOT/harness/benchmark-harness.js"

show_usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run a benchmark through the harness-loaded skills model.

Required:
  --model <model>         Model id to use
  --level <level>         Spec level: overview or detailed
  --backend <backend>     Backend framework: node-js, spring-boot, quarkus
  --frontend <frontend>   Frontend framework: react, angular

Options:
  --harness <harness>     Generation harness (default: opencode)
  --provider <provider>   Model provider namespace (default: z-ai)
  --auto-approve <bool>   Auto-approve harness permissions (default: true)
  --retries <count>       Generation attempts before failing (default: 3)
  --timeout <seconds>     Generation timeout (default: 600)
  --inactivity-timeout <seconds>
  --health-timeout <ms>   E2E readiness timeout (default: 120000)
  --build-timeout <ms>    E2E build timeout (default: 900000)
  --compose-timeout <ms>  Docker compose startup timeout (default: 120000)
  --skip-gen              Skip generation and only evaluate
  --skip-eval             Skip evaluation and only generate
  --skip-e2e              Run static evaluation only
  --reset                 Clean selected workspace/results before running
  --quiet                 Reduce harness output
  --plan                  Print the harness execution plan without running it
  --help                  Show this help

Examples:
  ./scripts/run-benchmark.sh \\
    --model GLM-5.1Z.AI --level overview \\
    --backend spring-boot --frontend angular --skip-e2e

  ./scripts/run-benchmark.sh \\
    --model GLM-5.1Z.AI --level overview \\
    --backend spring-boot --frontend angular --reset
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_usage
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required to run the benchmark harness" >&2
  exit 1
fi

if [[ ! -f "$HARNESS_RUNNER" ]]; then
  echo "ERROR: Harness runner not found: $HARNESS_RUNNER" >&2
  exit 1
fi

ACTION="run"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan)
      ACTION="plan"
      shift
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

exec node "$HARNESS_RUNNER" "$ACTION" --workflow benchmark "${ARGS[@]}"
