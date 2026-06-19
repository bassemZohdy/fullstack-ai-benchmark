#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/benchmark-regressions.XXXXXX")"
API_SERVER_PID=""

cleanup() {
  if [[ -n "${API_SERVER_PID:-}" ]] && kill -0 "$API_SERVER_PID" 2>/dev/null; then
    kill "$API_SERVER_PID" 2>/dev/null || true
    wait "$API_SERVER_PID" 2>/dev/null || true
  fi
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
      --compose-timeout "67890" \
      --health-timeout "13579" >/dev/null

  if ! grep -F -- '--build-timeout 12345' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --build-timeout"
  fi

  if ! grep -F -- '--compose-timeout 67890' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --compose-timeout"
  fi

  if ! grep -F -- '--health-timeout 13579' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --health-timeout"
  fi

  if ! grep -F -- '--results-file' "$capture_file" >/dev/null; then
    fail "run-e2e-tests.sh did not forward --results-file"
  fi

  pass "run-e2e-tests.sh forwards timeout flags to e2e-runner.js"
}

run_benchmark_health_timeout_forwarding_smoke() {
  local bench_root="$TMP_DIR/benchmark-health-timeout"
  local script_dir="$bench_root/scripts"
  local capture_file="$TMP_DIR/benchmark-eval-args.txt"
  local project_dir="$TMP_DIR/benchmark-project"
  local results_dir="$TMP_DIR/benchmark-results"

  mkdir -p "$script_dir" "$project_dir" "$results_dir"
  cp "$ROOT_DIR/scripts/run-benchmark.sh" "$script_dir/run-benchmark.sh"
  cp "$ROOT_DIR/scripts/benchmark-support.sh" "$script_dir/benchmark-support.sh"
  cp "$ROOT_DIR/scripts/cleanup-benchmark.sh" "$script_dir/cleanup-benchmark.sh"

  cat > "$script_dir/generate-project.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
mkdir -p "\$4"
exit 0
EOF
  chmod +x "$script_dir/generate-project.sh"

  cat > "$script_dir/eval-complete.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "\$*" > "$capture_file"
exit 0
EOF
  chmod +x "$script_dir/eval-complete.sh"

  PATH="$script_dir:$PATH" \
    "$script_dir/run-benchmark.sh" \
      --model "GLM-5.1Z.AI" \
      --level "overview" \
      --backend "spring-boot" \
      --frontend "angular" \
      --provider "z-ai" \
      --skip-gen \
      --health-timeout "24680" >/dev/null

  if ! grep -F -- '--health-timeout 24680' "$capture_file" >/dev/null; then
    fail "run-benchmark.sh did not forward --health-timeout to eval-complete.sh"
  fi

  pass "run-benchmark.sh forwards --health-timeout to eval-complete.sh"
}

run_api_todo_contract_smoke() {
  local server_script="$TMP_DIR/api-server.js"
  local server_log="$TMP_DIR/api-server.log"
  local server_port="18999"
  cat > "$server_script" <<'EOF'
const http = require("http");

const todos = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/todos") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/todos") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const todo = JSON.parse(body || "{}");
      const created = { ...todo, id: nextId++ };
      todos.push(created);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(created));
    });
    return;
  }

  const match = url.pathname.match(/^\/api\/todos\/(\d+)$/);
  if (match && req.method === "GET") {
    const todo = todos.find((item) => String(item.id) === match[1]);
    if (!todo) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Todo not found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todo));
    return;
  }

  if (match && req.method === "DELETE") {
    const index = todos.findIndex((item) => String(item.id) === match[1]);
    if (index === -1) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Todo not found" }));
      return;
    }
    todos.splice(index, 1);
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(process.env.PORT || 18999, "127.0.0.1");
EOF

  node "$server_script" > "$server_log" 2>&1 &
  API_SERVER_PID=$!

  sleep 1

  if ! BENCHMARK_API_PORT="$server_port" node -e "const api=require(process.argv[1]); api.test('.', 'spring-boot').then((r) => { if (r.failed > 0) process.exit(1); }).catch((err) => { console.error(err); process.exit(1); });" "$ROOT_DIR/E2E_TESTS/helpers/api-tester.js"; then
    fail "api-tester.js did not pass against the todo API contract"
  fi

  if [[ -n "$API_SERVER_PID" ]] && kill -0 "$API_SERVER_PID" 2>/dev/null; then
    kill "$API_SERVER_PID" 2>/dev/null || true
    wait "$API_SERVER_PID" 2>/dev/null || true
  fi
  API_SERVER_PID=""
  pass "api-tester.js matches the generated Spring Boot todo API contract"
}

