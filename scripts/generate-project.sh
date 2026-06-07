#!/bin/bash

################################################################################
# Generic Project Generation Script
#
# Generates a project using LLM based on specification and parameters
# Supports pluggable harnesses (opencode, pi, or any custom harness) with
# provider-specific model routing and harness-agnostic session management.
#
# Usage:
#   ./scripts/generate-project.sh \
#     --model GLM-5.1Z.AI \
#     --level overview \
#     --backend node-js \
#     --frontend react \
#     --output-dir WORKSPACE/... \
#     [--harness opencode|pi] \
#     [--provider z-ai|openrouter] \
#     [--timeout 120]
#
# Parameters:
#   Required:
#     --model        Model to use
#     --level        Specification level (overview, detailed)
#     --backend      Backend framework (node-js, spring-boot, quarkus)
#     --frontend     Frontend framework (react, angular)
#     --output-dir   Where to save generated project
#
#   Optional:
#     --harness      Generation harness (default: opencode; valid: opencode, pi, or custom)
#     --provider     Model provider namespace (default: z-ai)
#     --timeout      Generation timeout in seconds (default: 120)
#     --spec-file    Custom specification file path
#     --auto-approve Auto-approve harness permissions (default: true)
#     --retries      Generation attempts before failing (default: 3)
#     --session-id   Existing harness session id to resume
#     --session-file File used to persist harness session id
#     --session-record-file File used to persist detailed session history
#     --template     Prompt template path
#     --dry-run      Simulate without API calls (default: false)
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Harness abstraction: Resolve CLI for any harness
resolve_harness_cli() {
  local harness="$1"
  local cli=""

  case "$harness" in
    opencode)
      if command -v opencode &> /dev/null; then
        echo "opencode"
      fi
      ;;
    pi)
      # Check for PI CLI in multiple locations (prefer .cmd over .ps1 for bash)
      for candidate in "$BENCHMARK_PI_CLI" "$PI_CLI" "$HOME/AppData/Local/pi-node/current/pi.cmd" "$HOME/AppData/Local/pi-node/current/pi" "pi"; do
        [ -z "$candidate" ] && continue
        if [ -x "$candidate" ] 2>/dev/null || [ -f "$candidate" ] 2>/dev/null || command -v "$candidate" &> /dev/null 2>&1; then
          echo "$candidate"
          return 0
        fi
      done
      ;;
  esac
  return 1
}

# Harness abstraction: Map provider to harness-specific format
map_harness_provider() {
  local harness="$1"
  local provider="$2"

  case "$harness" in
    opencode)
      [ "$provider" == "z-ai" ] && echo "zai-coding-plan" || echo "$provider"
      ;;
    pi)
      [ "$provider" == "z-ai" ] && echo "zai-coding-cn" || echo "$provider"
      ;;
    *)
      echo "$provider"
      ;;
  esac
}

# Harness abstraction: Map model ID to harness-specific format
map_harness_model() {
  local harness="$1"
  local provider="$2"
  local model="$3"

  case "$model" in
    GLM-5.1Z.AI|glm-5.1z.ai|glm-5.1)
      [ "$provider" == "zai-coding-plan" ] || [ "$provider" == "zai-coding-cn" ] && echo "glm-5.1" || echo "$model"
      ;;
    kimi/2.6)
      [ "$provider" == "openrouter" ] && echo "moonshotai/kimi-k2.6" || echo "$model"
      ;;
    minimax/1.5)
      [ "$provider" == "openrouter" ] && echo "minimax/minimax-m3" || echo "$model"
      ;;
    xiaomi/mimo-2.5)
      [ "$provider" == "openrouter" ] && echo "xiaomi/mimo-v2.5-pro" || echo "$model"
      ;;
    *)
      echo "$model"
      ;;
  esac
}

# Defaults
HARNESS="opencode"
PROVIDER="z-ai"
TIMEOUT="120"
AUTO_APPROVE="true"
RETRIES="3"
SESSION_ID=""
SESSION_FILE=""
SESSION_RECORD_FILE=""
TEMPLATE_FILE="PROMPTS/templates/project-generation.md"
DRY_RUN="false"
SPEC_FILE=""

