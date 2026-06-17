---
name: environment-setup
description: Validate and set up the benchmark environment, checking prerequisites, dependencies, and configuration files. Use before running benchmarks to ensure all tools and files are in place.
---

# Environment Setup & Validation

## Overview

Use this skill to validate that your system has all required tools, dependencies, and configuration files before running benchmarks. The `test-setup.sh` script performs comprehensive validation and provides clear guidance for fixing issues.

## When to Use

- **Before first benchmark run**: Validate complete environment
- **After installing new tools**: Verify integration with benchmark
- **Troubleshooting benchmark failures**: Check environment as first step
- **On new system**: Complete validation
- **After upgrading tools**: Ensure compatibility

## Command Reference

```bash
./scripts/test-setup.sh [--quiet] [--verbose]
```

### Parameters

| Parameter | Purpose | Notes |
|-----------|---------|-------|
| (none) | Standard validation | Shows errors and required actions |
| `--quiet` | Minimal output | Only shows critical errors |
| `--verbose` | Detailed output | Shows all checks and status |

## What Gets Validated

### 1. Core Tools

| Tool | Required | Purpose | Install |
|------|----------|---------|---------|
| Bash | Yes | Script execution | System package |
| Node.js | Yes | Evaluator and templating | `npm install -g node` |
| Docker | Yes | E2E testing | docker.com |
| Docker Compose | Yes | Service orchestration | docker.com |
| Git | Optional | Version control | System package |

**Example output**:
```
✓ bash 5.1+ available
✓ node 18.0+ available
✓ docker 24.0+ available
✓ docker-compose 2.0+ available
```

### 2. Generation Harnesses

At least ONE harness is required:

| Harness | Required | Purpose | Install |
|---------|----------|---------|---------|
| OpenCode | Recommended | Main generation tool | `pip install opencode` |
| PI | Optional | Alternative harness | Set `$BENCHMARK_PI_CLI` |

**Example output**:
```
✓ opencode CLI found at: /usr/local/bin/opencode
  (PI CLI not configured - set $BENCHMARK_PI_CLI to use)
```

### 3. Specification Files

Required prompt sources:

| File | Purpose | Status |
|------|---------|--------|
| `PROMPTS/templates/project-generation.md` | Generation template | Must exist |
| `PROMPTS/overview.md` | Overview spec | Must exist |
| `PROMPTS/detailed.md` | Detailed spec | Must exist |
| `PROMPTS/cartridges/backend/*.md` | Backend configs | Must exist |
| `PROMPTS/cartridges/frontend/*.md` | Frontend configs | Must exist |

**Example output**:
```
✓ Template: PROMPTS/templates/project-generation.md
✓ Specs: overview.md, detailed.md
✓ Backend cartridges: spring-boot.md, node-js.md, quarkus.md
✓ Frontend cartridges: angular.md, react.md
```

### 4. Evaluation Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `EVAL/comprehensive-evaluator.js` | Static analysis | Must exist |
| `E2E_TESTS/e2e-runner.js` | Runtime testing | Must exist |
| `E2E_TESTS/helpers/*.js` | Test helpers | Must exist |

**Example output**:
```
✓ Static evaluator: EVAL/comprehensive-evaluator.js
✓ E2E runner: E2E_TESTS/e2e-runner.js
✓ E2E helpers: 4 found (build-validator, api-tester, ...)
```

### 5. Directory Structure

| Directory | Purpose | Writable | Status |
|-----------|---------|----------|--------|
| `WORKSPACE/` | Generated projects | Yes | Must exist |
| `RESULTS/` | Evaluation outputs | Yes | Must exist |
| `scripts/` | Benchmark scripts | No | Must exist |
| `EVAL/` | Evaluator code | No | Must exist |
| `E2E_TESTS/` | Test harness | No | Must exist |

**Example output**:
```
✓ WORKSPACE/ exists and writable
✓ RESULTS/ exists and writable
✓ scripts/, EVAL/, E2E_TESTS/ exist
```

### 6. Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| `docker-compose.yml` | Service orchestration | For E2E |
| `.opencode-session-id` | Session tracking | Generated |
| `.opencode-session` | Session metadata | Generated |

### 7. API Credentials

| Credential | Required | For | Usage |
|-----------|----------|-----|-------|
| `$OPENROUTER_API_KEY` | If using OpenRouter | `--provider openrouter` | Set before generation |
| Z.ai credentials | No explicit key needed | `--provider z-ai` | Built into OpenCode |

**Example output**:
```
⚠ OPENROUTER_API_KEY not set
  (Only required if using --provider openrouter)
```

## Complete Validation Workflow

