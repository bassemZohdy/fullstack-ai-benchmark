#!/usr/bin/env bash

# shellcheck disable=SC2034
BENCHMARK_LEVELS=("overview" "detailed")
BENCHMARK_BACKENDS=("node-js" "spring-boot" "quarkus")
BENCHMARK_FRONTENDS=("react" "angular")
BENCHMARK_HARNESSES=("opencode" "pi" "claude" "codex" "kilo-code" "mimo-code")
BENCHMARK_PROVIDERS=("z-ai" "zai-coding-plan" "zai-coding-cn" "openrouter" "mimo" "openai" "anthropic")

benchmark_contains() {
  local needle="$1"
  shift

  local item
  for item in "$@"; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done

  return 1
}

benchmark_join_by() {
  local separator="$1"
  shift

  local joined=""
  local item
  for item in "$@"; do
    if [[ -n "$joined" ]]; then
      joined+="$separator"
    fi
    joined+="$item"
  done

  echo "$joined"
}

benchmark_supported_csv() {
  local -n values_ref="$1"
  local IFS=', '
  echo "${values_ref[*]}"
}

benchmark_require_value() {
  local label="$1"
  local value="$2"
  shift 2

  if ! benchmark_contains "$value" "$@"; then
    echo "Invalid $label: $value"
    echo "Valid options: $(benchmark_join_by ', ' "$@")"
    return 1
  fi
}

benchmark_is_runtime_supported() {
  local backend="$1"
  local frontend="$2"

  [[ ("$backend" == "spring-boot" || "$backend" == "node-js") && ("$frontend" == "angular" || "$frontend" == "react") ]]
}

benchmark_slugify_model() {
  local harness="$1"
  local model="$2"
  local model_slug
  model_slug="$(echo "$model" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's|^glm-([0-9.]+)z\.ai$|glm-\1|; s|/|-|g; s|[^a-z0-9._-]+|-|g; s|-+|-|g; s|^-||; s|-$||')"
  echo "${harness}-${model_slug}"
}

benchmark_workspace_dir() {
  local harness="$1"
  local model="$2"
  local level="$3"
  local model_slug
  model_slug="$(benchmark_slugify_model "$harness" "$model")"
  echo "WORKSPACE/${model_slug}/${level}"
}

benchmark_results_dir() {
  local harness="$1"
  local model="$2"
  local backend="$3"
  local frontend="$4"
  local level="$5"
  local model_slug
  model_slug="$(benchmark_slugify_model "$harness" "$model")"
  echo "RESULTS/${model_slug}/${backend}-${frontend}/${level}"
}