# Parse arguments
MODEL=""
LEVEL=""
BACKEND=""
FRONTEND=""
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --model)
      MODEL="$2"
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
    --output-dir)
      OUTPUT_DIR="$2"
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
    --timeout)
      TIMEOUT="$2"
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
    --session-id)
      SESSION_ID="$2"
      shift 2
      ;;
    --session-file)
      SESSION_FILE="$2"
      shift 2
      ;;
    --session-record-file)
      SESSION_RECORD_FILE="$2"
      shift 2
      ;;
    --template)
      TEMPLATE_FILE="$2"
      shift 2
      ;;
    --spec-file)
      SPEC_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$MODEL" ] || [ -z "$LEVEL" ] || [ -z "$BACKEND" ] || [ -z "$FRONTEND" ] || [ -z "$OUTPUT_DIR" ]; then
  echo -e "${RED}❌ ERROR: Missing required parameters${NC}"
  echo ""
  echo "Required:"
  echo "  --model <model>         (e.g., GLM-5.1Z.AI, kimi/2.6, minimax/1.5)"
  echo "  --level <level>         (overview, detailed)"
  echo "  --backend <backend>     (node-js, spring-boot, quarkus)"
  echo "  --frontend <frontend>   (react, angular)"
  echo "  --output-dir <dir>      (where to save generated project)"
  echo ""
  echo "Optional:"
  echo "  --harness <harness>     (default: opencode)"
  echo "  --provider <provider>   (default: z-ai)"
  echo "  --timeout <seconds>     (default: 120)"
  echo "  --spec-file <path>      (custom spec file)"
  echo "  --auto-approve true|false (default: true)"
  echo "  --retries <count>       (default: 3)"
  echo "  --session-id <id>       (resume an existing OpenCode session)"
  echo "  --session-file <path>   (persist/resume OpenCode session id)"
  echo "  --session-record-file <path> (store detailed session history)"
  echo "  --template <path>       (prompt template file)"
  echo "  --dry-run true|false    (default: false)"
  exit 1
fi

if [ "$LEVEL" != "overview" ] && [ "$LEVEL" != "detailed" ]; then
  echo -e "${RED}❌ ERROR: Invalid level: $LEVEL${NC}"
  echo "Valid options: overview, detailed"
  exit 1
fi

# Determine specification file if not provided
if [ -z "$SPEC_FILE" ]; then
  SPEC_FILE="PROMPTS/${LEVEL}.md"
fi

# Verify specification file exists
if [ ! -f "$SPEC_FILE" ]; then
  echo -e "${RED}❌ ERROR: Specification file not found: $SPEC_FILE${NC}"
  exit 1
fi

SPEC_FILE="$(cd "$(dirname "$SPEC_FILE")" && pwd)/$(basename "$SPEC_FILE")"

BACKEND_CARTRIDGE="PROMPTS/cartridges/backend/${BACKEND}.md"
FRONTEND_CARTRIDGE="PROMPTS/cartridges/frontend/${FRONTEND}.md"

if [ ! -f "$BACKEND_CARTRIDGE" ]; then
  echo -e "${RED}❌ ERROR: Backend cartridge not found: $BACKEND_CARTRIDGE${NC}"
  exit 1
fi

if [ ! -f "$FRONTEND_CARTRIDGE" ]; then
  echo -e "${RED}❌ ERROR: Frontend cartridge not found: $FRONTEND_CARTRIDGE${NC}"
  exit 1
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo -e "${RED}❌ ERROR: Prompt template not found: $TEMPLATE_FILE${NC}"
  exit 1
fi

BACKEND_CARTRIDGE="$(cd "$(dirname "$BACKEND_CARTRIDGE")" && pwd)/$(basename "$BACKEND_CARTRIDGE")"
FRONTEND_CARTRIDGE="$(cd "$(dirname "$FRONTEND_CARTRIDGE")" && pwd)/$(basename "$FRONTEND_CARTRIDGE")"
TEMPLATE_FILE="$(cd "$(dirname "$TEMPLATE_FILE")" && pwd)/$(basename "$TEMPLATE_FILE")"