```bash
# 1. Run full validation
./scripts/test-setup.sh

# 2. Review output for any ✗ (errors)
# 3. Follow suggested fixes
# 4. Re-run to confirm all checks pass
./scripts/test-setup.sh

# 5. Once all pass, ready for benchmarking
./scripts/run-benchmark.sh --model GLM-5.1Z.AI ...
```

## Example Outputs

### Example 1: Complete Passing System

```bash
$ ./scripts/test-setup.sh

════════════════════════════════════════════════════════════════
Benchmark Environment Validation
════════════════════════════════════════════════════════════════

[TOOLS]
✓ bash 5.1.16+ found
✓ node 20.10.0+ found
✓ docker 24.0.7+ found
✓ docker-compose 2.25.0+ found

[HARNESSES]
✓ opencode CLI found at /usr/local/bin/opencode
  PI CLI not configured (optional: set $BENCHMARK_PI_CLI)

[SPECS & TEMPLATES]
✓ PROMPTS/templates/project-generation.md (8.5 KB)
✓ PROMPTS/overview.md (12.3 KB)
✓ PROMPTS/detailed.md (18.7 KB)
✓ Backend cartridges: spring-boot, node-js, quarkus
✓ Frontend cartridges: angular, react

[EVALUATOR COMPONENTS]
✓ EVAL/comprehensive-evaluator.js (15.2 KB)
✓ E2E_TESTS/e2e-runner.js (8.9 KB)
✓ E2E_TESTS/helpers/ (4 files): build-validator, api-tester, frontend-tester, docker-runner

[DIRECTORIES]
✓ WORKSPACE/ exists and writable
✓ RESULTS/ exists and writable
✓ scripts/ exists
✓ EVAL/ exists
✓ E2E_TESTS/ exists

[CONFIGURATION]
✓ docker-compose.yml found in project root
  Note: Ensure it's generated project-specific before E2E runs

[API CREDENTIALS]
⚠ OPENROUTER_API_KEY not set
  (Only needed if using: --provider openrouter)

════════════════════════════════════════════════════════════════
✓ All required components available
✓ Ready for benchmark execution
════════════════════════════════════════════════════════════════
```

### Example 2: Missing OpenCode CLI

```bash
$ ./scripts/test-setup.sh

[TOOLS]
✓ bash 5.1.16+ found
✓ node 20.10.0+ found
✓ docker 24.0.7+ found
✓ docker-compose 2.25.0+ found

[HARNESSES]
✗ opencode CLI not found
  Install with: pip install opencode
  Then verify: opencode --version

✗ No harness available
  Must have at least one harness installed
  See: https://opencode.ai/docs

[ACTION REQUIRED]
Install OpenCode and verify:
  pip install opencode
  opencode --version
  ./scripts/test-setup.sh  (run again)
```

### Example 3: Missing Specification Files

```bash
$ ./scripts/test-setup.sh

[SPECS & TEMPLATES]
✗ PROMPTS/overview.md not found
✗ PROMPTS/cartridges/backend/spring-boot.md not found

[ACTION REQUIRED]
These files are required for generation:
  - Copy PROMPTS/overview.md from repository
  - Copy PROMPTS/cartridges/ directory structure
  - Ensure all cartridges are in place
  
Current PROMPTS structure:
  - templates/project-generation.md ✓
  - overview.md ✗
  - detailed.md ✓
  - cartridges/backend/: node-js.md ✓, quarkus.md ✓, spring-boot.md ✗
  - cartridges/frontend/: angular.md ✓, react.md ✓
```

### Example 4: No Writable WORKSPACE

```bash
$ ./scripts/test-setup.sh

[DIRECTORIES]
✓ WORKSPACE/ exists but NOT writable
  Current permissions: dr-xr-xr-x (read-only)

[ACTION REQUIRED]
Make WORKSPACE writable:
  chmod 755 WORKSPACE/
  # or if owned by another user:
  sudo chown $USER:$USER WORKSPACE/
  chmod 755 WORKSPACE/
```

## Fixing Common Issues

### Issue: OpenCode Not Installed

**Error**: "opencode CLI not found"

**Fix**:
```bash
# Install OpenCode
pip install opencode

# Verify installation
opencode --version

# Run validation again
./scripts/test-setup.sh
```

### Issue: Node.js Not Found

**Error**: "node not found"

**Fix**:
```bash
# Install Node.js (18.0+)
# macOS with Homebrew
brew install node

# Linux
sudo apt-get install nodejs npm

# Windows
# Download from https://nodejs.org/

# Verify
node --version

# Run validation again
./scripts/test-setup.sh
```

### Issue: Docker Not Running

**Error**: "docker: cannot connect to daemon"

**Fix**:
```bash
# Start Docker daemon
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Verify
docker ps

# Run validation again
./scripts/test-setup.sh
```

### Issue: Missing WORKSPACE Directory

**Error**: "WORKSPACE/ does not exist"

