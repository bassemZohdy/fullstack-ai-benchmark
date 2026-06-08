#!/usr/bin/env bash

BENCHMARK_LEVELS=("overview" "detailed")
BENCHMARK_BACKENDS=("node-js" "spring-boot" "quarkus")
BENCHMARK_FRONTENDS=("react" "angular")
BENCHMARK_HARNESSES=("opencode" "pi")
BENCHMARK_PROVIDERS=("z-ai" "zai-coding-plan" "zai-coding-cn" "openrouter")

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

  [[ "$backend" == "spring-boot" && "$frontend" == "angular" ]]
}