# Validate harness/provider
if [ "$HARNESS" != "opencode" ] && [ "$HARNESS" != "pi" ]; then
  echo -e "${RED}❌ ERROR: Invalid harness: $HARNESS${NC}"
  echo "Valid options: opencode, pi"
  exit 1
fi

# Resolve harness CLI early (needed for all paths)
HARNESS_CLI="$(resolve_harness_cli "$HARNESS")"

if [ "$PROVIDER" != "z-ai" ] && [ "$PROVIDER" != "zai-coding-plan" ] && [ "$PROVIDER" != "openrouter" ]; then
  echo -e "${RED}❌ ERROR: Invalid provider: $PROVIDER${NC}"
  echo "Valid options: z-ai, zai-coding-plan, openrouter"
  exit 1
fi

if [ "$AUTO_APPROVE" != "true" ] && [ "$AUTO_APPROVE" != "false" ]; then
  echo -e "${RED}❌ ERROR: Invalid auto-approve value: $AUTO_APPROVE${NC}"
  echo "Valid options: true, false"
  exit 1
fi

if ! [[ "$RETRIES" =~ ^[1-9][0-9]*$ ]]; then
  echo -e "${RED}❌ ERROR: Invalid retries value: $RETRIES${NC}"
  echo "Retries must be a positive integer"
  exit 1
fi

if ! [[ "$TIMEOUT" =~ ^[1-9][0-9]*$ ]]; then
  echo -e "${RED}❌ ERROR: Invalid timeout value: $TIMEOUT${NC}"
  echo "Timeout must be a positive integer number of seconds"
  exit 1
fi

# Check required credentials based on provider
if [ "$PROVIDER" == "openrouter" ] && [ -z "$OPENROUTER_API_KEY" ]; then
  echo -e "${RED}❌ ERROR: OPENROUTER_API_KEY not set${NC}"
  exit 1
fi

# Validate harness CLI is available
if [ "$DRY_RUN" != "true" ] && [ -z "$HARNESS_CLI" ]; then
  echo -e "${RED}❌ ERROR: CLI not found for harness: $HARNESS${NC}"
  case "$HARNESS" in
    opencode)
      echo "Install with: pip install opencode (or follow https://opencode.ai/docs)"
      ;;
    pi)
      echo "Install PI or set BENCHMARK_PI_CLI environment variable"
      ;;
    *)
      echo "Please configure and install: $HARNESS"
      ;;
  esac
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ ERROR: Node.js not found in PATH${NC}"
  echo "Node.js is required to render prompt templates and run the evaluator."
  exit 1
fi

if [ "$OUTPUT_DIR" == "/" ] || [ "$OUTPUT_DIR" == "." ] || [ "$OUTPUT_DIR" == "$PROJECT_ROOT" ]; then
  echo -e "${RED}❌ ERROR: Refusing unsafe output directory: $OUTPUT_DIR${NC}"
  exit 1
fi

OUTPUT_DIR_PARENT="$(dirname "$OUTPUT_DIR")"
OUTPUT_DIR_BASENAME="$(basename "$OUTPUT_DIR")"
mkdir -p "$OUTPUT_DIR_PARENT"
OUTPUT_DIR="$(cd "$OUTPUT_DIR_PARENT" && pwd)/$OUTPUT_DIR_BASENAME"

if [ -z "$SESSION_FILE" ]; then
  if [ "$HARNESS" == "pi" ]; then
    SESSION_FILE="$OUTPUT_DIR/.pi-session-id"
  else
    SESSION_FILE="$OUTPUT_DIR/.opencode-session-id"
  fi
fi

if [ -z "$SESSION_RECORD_FILE" ]; then
  if [ "$HARNESS" == "pi" ]; then
    SESSION_RECORD_FILE="$OUTPUT_DIR/.pi-session"
  else
    SESSION_RECORD_FILE="$OUTPUT_DIR/.opencode-session"
  fi
fi