**Fix**:
```bash
# Create WORKSPACE
mkdir -p WORKSPACE
mkdir -p RESULTS

# Verify
./scripts/test-setup.sh
```

### Issue: Insufficient Disk Space

**Check**: Run `df -h` before benchmarking

**Storage needed**:
- Per full benchmark: ~2-5 GB (generated code + docker images)
- Multiple stacks: Add 2-5 GB per stack
- Recommended: 50+ GB free

**If low on space**:
```bash
# Clean old benchmarks
./scripts/cleanup-benchmark.sh --model old-model --level overview --backend spring-boot --frontend angular --scope all

# Remove docker images
docker image prune -a
```

## Prerequisite Installation Guides

### OpenCode Installation

```bash
# Python 3.8+ required
python3 --version

# Install OpenCode
pip install opencode
pip install --upgrade opencode

# Verify
opencode --version
opencode session list
```

**Documentation**: https://opencode.ai/docs

### Docker Installation

```bash
# macOS
brew install docker docker-compose

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Windows
# Download Docker Desktop from https://docker.com/products/docker-desktop

# Verify
docker --version
docker-compose --version

# Start daemon
sudo systemctl start docker
```

**Documentation**: https://docs.docker.com/install/

### Node.js Installation

```bash
# macOS
brew install node

# Linux
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# Download from https://nodejs.org/

# Verify
node --version
npm --version
```

**Documentation**: https://nodejs.org/

## Advanced Configuration

### Using PI Instead of OpenCode

```bash
# Set PI_CLI location
export BENCHMARK_PI_CLI="/path/to/pi/cli"

# Run validation
./scripts/test-setup.sh

# Use PI for generation
./scripts/generate-project.sh --harness pi --model GLM-5.1Z.AI ...
```

### Setting OpenRouter API Key

```bash
# For benchmark runs using OpenRouter
export OPENROUTER_API_KEY="your_api_key_here"

# Verify it's set
echo $OPENROUTER_API_KEY

# Run validation
./scripts/test-setup.sh

# Use OpenRouter provider
./scripts/generate-project.sh --provider openrouter --model kimi/2.6 ...
```

### Using Custom PROMPTS Directory

```bash
# Default location
PROMPTS/

# If using different location, update script:
# (or use symlink)
ln -s /custom/prompts PROMPTS

./scripts/test-setup.sh
```

## Validation Checklist

Before running your first benchmark:

- [ ] Bash 4.0+ installed
- [ ] Node.js 18.0+ installed
- [ ] Docker installed and running
- [ ] docker-compose installed
- [ ] OpenCode or PI installed
- [ ] PROMPTS/ directory complete
- [ ] EVAL/ scripts present
- [ ] E2E_TESTS/ scripts present
- [ ] WORKSPACE/ directory writable
- [ ] RESULTS/ directory writable
- [ ] `./scripts/test-setup.sh` passes all checks
- [ ] Can run: `./scripts/test-setup.sh --verbose`

## File Locations

- Script: `scripts/test-setup.sh`
- Support lib: `scripts/benchmark-support.sh`

## Dependencies

- Bash 4.0+ (arrays, parameter expansion)
- Standard Unix tools: `which`, `command`, `ls`, `test`

## Related Skills

- **repo-orientation**: Understanding repository structure
- **project-generation**: Generate projects after validation
- **environment-setup**: This skill - validate before starting

## Troubleshooting

### Issue: "test-setup.sh: not found"

**Cause**: Script is not executable

**Fix**:
```bash
chmod +x scripts/test-setup.sh
./scripts/test-setup.sh
```

### Issue: "Permission denied"

**Cause**: WORKSPACE or RESULTS not writable

**Fix**:
```bash
chmod 755 WORKSPACE RESULTS
./scripts/test-setup.sh
```

### Issue: Test-setup hangs

**Cause**: Docker daemon not responding

**Fix**:
```bash
# Restart Docker
docker restart

# Or kill and restart
docker system prune -a

# Re-run
./scripts/test-setup.sh
```

## Performance

| Check | Duration | Notes |
|-------|----------|-------|
| Tool discovery | <1 sec | Check PATH, versions |
| File validation | <1 sec | Check existence and syntax |
| Docker check | 2-5 sec | May start daemon |
| **Total** | **~10 sec** | Usually <15 seconds |

## Next Steps

After validation passes:

1. **Read docs**:
   - `docs/START.md` - Quick start guide
   - `docs/SCRIPTS.md` - Script reference

2. **Run first benchmark**:
   ```bash
   ./scripts/run-benchmark.sh \
     --model GLM-5.1Z.AI \
     --level overview \
     --backend spring-boot \
     --frontend angular
   ```

3. **Check results**:
   ```bash
   cat RESULTS/opencode-glm-5.1/spring-boot-angular/overview/evaluation-results.json | jq .
   ```
