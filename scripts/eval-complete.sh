#!/usr/bin/env bash
set -euo pipefail

# Complete evaluation: static analysis + E2E testing + metric merge
# Usage: ./scripts/eval-complete.sh --project-dir <path> --backend <backend> --frontend <frontend> [--skip-e2e]

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
. "$SCRIPT_DIR/benchmark-support.sh"

function log_section() {
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

function log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

function log_error() {
  echo -e "${RED}[ERR]${NC} $1"
}

function show_usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run complete evaluation (static + E2E) on a generated project.

OPTIONS:
  --project-dir <dir>       Path to generated project (required)
  --backend <backend>       Backend type (spring-boot, node-js)
  --frontend <frontend>     Frontend type (angular, react)
  --model <model>           Model name (for metadata)
  --level <level>           Specification level (overview, detailed)
  --provider <provider>     Provider name (for metadata)
  --harness <harness>       Harness name (for metadata)
  --results-dir <dir>       Directory for evaluation results (required)
  --skip-e2e                Skip E2E testing, only run static eval
  --build-timeout <ms>      E2E build timeout (default: 900000)
  --compose-timeout <ms>    Docker Compose startup timeout (default: 120000)
  --health-timeout <ms>     Health/readiness timeout (default: 120000)
  --help                    Show this help message

Example:
  ./scripts/eval-complete.sh \\
    --project-dir WORKSPACE/opencode-glm-5.1/overview \\
    --backend spring-boot --frontend angular \\
    --model GLM-5.1Z.AI --level overview \\
    --results-dir RESULTS/opencode-glm-5.1/spring-boot-angular/overview
EOF
}

PROJECT_DIR=""
BACKEND="spring-boot"
FRONTEND="angular"
MODEL=""
LEVEL=""
PROVIDER=""
HARNESS=""
RESULTS_DIR=""
SKIP_E2E="false"
BUILD_TIMEOUT="900000"
COMPOSE_TIMEOUT="120000"
HEALTH_TIMEOUT="120000"
E2E_FAILED="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --frontend) FRONTEND="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --level) LEVEL="$2"; shift 2 ;;
    --provider) PROVIDER="$2"; shift 2 ;;
    --harness) HARNESS="$2"; shift 2 ;;
    --results-dir) RESULTS_DIR="$2"; shift 2 ;;
    --skip-e2e) SKIP_E2E="true"; shift ;;
    --build-timeout) BUILD_TIMEOUT="$2"; shift 2 ;;
    --compose-timeout) COMPOSE_TIMEOUT="$2"; shift 2 ;;
    --health-timeout) HEALTH_TIMEOUT="$2"; shift 2 ;;
    --help) show_usage; exit 0 ;;
    *) log_error "Unknown option: $1"; show_usage; exit 1 ;;
  esac
done

# Validate required arguments
if [[ -z "$PROJECT_DIR" ]]; then
  log_error "Project directory is required"
  show_usage
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  log_error "Project directory does not exist: $PROJECT_DIR"
  exit 1
fi

if [[ -z "$RESULTS_DIR" ]]; then
  log_error "Results directory is required"
  show_usage
  exit 1
fi

if ! benchmark_require_value "backend" "$BACKEND" "${BENCHMARK_BACKENDS[@]}"; then
  log_error "Invalid backend: $BACKEND"
  exit 1
fi

if ! benchmark_require_value "frontend" "$FRONTEND" "${BENCHMARK_FRONTENDS[@]}"; then
  log_error "Invalid frontend: $FRONTEND"
  exit 1
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

log_section "Complete Evaluation Pipeline"
log_info "Project:        $(basename "$PROJECT_DIR")"
log_info "Backend:        $BACKEND"
log_info "Frontend:       $FRONTEND"
log_info "Results Dir:    $RESULTS_DIR"
log_info "E2E Testing:    $([ "$SKIP_E2E" = "true" ] && echo "SKIPPED" || echo "ENABLED")"

# Step 1: Static evaluation
log_section "Step 1/3: Static Code Evaluation"
STATIC_RESULTS_FILE="$RESULTS_DIR/static-evaluation.json"

STATIC_CMD=(node "$PROJECT_ROOT/EVAL/comprehensive-evaluator.js")
STATIC_CMD+=(--project-dir "$PROJECT_DIR")
STATIC_CMD+=(--backend "$BACKEND")
STATIC_CMD+=(--frontend "$FRONTEND")
STATIC_CMD+=(--results-file "$STATIC_RESULTS_FILE")

if [[ -n "$MODEL" ]]; then
  STATIC_CMD+=(--model "$MODEL")
fi
if [[ -n "$LEVEL" ]]; then
  STATIC_CMD+=(--level "$LEVEL")
fi
if [[ -n "$PROVIDER" ]]; then
  STATIC_CMD+=(--provider "$PROVIDER")
fi
if [[ -n "$HARNESS" ]]; then
  STATIC_CMD+=(--harness "$HARNESS")
fi

if "${STATIC_CMD[@]}"; then
  log_success "Static evaluation completed"
  STATIC_SCORE=$(jq -r '.quality.overall_score' "$STATIC_RESULTS_FILE")
  log_info "Static evaluation score: $STATIC_SCORE/100"
else
  log_error "Static evaluation failed"
  exit 1
fi

