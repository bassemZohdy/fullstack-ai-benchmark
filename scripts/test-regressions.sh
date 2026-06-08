#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/benchmark-regressions.XXXXXX")"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM

fail() {
  echo "[ERR] $1" >&2
  exit 1
}

pass() {
  echo "[OK] $1"
}

run_generate_resume_smoke() {
  local output_dir="$TMP_DIR/generate"
  local session_file="$output_dir/.opencode-session-id"
  local output

  mkdir -p "$output_dir"
  printf '%s\n' 'resume-session-123' > "$session_file"

  output="$(
    "$ROOT_DIR/scripts/generate-project.sh" \
      --model "GLM-5.1Z.AI" \
      --level "overview" \
      --backend "node-js" \
      --frontend "react" \
      --output-dir "$output_dir" \
      --harness "opencode" \
      --provider "z-ai" \
      --auto-approve "false" \
      --retries "1" \
      --timeout "240" \
      --session-file "$session_file" \
      --dry-run "true"
  )"

  if ! printf '%s\n' "$output" | grep -F -- '--session resume-session-123' >/dev/null; then
    fail "generate-project.sh dry-run did not preserve the session id in the command line"
  fi

  pass "generate-project.sh dry-run preserves session resume"
}

run_e2e_timeout_forwarding_smoke() {
  local fake_bin="$TMP_DIR/bin"
  local capture_file="$TMP_DIR/node-args.txt"
  local project_dir="$TMP_DIR/project"
  local results_file="$TMP_DIR/e2e-results.json"
  local node_script="$fake_bin/node"

  mkdir -p "$fake_bin" "$project_dir"

  cat > "$node_script" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" > "$capture_file"
exit 0
EOF
  chmod +x "$node_script"

  PATH="$fake_bin:$PATH" \
    "$ROOT_DIR/scripts/run-e2e-tests.sh" \
      --project-dir "$project_dir" \
      --backend "spring-boot" \
      --frontend "angular" \
      --results-file "$results_file" \
      --build-timeout "12345" \
      --compose-timeout "67890" >/dev/null

  if ! grep -F -- '--build-timeout 12345' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --build-timeout"
  fi

  if ! grep -F -- '--compose-timeout 67890' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --compose-timeout"
  fi

  if ! grep -F -- '--results-file' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --results-file"
  fi

  pass "run-e2e-tests.sh forwards timeout flags to e2e-runner.js"
}

run_e2e_build_failure_smoke() {
  local runner_dir="$TMP_DIR/e2e-build-fail"
  local helper_dir="$runner_dir/helpers"
  local project_dir="$TMP_DIR/project-build-fail"
  local results_file="$TMP_DIR/e2e-build-fail.json"

  mkdir -p "$helper_dir" "$project_dir"
  cp "$ROOT_DIR/E2E_TESTS/e2e-runner.js" "$runner_dir/e2e-runner.js"

  cat > "$helper_dir/build-validator.js" <<'EOF'
module.exports = {
  validate() {
    return {
      status: "failed",
      exitCode: 1,
      durationMs: 1,
      stderr: "build failed"
    };
  }
};
EOF

  cat > "$helper_dir/docker-runner.js" <<'EOF'
module.exports = {
  startup() {
    throw new Error("docker startup should not be called");
  },
  waitForHealth() {
    throw new Error("health check should not be called");
  },
  shutdown() {
    throw new Error("cleanup should not be called");
  }
};
EOF

  cat > "$helper_dir/api-tester.js" <<'EOF'
module.exports = {
  test() {
    throw new Error("api test should not be called");
  }
};
EOF

  cat > "$helper_dir/frontend-tester.js" <<'EOF'
module.exports = {
  test() {
    throw new Error("frontend test should not be called");
  }
};
EOF

  if node "$runner_dir/e2e-runner.js" \
      --project-dir "$project_dir" \
      --backend "spring-boot" \
      --frontend "angular" \
      --results-file "$results_file"; then
    fail "e2e-runner.js unexpectedly succeeded on build failure"
  fi

  if [[ ! -f "$results_file" ]]; then
    fail "e2e-runner.js did not write a results file for build failure"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.status !== 'build_failed') process.exit(1);" "$results_file"; then
    fail "e2e-runner.js did not report build_failed for a build failure"
  fi

  pass "e2e-runner.js handles build failure without touching Docker"
}

run_e2e_cleanup_on_health_failure_smoke() {
  local runner_dir="$TMP_DIR/e2e-health-fail"
  local helper_dir="$runner_dir/helpers"
  local project_dir="$TMP_DIR/project-health-fail"
  local results_file="$TMP_DIR/e2e-health-fail.json"
  local cleanup_marker="$TMP_DIR/cleanup-called.txt"

  mkdir -p "$helper_dir" "$project_dir"
  cp "$ROOT_DIR/E2E_TESTS/e2e-runner.js" "$runner_dir/e2e-runner.js"

  cat > "$helper_dir/build-validator.js" <<'EOF'
module.exports = {
  validate() {
    return {
      status: "passed",
      exitCode: 0,
      durationMs: 1
    };
  }
};
EOF

  cat > "$helper_dir/docker-runner.js" <<EOF
const fs = require("fs");
module.exports = {
  startup() {
    return { status: "started", exitCode: 0 };
  },
  waitForHealth() {
    return { ready: false, durationMs: 1 };
  },
  shutdown() {
    fs.writeFileSync(process.env.CLEANUP_MARKER, "shutdown-called");
    return { status: "stopped" };
  }
};
EOF

  cat > "$helper_dir/api-tester.js" <<'EOF'
module.exports = {
  test() {
    throw new Error("api test should not be called when health fails");
  }
};
EOF

  cat > "$helper_dir/frontend-tester.js" <<'EOF'
module.exports = {
  test() {
    throw new Error("frontend test should not be called when health fails");
  }
};
EOF

  if CLEANUP_MARKER="$cleanup_marker" node "$runner_dir/e2e-runner.js" \
      --project-dir "$project_dir" \
      --backend "spring-boot" \
      --frontend "angular" \
      --results-file "$results_file"; then
    fail "e2e-runner.js unexpectedly succeeded on health failure"
  fi

  if [[ ! -f "$cleanup_marker" ]]; then
    fail "e2e-runner.js did not run cleanup after health failure"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.status !== 'health_failed') process.exit(1);" "$results_file"; then
    fail "e2e-runner.js did not report health_failed for a health failure"
  fi

  pass "e2e-runner.js cleans up after health failure"
}

main() {
  run_generate_resume_smoke
  run_e2e_timeout_forwarding_smoke
  run_e2e_build_failure_smoke
  run_e2e_cleanup_on_health_failure_smoke
  pass "All regression smoke checks passed"
}

main "$@"