run_api_todo_missing_id_smoke() {
  local server_script="$TMP_DIR/api-missing-id-server.js"
  local server_log="$TMP_DIR/api-missing-id-server.log"
  local server_port="18998"

  cat > "$server_script" <<'EOF'
const http = require("http");

const todos = [];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/todos") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/todos") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const todo = JSON.parse(body || "{}");
      todos.push(todo);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todo));
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(process.env.PORT || 18998, "127.0.0.1");
EOF

  node "$server_script" > "$server_log" 2>&1 &
  API_SERVER_PID=$!

  sleep 1

  if ! BENCHMARK_API_PORT="$server_port" node -e "const api=require(process.argv[1]); api.test('.', 'spring-boot').then((r) => { if (r.total !== 4 || r.failed !== 2) process.exit(1); }).catch((err) => { console.error(err); process.exit(1); });" "$ROOT_DIR/E2E_TESTS/helpers/api-tester.js"; then
    fail "api-tester.js did not fail the missing-id follow-up checks"
  fi

  if [[ -n "$API_SERVER_PID" ]] && kill -0 "$API_SERVER_PID" 2>/dev/null; then
    kill "$API_SERVER_PID" 2>/dev/null || true
    wait "$API_SERVER_PID" 2>/dev/null || true
  fi
  API_SERVER_PID=""

  pass "api-tester.js fails explicitly when POST /api/todos omits id"
}

run_health_requires_200_smoke() {
  local server_script="$TMP_DIR/health-404-server.js"
  local server_log="$TMP_DIR/health-404-server.log"
  local server_port="4200"

  cat > "$server_script" <<'EOF'
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not ready");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(process.env.PORT || 4200, "127.0.0.1");
EOF

  node "$server_script" > "$server_log" 2>&1 &
  API_SERVER_PID=$!

  sleep 1

  if ! node -e "const runner=require(process.argv[1]); runner.waitForHealth('.', { timeout: 1000 }).then((r) => { if (r.ready) process.exit(1); }).catch((err) => { console.error(err); process.exit(1); });" "$ROOT_DIR/E2E_TESTS/helpers/docker-runner.js"; then
    fail "docker-runner.js still treats 404 as ready"
  fi

  if [[ -n "$API_SERVER_PID" ]] && kill -0 "$API_SERVER_PID" 2>/dev/null; then
    kill "$API_SERVER_PID" 2>/dev/null || true
    wait "$API_SERVER_PID" 2>/dev/null || true
  fi
  API_SERVER_PID=""

  pass "docker-runner.js rejects 404 health responses"
}

run_health_waits_for_backend_port_smoke() {
  local server_script="$TMP_DIR/health-frontend-only-server.js"
  local server_log="$TMP_DIR/health-frontend-only-server.log"
  local server_port="4200"

  cat > "$server_script" <<'EOF'
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
});

server.listen(process.env.PORT || 4200, "127.0.0.1");
EOF

  node "$server_script" > "$server_log" 2>&1 &
  API_SERVER_PID=$!

  sleep 1

  if ! node -e "const runner=require(process.argv[1]); runner.waitForHealth('.', { timeout: 1000, port: 8080 }).then((r) => { if (r.ready) process.exit(1); }).catch((err) => { console.error(err); process.exit(1); });" "$ROOT_DIR/E2E_TESTS/helpers/docker-runner.js"; then
    fail "docker-runner.js still treats frontend-only readiness as backend readiness"
  fi

  if [[ -n "$API_SERVER_PID" ]] && kill -0 "$API_SERVER_PID" 2>/dev/null; then
    kill "$API_SERVER_PID" 2>/dev/null || true
    wait "$API_SERVER_PID" 2>/dev/null || true
  fi
  API_SERVER_PID=""

  pass "docker-runner.js waits for the backend port instead of any healthy port"
}

