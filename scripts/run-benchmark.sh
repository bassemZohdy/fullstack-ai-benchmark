#!/bin/bash

################################################################################
# Benchmark Orchestrator Script
#
# Orchestrates project generation and evaluation
# Uses generic generate-project.sh and eval-generated-project.sh scripts
#
# Usage:
#   # Single test with all required selectors
#   ./scripts/run-benchmark.sh \
#     --model kimi/2.6 \
#     --level overview \
#     --backend spring-boot \
#     --frontend react
#
#   # GLM workflow validation
#   ./scripts/run-benchmark.sh \
#     --model GLM-5.1Z.AI \
#     --level overview \
#     --backend spring-boot \
#     --frontend angular \
#     --provider z-ai
#
# Parameters:
#   Required:
#     --model         Model id to use
#     --level         Specification level (overview, detailed)
#     --backend       Backend framework (node-js, spring-boot, quarkus)
#     --frontend      Frontend framework (react, angular)
#
#   Optional:
#     --harness       Harness to use (default: opencode)
#     --provider      Model provider namespace (default: z-ai)
#     --auto-approve  Auto-approve OpenCode permissions (default: true)
#     --retries       Generation attempts before failing (default: 3)
#     --timeout       Generation timeout (default: 600)
#     --health-timeout E2E health timeout in milliseconds (default: 120000)
#     --skip-gen      Skip generation, only evaluate
#     --skip-eval     Skip evaluation, only generate
#     --skip-e2e      Skip E2E testing (static analysis only)
#     --reset         Clean workspace and results before each benchmark run
#     --quiet         Suppress detailed output
################################################################################

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/benchmark-support.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Defaults
MODEL_FILTER=""
LEVEL_FILTER=""
BACKEND_FILTER=""
FRONTEND_FILTER=""
HARNESS="opencode"
PROVIDER="z-ai"
AUTO_APPROVE="true"
RETRIES="3"
SKIP_GEN="false"
SKIP_EVAL="false"
SKIP_E2E="false"
RESET="false"
TIMEOUT="600"
HEALTH_TIMEOUT="120000"
QUIET="false"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --model)
      MODEL_FILTER="$2"
      shift 2
      ;;
    --level)
      LEVEL_FILTER="$2"
      shift 2
      ;;
    --backend)
      BACKEND_FILTER="$2"
      shift 2
      ;;
    --frontend)
      FRONTEND_FILTER="$2"
      shift 2
      ;;
    --harness)
      HARNESS="$2"
      shift 2
      ;;
    --provider)
      PROVIDER="$2"
      shift 2
      ;;
    --auto-approve)
      AUTO_APPROVE="$2"
      shift 2
      ;;
    --retries)
      RETRIES="$2"
      shift 2
      ;;
    --skip-gen)
      SKIP_GEN="true"
      shift
      ;;
    --skip-eval)
      SKIP_EVAL="true"
      shift
      ;;
    --skip-e2e)
      SKIP_E2E="true"
      shift
      ;;
    --reset)
      RESET="true"
      shift
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --health-timeout)
      HEALTH_TIMEOUT="$2"
      shift 2
      ;;
    --quiet)
      QUIET="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

if ! benchmark_require_value "level" "$LEVEL_FILTER" "${BENCHMARK_LEVELS[@]}"; then
  echo -e "${RED}❌ ERROR: Invalid level: $LEVEL_FILTER${NC}"
  exit 1
fi

if ! benchmark_require_value "backend" "$BACKEND_FILTER" "${BENCHMARK_BACKENDS[@]}"; then
  echo -e "${RED}❌ ERROR: Invalid backend: $BACKEND_FILTER${NC}"
  exit 1
fi

if ! benchmark_require_value "frontend" "$FRONTEND_FILTER" "${BENCHMARK_FRONTENDS[@]}"; then
  echo -e "${RED}❌ ERROR: Invalid frontend: $FRONTEND_FILTER${NC}"
  exit 1
fi

# Validate required selectors
if [ -z "$MODEL_FILTER" ] || [ -z "$LEVEL_FILTER" ] || [ -z "$BACKEND_FILTER" ] || [ -z "$FRONTEND_FILTER" ]; then
  echo -e "${RED}❌ ERROR: All four selectors are required${NC}"
  echo "Usage: $0 --model <model> --level <level> --backend <backend> --frontend <frontend> [OPTIONS]"
  exit 1
fi

# Build single test case from selectors
TEST_CASE="${MODEL_FILTER}:${LEVEL_FILTER}:${BACKEND_FILTER}:${FRONTEND_FILTER}:${MODEL_FILTER} - ${LEVEL_FILTER} (${BACKEND_FILTER}+${FRONTEND_FILTER})"
FILTERED_TESTS=("$TEST_CASE")
TOTAL_TESTS=1

