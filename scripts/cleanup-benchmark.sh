#!/usr/bin/env bash
set -euo pipefail

# Remove generated benchmark outputs for a selected model/backend/frontend/level
# Usage:
#   ./scripts/cleanup-benchmark.sh \
#     --model GLM-5.1Z.AI \
#     --level overview \
#     --backend spring-boot \
#     --frontend angular \
#     [--harness opencode] \
#     [--scope workspace|results|all] \
#     [--dry-run]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
. "$SCRIPT_DIR/benchmark-support.sh"

MODEL=""
LEVEL=""
BACKEND=""
FRONTEND=""
HARNESS="opencode"
SCOPE="all"
DRY_RUN="false"

log_info() {
  echo "[INFO] $1"
}

log_warn() {
  echo "[WARN] $1"
}

log_error() {
  echo "[ERR] $1" >&2
}

show_usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Remove generated benchmark workspace and results for one benchmark scope.

OPTIONS:
  --model <model>       Model id to clean (required)
  --level <level>       Spec level: overview or detailed (required)
  --backend <backend>   Backend framework (required)
  --frontend <frontend> Frontend framework (required)
  --harness <harness>   Harness name (default: opencode)
  --scope <scope>       workspace, results, or all (default: all)
  --dry-run             Print paths without deleting them
  --help                Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --model) MODEL="$2"; shift 2 ;;
    --level) LEVEL="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --frontend) FRONTEND="$2"; shift 2 ;;
    --harness) HARNESS="$2"; shift 2 ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --dry-run) DRY_RUN="true"; shift ;;
    --help) show_usage; exit 0 ;;
    *) log_error "Unknown option: $1"; show_usage; exit 1 ;;
  esac
done

if [[ -z "$MODEL" || -z "$LEVEL" || -z "$BACKEND" || -z "$FRONTEND" ]]; then
  log_error "Model, level, backend, and frontend are required"
  show_usage
  exit 1
fi

if ! benchmark_require_value "level" "$LEVEL" "${BENCHMARK_LEVELS[@]}"; then
  log_error "Invalid level: $LEVEL"
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

if ! benchmark_require_value "harness" "$HARNESS" "${BENCHMARK_HARNESSES[@]}"; then
  log_error "Invalid harness: $HARNESS"
  exit 1
fi

if ! benchmark_contains "$SCOPE" workspace results all; then
  log_error "Invalid scope: $SCOPE"
  log_error "Valid options: workspace, results, all"
  exit 1
fi

WORKSPACE_DIR="$(benchmark_workspace_dir "$HARNESS" "$MODEL" "$LEVEL")"
RESULTS_DIR="$(benchmark_results_dir "$HARNESS" "$MODEL" "$BACKEND" "$FRONTEND" "$LEVEL")"

resolve_abs_path() {
  local rel_path="$1"
  echo "${PROJECT_ROOT}/${rel_path#./}"
}

WORKSPACE_ABS="$(resolve_abs_path "$WORKSPACE_DIR")"
RESULTS_ABS="$(resolve_abs_path "$RESULTS_DIR")"

case "$WORKSPACE_ABS" in
  "$PROJECT_ROOT"/WORKSPACE/*) ;;
  *)
    log_error "Refusing to clean unsafe workspace path: $WORKSPACE_ABS"
    exit 1
    ;;
esac

case "$RESULTS_ABS" in
  "$PROJECT_ROOT"/RESULTS/*) ;;
  *)
    log_error "Refusing to clean unsafe results path: $RESULTS_ABS"
    exit 1
    ;;
esac

log_info "Workspace: $WORKSPACE_ABS"
log_info "Results:   $RESULTS_ABS"
log_info "Scope:     $SCOPE"

delete_path() {
  local path="$1"
  if [[ -d "$path" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "Dry run: would remove $path"
    else
      log_warn "Removing $path"
      rm -rf "$path"
    fi
  else
    log_info "Skipping missing path: $path"
  fi
}

if [[ "$SCOPE" == "workspace" || "$SCOPE" == "all" ]]; then
  delete_path "$WORKSPACE_ABS"
fi

if [[ "$SCOPE" == "results" || "$SCOPE" == "all" ]]; then
  delete_path "$RESULTS_ABS"
fi

log_info "Cleanup complete"