run_e2e_merger_schema_smoke() {
  local static_file="$TMP_DIR/static-results.json"
  local e2e_file="$TMP_DIR/e2e-results.json"
  local output_file="$TMP_DIR/merged-results.json"

  cat > "$static_file" <<'EOF'
{
  "metadata": {
    "evaluation_version": "4.0",
    "evaluation_type": "comprehensive"
  },
  "quality": {
    "overall_score": 80,
    "tier": "Deployable",
    "pass_rate": 0.8,
    "test_count": 10,
    "passed": 8,
    "failed": 2,
    "scores": {
      "cartridge_structure": 80
    }
  }
}
EOF

  cat > "$e2e_file" <<'EOF'
{
  "status": "partial",
  "startedAt": "2026-06-13T00:00:00.000Z",
  "finishedAt": "2026-06-13T00:01:00.000Z",
  "phases": {
    "build": {
      "backend": { "status": "passed" },
      "frontend": { "status": "passed" }
    },
    "docker": { "status": "started" },
    "health": { "ready": true },
    "api": {
      "total": 2,
      "passed": 1,
      "failed": 1,
      "tests": []
    },
    "frontend": {
      "accessible": true,
      "tests": []
    }
  }
}
EOF

  if ! node "$ROOT_DIR/EVAL/e2e-results-merger.js" --static-results "$static_file" --e2e-results "$e2e_file" --output "$output_file" >/dev/null; then
    fail "e2e-results-merger.js did not merge the schema sample"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.quality.static_test_count !== 10 || r.quality.static_passed !== 8 || r.quality.static_failed !== 2 || r.quality.test_count <= r.quality.static_test_count || r.quality.pass_rate !== r.quality.pass_rate_including_e2e) process.exit(1);" "$output_file"; then
    fail "merged results did not expose static and merged counts correctly"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.metadata.evaluation_type !== 'comprehensive+e2e' || r.metadata.e2e_enabled !== true) process.exit(1);" "$output_file"; then
    fail "merged results did not update metadata correctly"
  fi

  pass "e2e-results-merger.js keeps static and merged metrics separate"
}

run_e2e_merger_tier_cap_smoke() {
  local static_file="$TMP_DIR/static-tier-cap.json"
  local e2e_file="$TMP_DIR/e2e-tier-cap.json"
  local output_file="$TMP_DIR/merged-tier-cap.json"

  cat > "$static_file" <<'EOF'
{
  "metadata": {
    "evaluation_version": "4.0",
    "evaluation_type": "comprehensive"
  },
  "quality": {
    "overall_score": 92,
    "tier": "Production-Ready",
    "pass_rate": 0.9,
    "test_count": 10,
    "passed": 9,
    "failed": 1,
    "scores": {
      "code_quality": 92
    }
  }
}
EOF

  cat > "$e2e_file" <<'EOF'
{
  "status": "health_failed",
  "startedAt": "2026-06-13T00:00:00Z",
  "finishedAt": "2026-06-13T00:01:00Z",
  "phases": {
    "build": {
      "backend": { "status": "passed" },
      "frontend": { "status": "passed" }
    },
    "docker": { "status": "started" },
    "health": { "ready": false, "error": "timed out" },
    "cleanup": { "status": "stopped" }
  }
}
EOF

  if ! node "$ROOT_DIR/EVAL/e2e-results-merger.js" --static-results "$static_file" --e2e-results "$e2e_file" --output "$output_file" >/dev/null; then
    fail "e2e-results-merger.js did not merge the tier-cap sample"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.quality.tier !== 'Functional') process.exit(1);" "$output_file"; then
    fail "merged results did not cap the tier after runtime validation failure"
  fi

  pass "e2e-results-merger.js caps the tier when runtime validation fails"
}

run_embedded_k8s_service_detection_smoke() {
  local project_dir="$TMP_DIR/k8s-embedded-service"
  local k8s_dir="$project_dir/k8s"
  mkdir -p "$k8s_dir"

  cat > "$k8s_dir/backend.yaml" <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
spec:
  template:
    spec:
      containers:
        - name: todo-backend
          image: todo-backend:latest
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
spec:
  selector:
    app: todo-backend
  ports:
    - port: 8080
      targetPort: 8080
EOF

  cat > "$k8s_dir/frontend.yaml" <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-frontend
spec:
  template:
    spec:
      containers:
        - name: todo-frontend
          image: todo-frontend:latest
          ports:
            - containerPort: 80
          livenessProbe:
            httpGet:
              path: /
              port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
spec:
  selector:
    app: todo-frontend
  ports:
    - port: 80
      targetPort: 80
EOF

  if ! node - <<'NODE' "$ROOT_DIR" "$project_dir"
const root = process.argv[2];
const projectDir = process.argv[3];
const k8s = require(`${root}/EVAL/phases/kubernetes-config.js`);
const tests = k8s.testKubernetesConfiguration(projectDir);
  const required = [
  "Backend Service defined",
  "Frontend Service defined",
  "Backend health checks configured",
  "Frontend health checks configured"
];
for (const name of required) {
  const test = tests.find((entry) => entry.name === name);
  if (!test || test.status !== "passed") {
    process.exit(1);
  }
}
NODE
  then
    fail "kubernetes-config.js did not detect embedded Service/Probe manifests"
  fi

  if ! node - <<'NODE' "$ROOT_DIR" "$project_dir"
const root = process.argv[2];
const projectDir = process.argv[3];
const k8s = require(`${root}/EVAL/phases/kubernetes-config.js`);
const tests = k8s.testKubernetesConfiguration(projectDir);
const ingress = tests.find((entry) => entry.name === "Ingress configured");
if (!ingress || ingress.status !== "skipped") {
  process.exit(1);
}
NODE
  then
    fail "kubernetes-config.js did not treat missing ingress as optional"
  fi

  pass "kubernetes-config.js detects embedded Service and probe definitions"
}

