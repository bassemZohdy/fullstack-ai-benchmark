#!/usr/bin/env bash
set -euo pipefail

# Run E2E tests on a generated project
# Usage: ./scripts/run-e2e-tests.sh --project-dir <path> --backend <backend> --frontend <frontend> [--results-file <file>]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function log_section() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

function log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

function log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

function log_error() {
  echo -e "${RED}❌${NC} $1"
}

function show_usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run E2E tests on a generated project.

OPTIONS:
  --project-dir <dir>       Path to generated project (required)
  --backend <backend>       Backend type (spring-boot, node-js)
  --frontend <frontend>     Frontend type (angular, react)
  --results-file <file>     Save results to file (optional)
  --build-timeout <ms>      Build timeout in milliseconds (default: 900000)
  --compose-timeout <ms>    Docker compose timeout (default: 120000)
  --help                    Show this help message

Example:
  ./scripts/run-e2e-tests.sh \\
    --project-dir WORKSPACE/opencode-glm-5.1/overview \\
    --backend spring-boot \\
    --frontend angular
EOF
}

PROJECT_DIR=""
BACKEND="spring-boot"
FRONTEND="angular"
RESULTS_FILE=""
BUILD_TIMEOUT=""
COMPOSE_TIMEOUT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --project-dir) PROJECT_DIR="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --frontend) FRONTEND="$2"; shift 2 ;;
    --results-file) RESULTS_FILE="$2"; shift 2 ;;
    --build-timeout) BUILD_TIMEOUT="$2"; shift 2 ;;
    --compose-timeout) COMPOSE_TIMEOUT="$2"; shift 2 ;;
    --help) show_usage; exit 0 ;;
    *) log_error "Unknown option: $1"; show_usage; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_DIR" ]]; then
  log_error "Project directory is required"
  show_usage
  exit 1
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
  log_error "Project directory does not exist: $PROJECT_DIR"
  exit 1
fi

log_section "E2E Test Suite"
log_info "Project:    $(basename "$PROJECT_DIR")"
log_info "Backend:    $BACKEND"
log_info "Frontend:   $FRONTEND"

# Build E2E command
E2E_CMD="node E2E_TESTS/e2e-runner.js --project-dir $PROJECT_DIR --backend $BACKEND --frontend $FRONTEND"

if [[ -n "$RESULTS_FILE" ]]; then
  E2E_CMD="$E2E_CMD --results-file $RESULTS_FILE"
fi

if [[ -n "$BUILD_TIMEOUT" ]]; then
  E2E_CMD="$E2E_CMD --build-timeout $BUILD_TIMEOUT"
fi

if [[ -n "$COMPOSE_TIMEOUT" ]]; then
  E2E_CMD="$E2E_CMD --compose-timeout $COMPOSE_TIMEOUT"
fi

# Run E2E tests
log_section "Starting E2E Tests"
if eval "$E2E_CMD"; then
  log_success "E2E tests passed"
  exit 0
else
  log_error "E2E tests failed"
  exit 1
fi