slugify_model() {
  local model="$1"
  local model_slug
  model_slug="$(echo "$model" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's|^glm-([0-9.]+)z\.ai$|glm-\1|; s|/|-|g; s|[^a-z0-9._-]+|-|g; s|-+|-|g; s|^-||; s|-$||')"
  echo "${HARNESS}-${model_slug}"
}

# Print header
if [ "$QUIET" != "true" ]; then
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${MAGENTA}Benchmark Test Runner${NC}"
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Model:          ${YELLOW}${MODEL_FILTER}${NC}"
  echo -e "Level:          ${YELLOW}${LEVEL_FILTER}${NC}"
  echo -e "Backend:        ${YELLOW}${BACKEND_FILTER}${NC}"
  echo -e "Frontend:       ${YELLOW}${FRONTEND_FILTER}${NC}"
  echo -e "Harness:        ${YELLOW}${HARNESS}${NC}"
  echo -e "Provider:       ${YELLOW}${PROVIDER}${NC}"
  echo -e "Auto Approve:   ${YELLOW}${AUTO_APPROVE}${NC}"
  echo -e "Retries:        ${YELLOW}${RETRIES}${NC}"
  echo -e "Skip Gen:       ${YELLOW}${SKIP_GEN}${NC}"
  echo -e "Skip Eval:      ${YELLOW}${SKIP_EVAL}${NC}"
  echo -e "Skip E2E:       ${YELLOW}${SKIP_E2E}${NC}"
  echo -e "Reset:          ${YELLOW}${RESET}${NC}"
  echo -e "Health TO:      ${YELLOW}${HEALTH_TIMEOUT}ms${NC}"
  echo ""
fi

# Run tests
TEST_NUM=0
PASSED=0
FAILED=0

