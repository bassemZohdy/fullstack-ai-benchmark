#!/bin/bash

################################################################################
# Generic Project Evaluation Script
#
# Evaluates generated projects with the comprehensive evaluator
# The evaluator checks structure, code quality, Docker, Kubernetes,
# integration, and E2E-related signals
#
# Usage:
#   ./scripts/eval-generated-project.sh \
#     --generated-dir WORKSPACE/opencode-kimi-2.6/overview \
#     --results-dir RESULTS/opencode-kimi-2.6/spring-boot-angular/overview \
#     [--quiet]
#
# Parameters:
#   Required:
#     --generated-dir   Path to generated project
#     --results-dir     Where to save evaluation results
#
#   Optional:
#     --quiet           Suppress detailed output (default: false)
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
QUIET="false"

# Parse arguments
GENERATED_DIR=""
RESULTS_DIR=""
MODEL=""
PROVIDER=""
HARNESS=""
LEVEL=""
BACKEND=""
FRONTEND=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --generated-dir)
      GENERATED_DIR="$2"
      shift 2
      ;;
    --results-dir)
      RESULTS_DIR="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --provider)
      PROVIDER="$2"
      shift 2
      ;;
    --harness)
      HARNESS="$2"
      shift 2
      ;;
    --level)
      LEVEL="$2"
      shift 2
      ;;
    --backend)
      BACKEND="$2"
      shift 2
      ;;
    --frontend)
      FRONTEND="$2"
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

# Validate required parameters
if [ -z "$GENERATED_DIR" ] || [ -z "$RESULTS_DIR" ]; then
  echo -e "${RED}❌ ERROR: Missing required parameters${NC}"
  echo ""
  echo "Required:"
  echo "  --generated-dir <dir>   Path to generated project"
  echo "  --results-dir <dir>     Where to save results"
  echo ""
  echo "Optional:"
  echo "  --model <name>          Model name for metadata"
  echo "  --provider <name>       Provider name for metadata"
  echo "  --backend <type>        Backend framework (default: spring-boot)"
  echo "  --frontend <type>       Frontend framework (default: angular)"
  echo "  --quiet true|false      Suppress output (default: false)"
  exit 1
fi

# Verify generated project exists
if [ ! -d "$GENERATED_DIR" ]; then
  echo -e "${RED}❌ ERROR: Generated project directory not found: $GENERATED_DIR${NC}"
  exit 1
fi

if [ ! "$(ls -A "$GENERATED_DIR")" ]; then
  echo -e "${RED}❌ ERROR: Generated project directory is empty: $GENERATED_DIR${NC}"
  exit 1
fi

# Create results directory
mkdir -p "$RESULTS_DIR"

# Print execution info
if [ "$QUIET" != "true" ]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Project Evaluation (Comprehensive v4.0)${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Generated Project: ${YELLOW}${GENERATED_DIR}${NC}"
  echo -e "Results Directory: ${YELLOW}${RESULTS_DIR}${NC}"
  echo -e "Backend:           ${YELLOW}${BACKEND:-spring-boot}${NC}"
  echo -e "Frontend:          ${YELLOW}${FRONTEND:-angular}${NC}"
  echo ""
fi

RESULTS_FILE="$RESULTS_DIR/evaluation-results.json"
mkdir -p "$RESULTS_DIR"

# Run comprehensive evaluation
if [ "$QUIET" != "true" ]; then
  echo -e "${BLUE}Running comprehensive evaluation...${NC}"
  echo -e "  ${YELLOW}• Cartridge structure (20 pts)${NC}"
  echo -e "  ${YELLOW}• Code quality (15 pts)${NC}"
  echo -e "  ${YELLOW}• Docker deployment (20 pts)${NC}"
  echo -e "  ${YELLOW}• Kubernetes configuration (15 pts)${NC}"
  echo -e "  ${YELLOW}• Integration testing (20 pts)${NC}"
  echo -e "  ${YELLOW}• E2E & other factors (10 pts)${NC}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ ERROR: Node.js is required${NC}"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVAL_SCRIPT="$PROJECT_ROOT/EVAL/comprehensive-evaluator.js"

if [ ! -f "$EVAL_SCRIPT" ]; then
  echo -e "${RED}❌ ERROR: Evaluator not found: $EVAL_SCRIPT${NC}"
  exit 1
fi

if [ "$QUIET" != "true" ]; then
  echo ""
  echo -e "${BLUE}Command: node EVAL/$(basename $EVAL_SCRIPT)${NC}"
  echo ""
fi

if node "$EVAL_SCRIPT" \
  --project-dir "$GENERATED_DIR" \
  --results-file "$RESULTS_FILE" \
  --model "$MODEL" \
  --provider "$PROVIDER" \
  --harness "$HARNESS" \
  --level "$LEVEL" \
  --backend "${BACKEND:-spring-boot}" \
  --frontend "${FRONTEND:-angular}"; then

  if [ "$QUIET" != "true" ]; then
    echo ""
    echo -e "${GREEN}✅ Evaluation completed${NC}"
    echo -e "${GREEN}   Results: ${RESULTS_FILE}${NC}"
    echo ""
  fi

  # Display results summary
  if [ "$QUIET" != "true" ]; then
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
    echo -e "${BLUE}Evaluation Summary${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"

    if command -v jq &> /dev/null; then
      echo ""
      echo -e "Quality:"
      jq '.quality' "$RESULTS_FILE" 2>/dev/null || echo "  (parsing error)"
    else
      echo -e "${YELLOW}(jq not available for pretty-printing results)${NC}"
    fi
  fi
else
  echo ""
  echo -e "${RED}❌ Evaluation failed${NC}"
  exit 1
fi

if [ "$QUIET" != "true" ]; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
fi

# Return success
exit 0
