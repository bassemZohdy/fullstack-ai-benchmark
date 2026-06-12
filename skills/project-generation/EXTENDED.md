# Project Generation - Extended Documentation

**This document supplements `SKILL.md` with session protocol, timeout, and retry details.**

> Harness-specific details (CLI invocation, provider/model mapping, session capture) have moved
> to the per-harness skills. See `skills/harness-opencode/SKILL.md`, `skills/harness-pi/SKILL.md`,
> and the other `skills/harness-*/SKILL.md` files.

## Table of Contents
1. Session Management Protocol
2. Timeout & Activity Monitoring
3. Retry Logic
4. Complete Working Examples
5. Troubleshooting Guide

---

## 1. Session Management Protocol

Sessions allow resuming interrupted generation attempts without regenerating from scratch.

### Session Lifecycle

```
┌─ First Run
│  ├─ No session file exists
│  ├─ SESSION_ID is empty
│  ├─ Generate project (new session created by harness)
│  └─ Capture session ID after completion
│
├─ Resume Existing Session
│  ├─ Session file exists: .opencode-session-id or .pi-session-id
│  ├─ Load SESSION_ID from file
│  ├─ Pass --session SESSION_ID to harness
│  ├─ Harness resumes from previous state
│  └─ Update session tracking on completion
│
└─ Session Tracking
   ├─ .opencode-session-id (single line with session ID)
   ├─ .opencode-session (JSON with full metadata)
   └─ Both preserved across generations
```

### Session Files

**`.opencode-session-id`** (or `.pi-session-id`)
- Format: Single line containing session ID
- Purpose: Minimal resume token
- Example: `ses_1453440baffe1MUkLhrVu1LI69`

**`.opencode-session`** (or `.pi-session`)
- Format: JSON with complete generation metadata
- Purpose: Audit trail and cost tracking
- Example structure:
```json
{
  "metadata": {
    "model": "GLM-5.1Z.AI",
    "provider": "z-ai",
    "harness": "opencode",
    "level": "overview",
    "backend": "spring-boot",
    "frontend": "angular",
    "timeout_seconds": 600,
    "started_at": "2026-06-12T10:30:00Z"
  },
  "latest_session_id": "ses_1453440baffe1MUkLhrVu1LI69",
  "attempts": [
    {
      "attempt": 1,
      "status": "success",
      "requested_session_id": null,
      "latest_session_id": "ses_1453440baffe1MUkLhrVu1LI69",
      "started_at": "2026-06-12T10:30:00Z",
      "ended_at": "2026-06-12T10:41:15Z",
      "elapsed_seconds": 675,
      "cost_usd": 2.35,
      "tokens": {
        "input": 15000,
        "output": 25000,
        "total": 40000
      },
      "summary": {
        "files": 64,
        "additions": 12500,
        "deletions": 0
      }
    }
  ]
}
```

### Loading & Resuming Sessions

```bash
# Load existing session ID from file
if [ -z "$SESSION_ID" ] && [ -f "$SESSION_FILE" ]; then
  SESSION_ID="$(head -n 1 "$SESSION_FILE" | tr -d '[:space:]')"
fi

# Pass to harness
if [ ! -z "$SESSION_ID" ]; then
  GEN_CMD+=(--session "$SESSION_ID")
fi

# After generation, capture latest session
opencode session list --format json --max-count 1 \
  | node -e 'parse and extract session ID'
printf '%s\n' "$SESSION_ID" > "$SESSION_FILE"
```

### Session Export

The harness exports detailed session data:
```bash
# OpenCode exports full session data
opencode export "$SESSION_ID" > .opencode-session

# This JSON contains token counts, cost, timings, etc.
# Used by the benchmark for audit trail
```

### Session Best Practices

1. **Always preserve session files** when resuming
2. **Use `--session-id`** parameter if you want to explicitly resume
3. **Check `.opencode-session-id`** to find the latest session for inspection
4. **Review `.opencode-session` JSON** for costs and token usage
5. **Don't manually edit session files** - let the harness manage them

---