run_angular_bootstrap_detection_smoke() {
  local project_dir="$TMP_DIR/angular-bootstrap-smoke"
  local frontend_dir="$project_dir/frontend"
  mkdir -p "$frontend_dir/src/app"

  cat > "$frontend_dir/angular.json" <<'EOF'
{ "version": 1 }
EOF
  cat > "$frontend_dir/package.json" <<'EOF'
{ "name": "frontend", "scripts": { "build": "ng build", "test": "ng test" }, "dependencies": { "@angular/core": "18.0.0" } }
EOF
  cat > "$frontend_dir/tsconfig.json" <<'EOF'
{}
EOF
  cat > "$frontend_dir/src/main.ts" <<'EOF'
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent);
EOF
  cat > "$frontend_dir/src/app/app.component.ts" <<'EOF'
export class AppComponent {}
EOF

  if ! node - <<'NODE' "$ROOT_DIR" "$project_dir"
const root = process.argv[2];
const projectDir = process.argv[3];
const angular = require(`${root}/EVAL/cartridges/frontend/angular.js`);
const tests = angular.testAngularStructure(projectDir);
const routing = tests.find((entry) => entry.name === "Routing configured (Module or Routes)");
if (!routing || routing.status !== "passed") {
  process.exit(1);
}
NODE
  then
    fail "angular.js did not recognise bootstrapApplication-based standalone apps"
  fi

  pass "angular.js recognises bootstrapApplication-based standalone apps"
}