for test_case in "${FILTERED_TESTS[@]}"; do
  IFS=':' read -r model level backend frontend desc <<< "$test_case"
  TEST_NUM=$((TEST_NUM + 1))

  if [ "$QUIET" != "true" ]; then
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
    echo -e "Test ${TEST_NUM}/${TOTAL_TESTS}: ${YELLOW}${desc}${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
  fi

  # Determine paths. Workspace keeps one active project per model and level.
  MODEL_SLUG="$(slugify_model "$model")"
  WORKSPACE_DIR="WORKSPACE/${MODEL_SLUG}/${level}"
  RESULTS_DIR="RESULTS/${MODEL_SLUG}/${backend}-${frontend}/${level}/"

  if [ "$RESET" == "true" ]; then
    if [ "$QUIET" != "true" ]; then
      echo -e "${BLUE}→ Resetting workspace and results...${NC}"
    fi

    if ! "$SCRIPT_DIR/cleanup-benchmark.sh" \
      --model "$model" \
      --level "$level" \
      --backend "$backend" \
      --frontend "$frontend" \
      --harness "$HARNESS" \
      --scope all; then
      if [ "$QUIET" != "true" ]; then
        echo -e "${RED}❌ Cleanup failed${NC}"
      fi
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  # Harness-specific session file naming
  SESSION_FILE_SUFFIX=""
  case "$HARNESS" in
    opencode) SESSION_FILE_SUFFIX=".opencode-session-id" ;;
    pi) SESSION_FILE_SUFFIX=".pi-session-id" ;;
    *) SESSION_FILE_SUFFIX=".${HARNESS}-session-id" ;;
  esac
  SESSION_FILE="${WORKSPACE_DIR}${SESSION_FILE_SUFFIX}"

  # Generation phase
  if [ "$SKIP_GEN" != "true" ]; then
    if [ "$QUIET" != "true" ]; then
      echo -e "${BLUE}→ Generating project...${NC}"
    fi

    if "$SCRIPT_DIR/generate-project.sh" \
      --model "$model" \
      --level "$level" \
      --backend "$backend" \
      --frontend "$frontend" \
      --output-dir "$WORKSPACE_DIR" \
      --harness "$HARNESS" \
      --provider "$PROVIDER" \
      --auto-approve "$AUTO_APPROVE" \
      --retries "$RETRIES" \
      --session-file "$SESSION_FILE" \
      --timeout "$TIMEOUT"; then
      if [ "$QUIET" != "true" ]; then
        echo -e "${GREEN}✅ Generation completed${NC}"
      fi
    else
      if [ "$QUIET" != "true" ]; then
        echo -e "${RED}❌ Generation failed${NC}"
      fi
      if [ "$RESET" == "true" ]; then
        if [ "$QUIET" != "true" ]; then
          echo -e "${BLUE}→ Cleaning partial workspace after generation failure...${NC}"
        fi
        "$SCRIPT_DIR/cleanup-benchmark.sh" \
          --model "$model" \
          --level "$level" \
          --backend "$backend" \
          --frontend "$frontend" \
          --harness "$HARNESS" \
          --scope workspace >/dev/null 2>&1 || true
      fi
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  # Evaluation phase
  if [ "$SKIP_EVAL" != "true" ]; then
    if [ "$SKIP_E2E" = "true" ]; then
      # Static analysis only
      if [ "$QUIET" != "true" ]; then
        echo -e "${BLUE}→ Evaluating project (static analysis only)...${NC}"
      fi

      if "$SCRIPT_DIR/eval-generated-project.sh" \
        --generated-dir "$WORKSPACE_DIR" \
        --results-dir "$RESULTS_DIR" \
        --model "$model" \
        --provider "$PROVIDER" \
        --harness "$HARNESS" \
        --level "$level" \
        --backend "$backend" \
        --frontend "$frontend"; then
        if [ "$QUIET" != "true" ]; then
          STATIC_SCORE=$(jq -r '.quality.overall_score' "$RESULTS_DIR/evaluation-results.json" 2>/dev/null || echo "N/A")
          echo -e "${GREEN}✅ Static evaluation completed (Score: ${STATIC_SCORE}/100)${NC}"
        fi
        PASSED=$((PASSED + 1))
      else
        if [ "$QUIET" != "true" ]; then
          echo -e "${RED}❌ Evaluation failed${NC}"
        fi
        FAILED=$((FAILED + 1))
      fi
    else
      # Complete evaluation (static + E2E + merge)
      if [ "$QUIET" != "true" ]; then
        echo -e "${BLUE}→ Evaluating project (static + E2E testing)...${NC}"
      fi

      if "$SCRIPT_DIR/eval-complete.sh" \
        --project-dir "$WORKSPACE_DIR" \
        --backend "$backend" \
        --frontend "$frontend" \
        --model "$model" \
        --level "$level" \
        --provider "$PROVIDER" \
        --harness "$HARNESS" \
        --results-dir "$RESULTS_DIR" \
        --health-timeout "$HEALTH_TIMEOUT"; then
        if [ "$QUIET" != "true" ]; then
          FINAL_SCORE=$(jq -r '.quality.overall_score' "$RESULTS_DIR/evaluation-results.json" 2>/dev/null || echo "N/A")
          FINAL_TIER=$(jq -r '.quality.tier' "$RESULTS_DIR/evaluation-results.json" 2>/dev/null || echo "N/A")
          echo -e "${GREEN}✅ Complete evaluation finished (Score: ${FINAL_SCORE}/100 - ${FINAL_TIER})${NC}"
        fi
        PASSED=$((PASSED + 1))
      else
        if [ "$QUIET" != "true" ]; then
          echo -e "${RED}❌ Evaluation failed${NC}"
        fi
        FAILED=$((FAILED + 1))
      fi
    fi
  else
    PASSED=$((PASSED + 1))
  fi

  if [ "$QUIET" != "true" ]; then
    echo ""
  fi
done

# Print summary
if [ "$QUIET" != "true" ]; then
  echo ""
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${MAGENTA}Benchmark Summary${NC}"
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Total Tests:     ${YELLOW}${TOTAL_TESTS}${NC}"
  echo -e "Passed:          ${GREEN}${PASSED}${NC}"
  echo -e "Failed:          $([ $FAILED -eq 0 ] && echo -e "${GREEN}" || echo -e "${RED}")${FAILED}${NC}"
  echo ""

  if [ $FAILED -eq 0 ] && [ $PASSED -gt 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully${NC}"
    echo ""
    echo "Generated Code: WORKSPACE/"
    echo "Test Results:   RESULTS/"
    echo ""
  else
    echo -e "${RED}❌ Some tests failed${NC}"
  fi

  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
fi

SUMMARY_JSON=$(node -e '
const [model, level, backend, frontend, total, passed, failed] = process.argv.slice(1);
process.stdout.write(JSON.stringify({
  model,
  level,
  backend,
  frontend,
  total_tests: Number(total),
  passed: Number(passed),
  failed: Number(failed),
  status: Number(failed) > 0 ? "failed" : "passed"
}));
' "$MODEL_FILTER" "$LEVEL_FILTER" "$BACKEND_FILTER" "$FRONTEND_FILTER" "$TOTAL_TESTS" "$PASSED" "$FAILED")
echo "SUMMARY_JSON: $SUMMARY_JSON"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
  exit 1
else
  exit 0
fi