if [ -z "$SESSION_ID" ] && [ -f "$SESSION_FILE" ]; then
  SESSION_ID="$(head -n 1 "$SESSION_FILE" | tr -d '[:space:]')"
fi

# Print execution info
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Project Generation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Model:        ${YELLOW}${MODEL}${NC}"
echo -e "Level:        ${YELLOW}${LEVEL}${NC}"
echo -e "Backend:      ${YELLOW}${BACKEND}${NC}"
echo -e "Frontend:     ${YELLOW}${FRONTEND}${NC}"
echo -e "Harness:      ${YELLOW}${HARNESS}${NC}"
echo -e "Provider:     ${YELLOW}${PROVIDER}${NC}"
echo -e "Timeout:      ${YELLOW}${TIMEOUT}s${NC}"
echo -e "Spec File:    ${YELLOW}${SPEC_FILE}${NC}"
echo -e "Template:     ${YELLOW}${TEMPLATE_FILE}${NC}"
echo -e "Backend Cart: ${YELLOW}${BACKEND_CARTRIDGE}${NC}"
echo -e "Frontend Cart:${YELLOW}${FRONTEND_CARTRIDGE}${NC}"
echo -e "Output Dir:   ${YELLOW}${OUTPUT_DIR}${NC}"
echo -e "Auto Approve: ${YELLOW}${AUTO_APPROVE}${NC}"
echo -e "Retries:      ${YELLOW}${RETRIES}${NC}"
[ ! -z "$SESSION_ID" ] && echo -e "Session ID:   ${YELLOW}${SESSION_ID}${NC}"
echo -e "Session File: ${YELLOW}${SESSION_FILE}${NC}"
echo -e "Session Rec:  ${YELLOW}${SESSION_RECORD_FILE}${NC}"
echo -e "Dry Run:      ${YELLOW}${DRY_RUN}${NC}"
echo ""

# Record start time
START_TIME=$(date +%s)
echo -e "${BLUE}Starting generation at $(date)${NC}"
echo ""

# Resolve harness-specific provider and model
HARNESS_PROVIDER="$(map_harness_provider "$HARNESS" "$PROVIDER")"
HARNESS_MODEL_ID="$(map_harness_model "$HARNESS" "$HARNESS_PROVIDER" "$MODEL")"

# Format as provider/model if needed
if [[ "$HARNESS_MODEL_ID" == "$HARNESS_PROVIDER/"* ]]; then
  HARNESS_MODEL="$HARNESS_MODEL_ID"
else
  HARNESS_MODEL="${HARNESS_PROVIDER}/${HARNESS_MODEL_ID}"
fi

RENDERED_PROMPT="$(mktemp "${TMPDIR:-/tmp}/benchmark-ai-prompt.XXXXXX")"
SESSION_EXPORT_FILE="$(mktemp "${TMPDIR:-/tmp}/benchmark-ai-session.XXXXXX")"
cleanup_temp_files() {
  rm -f "$RENDERED_PROMPT" "$SESSION_EXPORT_FILE"
}
trap cleanup_temp_files EXIT
node - "$TEMPLATE_FILE" "$SPEC_FILE" "$BACKEND_CARTRIDGE" "$FRONTEND_CARTRIDGE" "$LEVEL" "$BACKEND" "$FRONTEND" "$RENDERED_PROMPT" <<'NODE'
const fs = require("fs");
const [
  templateFile,
  specFile,
  backendCartridgeFile,
  frontendCartridgeFile,
  level,
  backend,
  frontend,
  outputFile
] = process.argv.slice(2);

let rendered = fs.readFileSync(templateFile, "utf8");
const replacements = {
  "{{LEVEL}}": level,
  "{{BACKEND}}": backend,
  "{{FRONTEND}}": frontend,
  "{{SPEC_CONTENT}}": fs.readFileSync(specFile, "utf8"),
  "{{BACKEND_CARTRIDGE}}": fs.readFileSync(backendCartridgeFile, "utf8"),
  "{{FRONTEND_CARTRIDGE}}": fs.readFileSync(frontendCartridgeFile, "utf8")
};