run_frontend_env_detection_smoke() {
  local project_dir="$TMP_DIR/frontend-env-smoke"
  local frontend_dir="$project_dir/frontend"
  local backend_dir="$project_dir/backend"
  mkdir -p "$frontend_dir/src/app" "$frontend_dir/src/assets" "$backend_dir/src/main/java/com/example/controller"

  cat > "$frontend_dir/package.json" <<'EOF'
{ "name": "frontend", "scripts": { "build": "ng build", "test": "ng test" }, "dependencies": { "@angular/core": "18.0.0" } }
EOF
  cat > "$frontend_dir/angular.json" <<'EOF'
{ "version": 1 }
EOF
  cat > "$frontend_dir/src/main.ts" <<'EOF'
console.log('bootstrap');
EOF
  cat > "$frontend_dir/src/app/app.component.ts" <<'EOF'
export class AppComponent {}
EOF
  cat > "$frontend_dir/src/app/app.config.ts" <<'EOF'
export const appConfig = {};
EOF
  cat > "$frontend_dir/src/assets/env.js" <<'EOF'
window.__env = { apiUrl: '/api' };
EOF
  cat > "$frontend_dir/proxy.conf.json" <<'EOF'
{ "/api": { "target": "http://localhost:8080" } }
EOF
  cat > "$frontend_dir/docker-compose.yml" <<'EOF'
services:
  frontend:
    ports:
      - "4200:4200"
EOF
  cat > "$backend_dir/src/main/java/com/example/controller/TodoController.java" <<'EOF'
public class TodoController {}
EOF
  cat > "$frontend_dir/src/app/todo.service.ts" <<'EOF'
export class TodoService {}
EOF

  if ! node - <<'NODE' "$ROOT_DIR" "$project_dir"
const root = process.argv[2];
const projectDir = process.argv[3];
const evaluator = require(`${root}/EVAL/comprehensive-evaluator.js`);
const result = evaluator.__testOnly.evaluateIntegration(projectDir);
const envTest = result.tests.find((entry) => entry.name === "Frontend environment configuration");
if (!envTest || envTest.status !== "passed") {
  process.exit(1);
}
NODE
  then
    fail "comprehensive-evaluator.js did not recognise Angular runtime/proxy environment config"
  fi

  pass "comprehensive-evaluator.js recognises Angular runtime/proxy environment config"
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

run_cleanup_reset_smoke() {
  local cleanup_root="$TMP_DIR/cleanup-smoke"
  local cleanup_script_dir="$cleanup_root/scripts"
  local workspace_dir="$cleanup_root/WORKSPACE/opencode-glm-5.1/overview"
  local results_dir="$cleanup_root/RESULTS/opencode-glm-5.1/spring-boot-angular/overview"
  local legacy_session_file="$cleanup_root/WORKSPACE/opencode-glm-5.1/overview.opencode-session-id"
  local dry_run_output="$TMP_DIR/cleanup-dry-run.txt"

  mkdir -p "$cleanup_script_dir" "$workspace_dir" "$results_dir"
  cp "$ROOT_DIR/scripts/benchmark-support.sh" "$cleanup_script_dir/benchmark-support.sh"
  cp "$ROOT_DIR/scripts/cleanup-benchmark.sh" "$cleanup_script_dir/cleanup-benchmark.sh"

  printf '%s\n' 'workspace-marker' > "$workspace_dir/workspace.txt"
  printf '%s\n' 'results-marker' > "$results_dir/results.txt"
  printf '%s\n' 'legacy-session' > "$legacy_session_file"

  bash "$cleanup_script_dir/cleanup-benchmark.sh" \
    --model "GLM-5.1Z.AI" \
    --level "overview" \
    --backend "spring-boot" \
    --frontend "angular" \
    --harness "opencode" \
    --scope "all" \
    --dry-run > "$dry_run_output"

  if [[ ! -f "$workspace_dir/workspace.txt" || ! -f "$results_dir/results.txt" || ! -f "$legacy_session_file" ]]; then
    fail "cleanup dry-run removed files unexpectedly"
  fi

  if ! grep -F -- "$workspace_dir" "$dry_run_output" >/dev/null; then
    fail "cleanup dry-run did not report the workspace path"
  fi

  if ! grep -F -- "$results_dir" "$dry_run_output" >/dev/null; then
    fail "cleanup dry-run did not report the results path"
  fi

  bash "$cleanup_script_dir/cleanup-benchmark.sh" \
    --model "GLM-5.1Z.AI" \
    --level "overview" \
    --backend "spring-boot" \
    --frontend "angular" \
    --harness "opencode" \
    --scope "all" >/dev/null

  if [[ -e "$workspace_dir" || -e "$results_dir" || -e "$legacy_session_file" ]]; then
    fail "cleanup script did not remove the benchmark workspace and results"
  fi

  pass "cleanup-benchmark.sh safely removes workspace, results, and legacy session paths"
}

run_eval_complete_e2e_failure_smoke() {
  local eval_root="$TMP_DIR/eval-complete-fail"
  local script_dir="$eval_root/scripts"
  local eval_dir="$eval_root/EVAL"
  local project_dir="$eval_root/project"
  local results_dir="$eval_root/results"
  local final_results="$results_dir/evaluation-results.json"
  local static_results="$results_dir/static-evaluation.json"
  local e2e_results="$results_dir/e2e-execution.json"

  mkdir -p "$script_dir" "$eval_dir" "$project_dir" "$results_dir"
  cp "$ROOT_DIR/scripts/eval-complete.sh" "$script_dir/eval-complete.sh"
  cp "$ROOT_DIR/scripts/benchmark-support.sh" "$script_dir/benchmark-support.sh"
  cp "$ROOT_DIR/EVAL/e2e-results-merger.js" "$eval_dir/e2e-results-merger.js"

  cat > "$eval_dir/comprehensive-evaluator.js" <<EOF
#!/usr/bin/env node
const fs = require("fs");
const args = process.argv.slice(2);
let resultsFile = "";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--results-file") {
    resultsFile = args[i + 1];
    break;
  }
}
fs.writeFileSync(resultsFile, JSON.stringify({
  metadata: {
    evaluation_version: "test",
    timestamp: new Date().toISOString()
  },
  quality: {
    overall_score: 82,
    tier: "Deployable",
    pass_rate: 0.8,
    test_count: 5,
    passed: 4,
    failed: 1,
    scores: {
      code_quality: 82
    }
  }
}, null, 2));
EOF
  chmod +x "$eval_dir/comprehensive-evaluator.js"

  cat > "$script_dir/run-e2e-tests.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
