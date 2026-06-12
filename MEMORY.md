# Project Memory - Full-Stack AI Benchmark

## Architecture Decisions

### Prompt Templating Separation (2026-06-07)
- Separated prompt building from project generation into `render-prompt.sh`
- Clean separation of concerns: templating independent of harness orchestration
- Benefits: testable independently, reusable by other tools
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Subprocess Control Implementation (2026-06-07)
- Added signal handlers for EXIT, INT, TERM to prevent orphaned processes
- Global PID tracking (`ACTIVE_GEN_PID`) for subprocess management
- Activity monitoring with 90s inactivity threshold (optimal after testing)
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Timeout Tuning (2026-06-07)
- Default timeout increased from 120s → 300s for full-stack projects
- Inactivity threshold: 30s was too aggressive → 90s is optimal
- Use `--timeout 300` for overview, `--timeout 450` for detailed spec level
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Documentation Consolidation (2026-06-08)
- Moved redundant root-level documentation into `docs/` structure
- Root level keeps only: README.md, CLAUDE.md, AGENTS.md, HANDOFF.md
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

## Discovered Durable Knowledge

### Performance Baselines
| Tool | Overview | Detailed | Notes |
|------|----------|----------|-------|
| OpenCode | ~11 min | ~16-17 min | Thorough, optimized code |
| PI | ~4 min | ~6-7 min | Fast, production-ready |

**Source**: ses_1453440baffe1MUkLhrVu1LI69

### Evaluation System Architecture
- Static analysis: 70% weight when both available
- E2E testing: 30% weight when both available
- Supported stacks: Spring Boot + Angular/React, Node.js + Angular/React
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Subprocess Control Pattern
- Global PID tracking prevents orphaned processes
- Signal handlers (EXIT, INT, TERM) ensure cleanup on interruption
- Activity monitoring detects file creation in output directory
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

## Patterns

### Context Window Management
- Sessions frequently ran out of context requiring handoff documents
- HANDOFF.md preserves state across sessions
- **Source**: ses_1453441cbffenXF1U4GTiSdnTz, ses_1453440baffe1MUkLhrVu1LI69

### Timeout Adjustment Pattern
- Both OpenCode and PI required timeout adjustments after real-world testing
- Initial 120s was insufficient for full-stack generation
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

## Gotchas

### OpenCode vs PI Timeout Requirements
- OpenCode requires ~11 min vs PI's ~4 min for full-stack generation
- Always use appropriate timeout based on harness selection
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Inactivity Threshold Sensitivity
- 30s inactivity threshold causes false timeouts
- 90s threshold is optimal for detecting actual stalls vs normal pauses
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

### Orphaned Process Risk
- Without signal handlers, background harness processes become orphaned
- Always implement EXIT/INT/TERM traps for subprocess management
- **Source**: ses_1453440baffe1MUkLhrVu1LI69

## Rules

### Project Structure
- Root workspace: shell-only orchestration, no root `package.json`
- Generated projects in `WORKSPACE/opencode-<model-slug>/<level>/`
- Evaluation results in `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`
- **Source**: CLAUDE.md, AGENTS.md

### Documentation Standards
- Keep documentation aligned with actual scripts and evaluator
- Use `TBD` instead of invented benchmark scores
- Do not keep session-history notes in repo-facing docs
- **Source**: CLAUDE.md

### Model Directory Naming
- Use normalized OpenCode-prefixed slugs
- Example: `GLM-5.1Z.AI` → `opencode-glm-5.1`, `kimi/2.6` → `opencode-kimi-2.6`
- **Source**: AGENTS.md

## Session History Summary

### Recent Sessions (2026-06-07 to 2026-06-12)
1. **ses_1453441fbffee1qOectiEQGw0g** (2026-06-07): Project setup review, identified issues
2. **ses_1453441cbffenXF1U4GTiSdnTz** (2026-06-07): Continued from HANDOFF, context management
3. **ses_1453440dbffejNwKOnRGcMjWhl** (2026-06-07): HANDOFF analysis, task identification
4. **ses_1453440baffe1MUkLhrVu1LI69** (2026-06-07-08): Major session - subprocess control, timeout tuning, documentation consolidation
5. **ses_145274c8cffeiRIm3FlZY294ND** (2026-06-12): Skills and plugins cleanup
6. **ses_145274c67ffe0SM4sPToj2vr3m** (2026-06-12): Current auto-dream session

## Current Status

**Date**: 2026-06-12  
**Status**: Production-ready, all infrastructure validated  
**Key Commits**: 
- `14f3c08` - Robust subprocess control and activity-based monitoring
- `682c180` - Separate prompt templating from project generation
- `650b8ea` - Comprehensive E2E testing suite
- `f640f2a` - Integrate E2E test results into evaluation metrics