for (const [token, value] of Object.entries(replacements)) {
  rendered = rendered.split(token).join(value);
}

fs.writeFileSync(outputFile, rendered);
NODE

GEN_PROMPT="Generate the complete full-stack project described in the attached rendered specification file. Write all files directly into the current working directory and then stop."

# Harness abstraction: Build command based on harness type
build_gen_cmd() {
  case "$HARNESS" in
    opencode)
      GEN_CMD=("$HARNESS_CLI" run --model "$HARNESS_MODEL" --file "$RENDERED_PROMPT" --dir "$OUTPUT_DIR" --title "benchmark ${MODEL} ${BACKEND}-${FRONTEND} ${LEVEL}")
      if [ "$AUTO_APPROVE" == "true" ]; then
        GEN_CMD+=(--dangerously-skip-permissions)
      fi
      if [ ! -z "$SESSION_ID" ]; then
        GEN_CMD+=(--session "$SESSION_ID")
      fi
      GEN_CMD+=("$GEN_PROMPT")
      ;;
    pi)
      GEN_CMD=("$HARNESS_CLI" --provider "$HARNESS_PROVIDER" --model "$HARNESS_MODEL_ID" --no-context-files -p "@$RENDERED_PROMPT")
      ;;
    *)
      echo -e "${RED}❌ ERROR: Unknown harness: $HARNESS${NC}"
      exit 1
      ;;
  esac
}

# Harness abstraction: Capture session ID based on harness type
capture_latest_session_id() {
  local latest_session=""

  case "$HARNESS" in
    opencode)
      latest_session="$(opencode session list --format json --max-count 1 2>/dev/null | node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input || "[]");
    const first = Array.isArray(data) ? data[0] : data;
    const id = first && (first.id || first.sessionID || first.sessionId);
    if (id) process.stdout.write(String(id));
  } catch {}
});
' 2>/dev/null || true)"
      ;;
    pi)
      # PI might have different session tracking; implement as needed
      # For now, sessions are tracked internally by PI
      return 0
      ;;
    *)
      return 0
      ;;
  esac

  if [ ! -z "$latest_session" ]; then
    SESSION_ID="$latest_session"
    mkdir -p "$(dirname "$SESSION_FILE")"
    printf '%s\n' "$SESSION_ID" > "$SESSION_FILE"
  fi
}

# Harness abstraction: Export session data based on harness type
capture_latest_session_export() {
  if [ -z "$SESSION_ID" ]; then
    : > "$SESSION_EXPORT_FILE"
    return 0
  fi

  case "$HARNESS" in
    opencode)
      if opencode export "$SESSION_ID" > "$SESSION_EXPORT_FILE" 2>/dev/null; then
        return 0
      fi
      ;;
    pi)
      # PI exports might work differently; implement as needed
      : > "$SESSION_EXPORT_FILE"
      return 0
      ;;
  esac

  : > "$SESSION_EXPORT_FILE"
}