results_file=""
while [[ \$# -gt 0 ]]; do
  case \$1 in
    --results-file) results_file="\$2"; shift 2 ;;
    *) shift ;;
  esac
done
cat > "\$results_file" <<JSON
{
  "status": "health_failed",
  "startedAt": "2026-06-08T00:00:00Z",
  "finishedAt": "2026-06-08T00:01:00Z",
  "phases": {
    "build": {
      "backend": { "status": "passed" },
      "frontend": { "status": "passed" }
    },
    "docker": { "status": "started" },
    "health": { "ready": false, "error": "timed out" },
    "cleanup": { "status": "stopped" }
  }
}
JSON
exit 1
EOF
  chmod +x "$script_dir/run-e2e-tests.sh"

  if "$script_dir/eval-complete.sh" \
      --project-dir "$project_dir" \
      --backend "spring-boot" \
      --frontend "angular" \
      --model "GLM-5.1Z.AI" \
      --level "overview" \
      --results-dir "$results_dir"; then
    fail "eval-complete.sh unexpectedly succeeded after an E2E failure"
  fi

  if [[ ! -f "$final_results" || ! -f "$static_results" || ! -f "$e2e_results" ]]; then
    fail "eval-complete.sh did not write the expected result files"
  fi

  if ! node -e "const r=require(process.argv[1]); if (r.runtime_validation?.status !== 'health_failed') process.exit(1);" "$final_results"; then
    fail "eval-complete.sh did not preserve the E2E failure in the merged results"
  fi

  pass "eval-complete.sh fails the benchmark when E2E health fails"
}

run_eval_generated_static_output_smoke() {
  local eval_root="$TMP_DIR/eval-generated-static"
  local script_dir="$eval_root/scripts"
  local eval_dir="$eval_root/EVAL"
  local project_dir="$eval_root/project"
  local results_dir="$eval_root/results"

  mkdir -p "$script_dir" "$eval_dir" "$project_dir" "$results_dir"
  cp "$ROOT_DIR/scripts/eval-generated-project.sh" "$script_dir/eval-generated-project.sh"

  cat > "$eval_dir/comprehensive-evaluator.js" <<EOF
#!/usr/bin/env node
const fs = require("fs");
const args = process.argv.slice(2);
let resultsFile = "";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--results-file") {
    resultsFile = args[i + 1];
    break;
  }
}
fs.writeFileSync(resultsFile, JSON.stringify({
  metadata: {
    evaluation_version: "test",
    timestamp: new Date().toISOString()
  },
  quality: {
    overall_score: 77,
    tier: "Deployable",
    pass_rate: 1,
    test_count: 1,
    passed: 1,
    failed: 0,
    scores: {
      code_quality: 77
    }
  }
}, null, 2));
EOF
  chmod +x "$eval_dir/comprehensive-evaluator.js"
  printf '%s\n' '# readme' > "$project_dir/README.md"

  if ! "$script_dir/eval-generated-project.sh" \
      --generated-dir "$project_dir" \
      --results-dir "$results_dir" \
      --backend "spring-boot" \
      --frontend "angular" \
      --quiet; then
    fail "eval-generated-project.sh failed in static-only smoke test"
  fi

  if [[ ! -f "$results_dir/static-evaluation.json" ]]; then
    fail "eval-generated-project.sh did not write static-evaluation.json"
  fi

  if [[ -f "$results_dir/evaluation-results.json" ]]; then
    fail "eval-generated-project.sh should not write merged evaluation-results.json"
  fi

  pass "eval-generated-project.sh writes static-evaluation.json for static-only runs"
}

main() {
  run_generate_resume_smoke
  run_e2e_timeout_forwarding_smoke
  run_benchmark_health_timeout_forwarding_smoke
  run_api_todo_contract_smoke
  run_api_todo_missing_id_smoke
  run_health_requires_200_smoke
  run_health_waits_for_backend_port_smoke
  run_e2e_merger_schema_smoke
  run_e2e_merger_tier_cap_smoke
  run_embedded_k8s_service_detection_smoke
  run_angular_bootstrap_detection_smoke
  run_frontend_env_detection_smoke
  run_e2e_build_failure_smoke
  run_e2e_cleanup_on_health_failure_smoke
  run_cleanup_reset_smoke
  run_eval_complete_e2e_failure_smoke
  run_eval_generated_static_output_smoke
  pass "All regression smoke checks passed"
}

main "$@"