# Step 2: E2E testing (optional)
E2E_RESULTS_FILE=""
if [[ "$SKIP_E2E" != "true" ]]; then
  if ! benchmark_is_runtime_supported "$BACKEND" "$FRONTEND"; then
    log_error "Unsupported E2E combination: $BACKEND + $FRONTEND"
    log_info "Supported combinations: spring-boot or node-js with angular or react"
    exit 1
  fi

  log_section "Step 2/3: End-to-End Testing"
  E2E_RESULTS_FILE="$RESULTS_DIR/e2e-execution.json"

  E2E_CMD=("$PROJECT_ROOT/scripts/run-e2e-tests.sh")
  E2E_CMD+=(--project-dir "$PROJECT_DIR")
  E2E_CMD+=(--backend "$BACKEND")
  E2E_CMD+=(--frontend "$FRONTEND")
  E2E_CMD+=(--results-file "$E2E_RESULTS_FILE")
  E2E_CMD+=(--build-timeout "$BUILD_TIMEOUT")
  E2E_CMD+=(--compose-timeout "$COMPOSE_TIMEOUT")
  E2E_CMD+=(--health-timeout "$HEALTH_TIMEOUT")

  if "${E2E_CMD[@]}"; then
    log_success "E2E testing completed"
    E2E_STATUS=$(jq -r '.status' "$E2E_RESULTS_FILE")
    log_info "E2E execution status: $E2E_STATUS"
  else
    log_error "E2E testing failed"
    if [[ -f "$E2E_RESULTS_FILE" ]]; then
      E2E_STATUS=$(jq -r '.status' "$E2E_RESULTS_FILE" 2>/dev/null || echo "failed")
      log_info "E2E execution status: $E2E_STATUS"
    else
      log_error "E2E results file was not produced"
      E2E_RESULTS_FILE=""
    fi
    E2E_FAILED="true"
  fi
else
  log_section "Step 2/3: E2E Testing"
  log_info "E2E testing skipped (--skip-e2e flag)"
fi

# Step 3: Merge results
log_section "Step 3/3: Merging Evaluation Results"
FINAL_RESULTS_FILE="$RESULTS_DIR/evaluation-results.json"

MERGE_CMD=(node "$PROJECT_ROOT/EVAL/e2e-results-merger.js")
MERGE_CMD+=(--static-results "$STATIC_RESULTS_FILE")
if [[ -n "$E2E_RESULTS_FILE" ]]; then
  MERGE_CMD+=(--e2e-results "$E2E_RESULTS_FILE")
fi
MERGE_CMD+=(--output "$FINAL_RESULTS_FILE")

if "${MERGE_CMD[@]}"; then
  log_success "Results merged successfully"
else
  log_error "Result merging failed"
  exit 1
fi

# Display summary
log_section "Evaluation Complete"
FINAL_SCORE=$(jq -r '.quality.overall_score' "$FINAL_RESULTS_FILE")
FINAL_TIER=$(jq -r '.quality.tier' "$FINAL_RESULTS_FILE")
PASS_RATE=$(jq -r '.quality.pass_rate_including_e2e // .quality.pass_rate' "$FINAL_RESULTS_FILE")

echo -e "${GREEN}Final Score:${NC} $FINAL_SCORE/100"
echo -e "${GREEN}Tier:${NC} $FINAL_TIER"
PASS_RATE_PERCENT=$(node -e 'const rate = Number(process.argv[1] || 0); process.stdout.write((rate * 100).toFixed(1));' "$PASS_RATE")
echo -e "${GREEN}Pass Rate:${NC} ${PASS_RATE_PERCENT}%"
echo ""
echo -e "${GREEN}Results saved to:${NC}"
echo "  Static Eval: $STATIC_RESULTS_FILE"
if [[ -n "$E2E_RESULTS_FILE" ]]; then
  echo "  E2E Results: $E2E_RESULTS_FILE"
fi
echo "  Final Report: $FINAL_RESULTS_FILE"
echo ""

SUMMARY_JSON=$(node -e '
const [resultsDir, staticFile, e2eFile, finalFile, score, tier, passRate] = process.argv.slice(1);
process.stdout.write(JSON.stringify({
  results_dir: resultsDir,
  static_results: staticFile,
  e2e_results: e2eFile || null,
  final_results: finalFile,
  overall_score: Number(score),
  tier,
  pass_rate: Number(passRate)
}));
' "$RESULTS_DIR" "$STATIC_RESULTS_FILE" "${E2E_RESULTS_FILE:-}" "$FINAL_RESULTS_FILE" "$FINAL_SCORE" "$FINAL_TIER" "$PASS_RATE")
echo "SUMMARY_JSON: $SUMMARY_JSON"

# Exit with appropriate code
FINAL_EXIT_CODE=1
if [[ "$FINAL_SCORE" -ge 75 ]]; then
  if [[ "$SKIP_E2E" != "true" && "$E2E_FAILED" == "true" ]]; then
    log_error "Project reached the production-ready static threshold, but E2E validation failed"
  else
    log_success "Project is production-ready"
    FINAL_EXIT_CODE=0
  fi
elif [[ "$FINAL_SCORE" -ge 60 ]]; then
  if [[ "$SKIP_E2E" != "true" && "$E2E_FAILED" == "true" ]]; then
    log_error "Project reached the functional static threshold, but E2E validation failed"
  else
    log_success "Project is functional (improvements recommended)"
    FINAL_EXIT_CODE=0
  fi
else
  log_error "Project needs significant improvements"
fi

if [[ "$SKIP_E2E" != "true" && "$E2E_FAILED" == "true" ]]; then
  FINAL_EXIT_CODE=1
fi

exit "$FINAL_EXIT_CODE"