initialize_session_record() {
  mkdir -p "$(dirname "$SESSION_RECORD_FILE")"
  cat > "$SESSION_RECORD_FILE" <<JSON
{
  "metadata": {
    "model": "$MODEL",
    "provider": "$PROVIDER",
    "harness": "$HARNESS",
    "harness_model": "$HARNESS_MODEL",
    "harness_provider": "$HARNESS_PROVIDER",
    "level": "$LEVEL",
    "backend": "$BACKEND",
    "frontend": "$FRONTEND",
    "output_dir": "$OUTPUT_DIR",
    "spec_file": "$SPEC_FILE",
    "template_file": "$TEMPLATE_FILE",
    "backend_cartridge": "$BACKEND_CARTRIDGE",
    "frontend_cartridge": "$FRONTEND_CARTRIDGE",
    "timeout_seconds": $TIMEOUT,
    "retries": $RETRIES,
    "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "latest_session_id": null,
  "latest_attempt": null,
  "attempts": []
}
JSON
}

append_session_record() {
  local attempt="$1"
  local status="$2"
  local started_at="$3"
  local ended_at="$4"
  local elapsed_seconds="$5"
  local requested_session_id="$6"

  node - "$SESSION_RECORD_FILE" "$SESSION_EXPORT_FILE" "$MODEL" "$PROVIDER" "$HARNESS" "$LEVEL" "$BACKEND" "$FRONTEND" "$OUTPUT_DIR" "$HARNESS_MODEL" "$attempt" "$status" "$started_at" "$ended_at" "$elapsed_seconds" "$requested_session_id" "$SESSION_ID" <<'NODE'
const fs = require("fs");
const [
  recordFile,
  exportFile,
  model,
  provider,
  harness,
  level,
  backend,
  frontend,
  outputDir,
  harnessModel,
  attempt,
  status,
  startedAt,
  endedAt,
  elapsedSeconds,
  requestedSessionId,
  latestSessionId
] = process.argv.slice(2);

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const record = parseJson(fs.readFileSync(recordFile, "utf8")) || {
  metadata: {},
  latest_session_id: null,
  latest_attempt: null,
  attempts: []
};

const exportJson = fs.existsSync(exportFile) ? parseJson(fs.readFileSync(exportFile, "utf8")) : null;
const info = exportJson?.info || {};
const tokens = info.tokens || {};
const modelInfo = info.model || {};
const summary = info.summary || {};
const tokenTotal = typeof tokens.total === "number"
  ? tokens.total
  : [tokens.input, tokens.output, tokens.reasoning]
      .filter((value) => typeof value === "number")
      .reduce((sum, value) => sum + value, 0);

const attemptRecord = {
  attempt: Number(attempt),
  status,
  requested_session_id: requestedSessionId || null,
  latest_session_id: latestSessionId || null,
  started_at: startedAt,
  ended_at: endedAt,
  elapsed_seconds: Number(elapsedSeconds) || null,
  title: info.title || null,
  directory: info.directory || outputDir,
  model: modelInfo.id || harnessModel,
  provider: modelInfo.providerID || null,
  version: info.version || null,
  cost_usd: typeof info.cost === "number" ? info.cost : null,
  tokens: {
    input: typeof tokens.input === "number" ? tokens.input : null,
    output: typeof tokens.output === "number" ? tokens.output : null,
    reasoning: typeof tokens.reasoning === "number" ? tokens.reasoning : null,
    cache_read: typeof tokens.cache?.read === "number" ? tokens.cache.read : null,
    cache_write: typeof tokens.cache?.write === "number" ? tokens.cache.write : null,
    total: Number.isFinite(tokenTotal) ? tokenTotal : null
  },
  summary: {
    additions: typeof summary.additions === "number" ? summary.additions : null,
    deletions: typeof summary.deletions === "number" ? summary.deletions : null,
    files: typeof summary.files === "number" ? summary.files : null
  },
  created_at: info.time?.created || null,
  updated_at: info.time?.updated || null,
  export_available: Boolean(exportJson)
};

record.metadata = {
  ...record.metadata,
  model,
  provider,
  harness,
  level,
  backend,
  frontend,
  output_dir: outputDir,
  harness_model: harnessModel
};
record.latest_session_id = latestSessionId || null;
record.latest_attempt = attemptRecord;
record.attempts = Array.isArray(record.attempts) ? record.attempts : [];
record.attempts.push(attemptRecord);

fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));
NODE
}

run_generation_attempt() {
  "${GEN_CMD[@]}" &
  local cmd_pid=$!
  local elapsed=0

  while kill -0 "$cmd_pid" 2>/dev/null; do
    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo -e "${RED}Generation attempt timed out after ${TIMEOUT}s${NC}"
      kill "$cmd_pid" 2>/dev/null || true
      wait "$cmd_pid" 2>/dev/null || true
      return 124
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  wait "$cmd_pid"
}

build_gen_cmd

# Execute generation
if [ "$DRY_RUN" == "true" ]; then
  echo -e "${YELLOW}DRY RUN MODE: Would execute:${NC}"
  printf '%q ' "${GEN_CMD[@]}"
  echo ""
  echo ""
  echo -e "${YELLOW}(No API calls made)${NC}"