## 2. Timeout & Activity Monitoring

The script monitors generation progress using **activity-based detection** rather than simple wall-clock timing.

### Why Activity-Based Monitoring?

- **Problem**: Generation can pause during compilation, waiting for dependencies, etc. (30+ seconds is normal)
- **Solution**: Monitor for *file creation* rather than elapsed time
- **Benefit**: Detects actual stalls (no progress) while allowing legitimate pauses

### Monitoring Architecture

```
┌─ monitor_process_with_activity()
│  ├─ Count files in output directory (every 1 second)
│  ├─ Track file count changes
│  ├─ If file count increases:
│  │  └─ Reset inactivity_elapsed = 0 (activity detected)
│  ├─ If file count static:
│  │  └─ Increment inactivity_elapsed
│  ├─ If inactivity_elapsed >= 90 seconds:
│  │  └─ TERMINATE (process stalled)
│  ├─ If elapsed_total >= max_timeout (e.g., 300s):
│  │  └─ TERMINATE (hard limit exceeded)
│  └─ Continue checking while process alive
```

### Timeout Parameters

| Parameter | Default | Purpose | When to Adjust |
|-----------|---------|---------|-----------------|
| `--timeout <seconds>` | 600 | Hard time limit | Set per harness/level |
| `inactivity_threshold` | 90 | Seconds with no file changes | Rarely needed |

### Recommended Timeouts

| Scenario | Timeout | Rationale |
|----------|---------|-----------|
| OpenCode + overview | 300s | ~10-11 min generation |
| OpenCode + detailed | 450s | ~16-17 min generation |
| PI + overview | 300s | ~4-5 min generation |
| PI + detailed | 300s | ~6-7 min generation |

### Example: Monitor a Generation

```bash
# The script automatically monitors with these settings:
# - Max timeout: 600 seconds (10 minutes)
# - Inactivity threshold: 90 seconds

./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --timeout 600

# Output shows activity detection:
# Activity detected (15 files)
# Activity detected (32 files)
# Activity detected (45 files)
# ✅ Generation successful
```

### Handling Timeout Issues

**Problem**: "No file activity for 90s - terminating"

**Causes**:
1. Harness process killed (check stderr)
2. Network/API issue
3. Actually stalled (legitimate issue)

**Solutions**:
1. Increase `--timeout` if you see activity earlier in the log
2. Check harness stdout/stderr for errors
3. Increase `inactivity_threshold` if legitimate pauses are normal (not recommended)

---

## 3. Retry Logic

The script automatically retries failed generations up to `--retries` times (default: 3).

### Retry Behavior

```
Attempt 1
├─ If SUCCESS: Complete, exit 0
└─ If FAILED: Record attempt, continue

Attempt 2
├─ If resuming: Uses existing session_id from attempt 1
├─ If SUCCESS: Complete, exit 0
└─ If FAILED: Record attempt, continue

Attempt 3
├─ If resuming: Uses existing session_id from attempt 2
├─ If SUCCESS: Complete, exit 0
└─ If FAILED: All retries exhausted, exit 1
```

### Retry Records

Each attempt is recorded in `.opencode-session`:
```json
"attempts": [
  {
    "attempt": 1,
    "status": "failed",
    "requested_session_id": null,
    "latest_session_id": "ses_123...",
    "elapsed_seconds": 600,
    "error": "timeout"
  },
  {
    "attempt": 2,
    "status": "success",
    "requested_session_id": "ses_123...",
    "latest_session_id": "ses_123...",
    "elapsed_seconds": 450
  }
]
```

### Controlling Retries

```bash
# Default: 3 retries
./scripts/generate-project.sh --model ... --retries 3

# Single attempt only
./scripts/generate-project.sh --model ... --retries 1

# More aggressive (5 retries)
./scripts/generate-project.sh --model ... --retries 5
```

---

## 4. Complete Working Examples

### Example 1: Simple Generation with Z.ai

