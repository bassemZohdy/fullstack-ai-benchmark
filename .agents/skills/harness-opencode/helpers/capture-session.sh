#!/usr/bin/env bash
# Capture the most recent OpenCode session ID and write it to SESSION_FILE.
#
# Usage:
#   capture-session.sh <session-file-path>
#
# Calls `opencode session list --format json --max-count 1`, extracts the
# first session ID, and writes it to <session-file-path>.
# Exits 0 on success, 1 if no session ID found or opencode unavailable.

set -euo pipefail

SESSION_FILE="${1:-}"

if [[ -z "$SESSION_FILE" ]]; then
  echo "Usage: capture-session.sh <session-file-path>" >&2
  exit 1
fi

SESSION_ID="$(opencode session list --format json --max-count 1 2>/dev/null | node -e '
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

if [[ -z "$SESSION_ID" ]]; then
  exit 1
fi

mkdir -p "$(dirname "$SESSION_FILE")"
printf '%s\n' "$SESSION_ID" > "$SESSION_FILE"