else
  # Keep one active project per selected output directory. Clear all files for fresh generation.
  mkdir -p "$OUTPUT_DIR"
  find "$OUTPUT_DIR" -mindepth 1 -exec rm -rf {} +
  initialize_session_record
  SESSION_ID=""

  echo -e "${BLUE}Harness: ${YELLOW}${HARNESS}${NC}"
  echo -e "${BLUE}Provider: ${YELLOW}${PROVIDER}${NC}"
  echo -e "${BLUE}Harness Model: ${YELLOW}${HARNESS_MODEL}${NC}"
  echo -e "${BLUE}Executing generation...${NC}"
  echo ""

  ATTEMPT=1
  GENERATION_OK="false"
  while [ "$ATTEMPT" -le "$RETRIES" ]; do
    ATTEMPT_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    ATTEMPT_STARTED_TS="$(date +%s)"
    REQUESTED_SESSION_ID="$SESSION_ID"
    build_gen_cmd
    echo -e "${BLUE}Attempt ${ATTEMPT}/${RETRIES}${NC}"
    if [ ! -z "$SESSION_ID" ]; then
      echo -e "${BLUE}Resuming ${HARNESS} session: ${YELLOW}${SESSION_ID}${NC}"
    fi

    if run_generation_attempt; then
      GENERATION_OK="true"
      capture_latest_session_id
      capture_latest_session_export
      ATTEMPT_ENDED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      ATTEMPT_ENDED_TS="$(date +%s)"
      ATTEMPT_ELAPSED=$((ATTEMPT_ENDED_TS - ATTEMPT_STARTED_TS))
      append_session_record "$ATTEMPT" "success" "$ATTEMPT_STARTED_AT" "$ATTEMPT_ENDED_AT" "$ATTEMPT_ELAPSED" "$REQUESTED_SESSION_ID"
      break
    fi

    capture_latest_session_id
    capture_latest_session_export
    ATTEMPT_ENDED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    ATTEMPT_ENDED_TS="$(date +%s)"
    ATTEMPT_ELAPSED=$((ATTEMPT_ENDED_TS - ATTEMPT_STARTED_TS))
    append_session_record "$ATTEMPT" "failed" "$ATTEMPT_STARTED_AT" "$ATTEMPT_ENDED_AT" "$ATTEMPT_ELAPSED" "$REQUESTED_SESSION_ID"
    if [ "$ATTEMPT" -lt "$RETRIES" ]; then
      echo -e "${YELLOW}Generation attempt failed; retrying...${NC}"
    fi
    ATTEMPT=$((ATTEMPT + 1))
  done

  if [ "$GENERATION_OK" == "true" ]; then
    # Calculate elapsed time
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    ELAPSED_MIN=$((ELAPSED / 60))
    ELAPSED_SEC=$((ELAPSED % 60))

    echo ""
    echo -e "${GREEN}✅ Generation successful${NC}"
    echo -e "${GREEN}   Provider: ${PROVIDER}${NC}"
    echo -e "${GREEN}   Model: ${MODEL}${NC}"
    echo -e "${GREEN}   Time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s${NC}"
    echo -e "${GREEN}   Output: ${OUTPUT_DIR}${NC}"
    echo ""

    # Verify output exists
    if [ -d "$OUTPUT_DIR" ] && [ "$(ls -A "$OUTPUT_DIR")" ]; then
      echo -e "${GREEN}✅ Generated files verified${NC}"
      ls -lah "$OUTPUT_DIR" | head -15
    else
      echo -e "${YELLOW}⚠️  Warning: Output directory appears empty${NC}"
    fi
  else
    echo ""
    echo -e "${RED}❌ Generation failed${NC}"
    echo -e "${RED}   Provider: ${PROVIDER}${NC}"
    echo -e "${RED}   Model: ${MODEL}${NC}"
    echo -e "${RED}   Attempts: ${RETRIES}${NC}"
    [ ! -z "$SESSION_ID" ] && echo -e "${RED}   Last Session: ${SESSION_ID}${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