```bash
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --provider z-ai \
  --harness opencode

# Output structure created:
# WORKSPACE/
#   opencode-glm-5.1/
#     overview/
#       backend/
#       frontend/
#       .opencode-session-id
#       .opencode-session
#       ...generated files...
```

### Example 2: Resume Interrupted Generation

```bash
# First attempt interrupted
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular

# Check session file
cat WORKSPACE/opencode-glm-5.1/overview/.opencode-session-id
# Output: ses_1453440baffe1MUkLhrVu1LI69

# Resume same generation
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --session-id ses_1453440baffe1MUkLhrVu1LI69

# Script automatically finds and resumes the session
```

### Example 3: Multi-Harness Benchmark

```bash
# Test with OpenCode
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness opencode

# Test with PI (same model)
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness pi

# Each creates separate output:
# WORKSPACE/opencode-glm-5.1/overview/  (OpenCode)
# WORKSPACE/pi-glm-5.1/overview/        (PI)
```

### Example 4: OpenRouter Model Testing

```bash
# Requires: export OPENROUTER_API_KEY=your_key

./scripts/generate-project.sh \
  --model kimi/2.6 \
  --level overview \
  --backend spring-boot \
  --frontend react \
  --provider openrouter \
  --harness opencode

# Model mapping happens automatically:
# - kimi/2.6 -> moonshotai/kimi-k2.6 (OpenRouter format)
# - Output dir: WORKSPACE/opencode-kimi-2.6/overview/
```

### Example 5: Long Generation with Custom Timeout

```bash
# Detailed spec takes longer
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level detailed \
  --backend spring-boot \
  --frontend angular \
  --timeout 900  # 15 minutes for detailed spec

# Will monitor for:
# - Hard timeout: 900 seconds
# - Inactivity timeout: 90 seconds (no file changes)
# - Activity logs every 1-2 minutes
```

---

## 5. Troubleshooting Guide

### Issue: "CLI not found for harness"

**Cause**: Harness CLI not installed or not in PATH

**Solutions**:
```bash
# OpenCode: Install via pip
pip install opencode

# PI: Set environment variable
export BENCHMARK_PI_CLI="/path/to/pi/cli"
export PI_CLI="/path/to/pi/cli"
```

### Issue: "No file activity for 90s - terminating"

**Cause**: Generation appears stuck (no new files created)

**Solutions**:
1. Check harness stderr for errors
2. Verify output directory exists and is writable
3. Increase `--timeout` if legitimate activity detected earlier
4. Check network/API connectivity

### Issue: "OPENROUTER_API_KEY not set"

**Cause**: Using OpenRouter provider without credentials

**Solution**:
```bash
export OPENROUTER_API_KEY="your_api_key"
./scripts/generate-project.sh --model kimi/2.6 --provider openrouter ...
```

### Issue: Session file not found after generation

**Cause**: Generation failed completely

**Solutions**:
1. Check exit code: `echo $?`
2. Review generated output directory for errors
3. Check harness session list: `opencode session list`
4. Try again with `--retries 3` (default)

### Issue: Output directory exists but appears empty

**Cause**: Generation process incomplete or failed silently

**Solutions**:
1. Check `.opencode-session` file for status
2. Verify you have write permissions in output directory
3. Try cleanup and regenerate: `rm -rf WORKSPACE/opencode-...`
4. Check harness logs/stderr output

---

## Dependencies & Prerequisites

- Bash 4.0+ (array support)
- Node.js (for prompt rendering and session record management)
- Harness CLI:
  - OpenCode: `pip install opencode`
  - PI: Available in PATH or via `$BENCHMARK_PI_CLI`
- API credentials:
  - Z.ai: No explicit key needed (built into harness)
  - OpenRouter: `$OPENROUTER_API_KEY`

## References

- Main script: `scripts/generate-project.sh`
- Support library: `scripts/benchmark-support.sh`
- Harness abstraction functions: see `skills/harness-opencode/SKILL.md` and `skills/harness-pi/SKILL.md`
- Session management: `capture_latest_session_id()`, `capture_latest_session_export()`
- Monitoring: `monitor_process_with_activity()` (line 703)
