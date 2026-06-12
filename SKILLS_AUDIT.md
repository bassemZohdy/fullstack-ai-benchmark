# Skills Audit & Enhancement Report

**Date**: 2026-06-12  
**Status**: Comprehensive skill review completed

## Executive Summary

The project has 6 skills covering core workflows. This audit verifies that each skill has equivalent coverage for its corresponding script feature, with complete details to ensure consistent outcomes across different agents.

## Scripts vs Skills Mapping

### ✅ ADEQUATE (with improvements needed)

| Script | Feature | Skill | Status | Gap |
|--------|---------|-------|--------|-----|
| `render-prompt.sh` | Prompt rendering & validation | `prompt-rendering` | OK | Missing validation details |
| `generate-project.sh` | Single project generation | `project-generation` | PARTIAL | Needs harness abstraction details |
| `generate-project.sh` | Session management & resume | `project-generation` | PARTIAL | Needs step-by-step session protocol |
| `generate-project.sh` | Timeout & activity monitoring | `project-generation` | MISSING | Not documented in skill |
| `generate-project.sh` | Retry logic & error handling | `project-generation` | MISSING | Not documented in skill |
| `run-benchmark.sh` | Full benchmark orchestration | `project-generation` + `evaluation-workflow` | PARTIAL | Needs coordination docs |
| `eval-generated-project.sh` | Static evaluation | `evaluation-workflow` | OK | Acceptable |
| `eval-complete.sh` | Complete pipeline | `evaluation-workflow` | PARTIAL | Missing specific workflow steps |
| `run-e2e-tests.sh` | Runtime E2E validation | `e2e-testing` | OUTDATED | **CRITICAL**: Claims "Spring Boot + Angular only" - WRONG |
| `cleanup-benchmark.sh` | Workspace cleanup | MISSING | NO SKILL | Critical gap |
| `test-setup.sh` | System validation | MISSING | NO SKILL | Gap |
| `test-regressions.sh` | Regression testing | MISSING | NO SKILL | Gap |
| Repository navigation | Routing & orientation | `repo-orientation` | OK | Acceptable |
| Documentation alignment | Docs/claims sync | `docs-maintenance` | OK | Acceptable |

## Critical Issues

### 🔴 CRITICAL: E2E Testing Skill Outdated

**File**: `skills/e2e-testing/SKILL.md`

**Current claim**:
```
- Supported runtime evaluation: Spring Boot + Angular
```

**Actual state** (from CLAUDE.md and code):
```
E2E testing: Spring Boot + Angular, Spring Boot + React, Node.js + Angular, Node.js + React
```

**Impact**: Agents using this skill will be misled about supported stacks.

**Fix**: Update skill to document all 4 supported stacks with their current status.

---

## Detailed Skill Gaps

### 1. `project-generation` Skill Gaps

**What the skill documents**:
- Workflow overview
- Guardrails
- Useful paths

**What the script does** (not in skill):
- **Harness abstraction**: 
  - Resolves harness CLI (opencode vs pi)
  - Maps provider to harness-specific format (z-ai → zai-coding-plan vs zai-coding-cn)
  - Maps model to harness-specific format (GLM-5.1Z.AI → glm-5.1 for z.ai, kimi/2.6 → moonshotai/kimi-k2.6 for openrouter)
  - Builds harness-specific CLI command with correct parameters
- **Session management**:
  - Loads existing session ID from file
  - Captures latest session after generation
  - Exports session data for audit trail
  - Tracks session in both `.opencode-session-id` and `.opencode-session` files
- **Activity-based timeout monitoring**:
  - Monitors file count in output directory (not just wall-clock time)
  - 90-second inactivity threshold (no new files = stalled)
  - Separate from max timeout (300s default)
  - Prevents false timeouts during compilation pauses
- **Retry logic**:
  - Automatic retries on failure (default 3)
  - Tries to resume previous session if available
  - Records each attempt with metadata
- **Detailed session record**:
  - Captures model, provider, harness, level, backend, frontend
  - Records tokens, cost, file count, timing
  - Preserves export for manual inspection

**Impact**: Agents without this information may not properly handle:
- Multi-harness scenarios
- Provider-specific model mapping
- Session resumption
- Timeout tuning
- Retry strategies

**Fix**: Enhance skill with comprehensive harness abstraction and session management documentation.

---

### 2. `evaluation-workflow` Skill Gaps

**What the skill documents**:
- General workflow for static and merged evaluation

**What the scripts do** (not in skill):
- **Eval-complete.sh specific**:
  - Orchestrates three sequential steps: static → e2e → merge
  - Passes metadata between steps (model, provider, harness, level)
  - Handles conditional E2E skipping
  - Merges scores: 70% static, 30% E2E (when both available)
  - Validates result paths match actual output
- **Result merge logic**:
  - Combines static-evaluation.json + e2e-execution.json
  - Applies 70/30 weighting
  - Produces evaluation-results.json
  - Metadata flow: generation → static eval → e2e → merged

**Impact**: Agents without this information will not understand:
- When to use eval-generated-project.sh vs eval-complete.sh
- How scores are combined
- What metadata to pass between steps
- Expected result file names and locations

**Fix**: Create detailed eval-complete.sh workflow skill with step-by-step orchestration.

---

### 3. `e2e-testing` Skill Outdated

**What needs fixing**:
- Update current coverage from "Spring Boot + Angular" to all 4 stacks
- Document which stacks have full E2E vs partial support
- Update common failure modes

**Impact**: Critical for proper test expectations.

**Fix**: Update immediately.

---

### 4. Missing: Cleanup Skill

**Script**: `cleanup-benchmark.sh`
- Removes workspace and/or results
- Supports scope selection (workspace, results, all)
- Dry-run mode
- Model slug generation

**Impact**: Agents won't know how to properly reset benchmarks.

**Fix**: Create comprehensive cleanup skill.

---

### 5. Missing: Test Setup Skill

**Script**: `test-setup.sh`
- Validates environment (Node.js, harness CLIs, directories)
- Checks support files (specs, cartridges, templates)
- Validates JSON syntax in config/specs

**Impact**: Agents can't guide environment setup.

**Fix**: Create environment validation skill.

---

### 6. Missing: Regression Testing Skill

**Script**: `test-regressions.sh`
- Validates timeout behavior
- Tests session resume
- Tests E2E timeout forwarding
- Tests cleanup/failure paths

**Impact**: Agents can't run comprehensive validation.

**Fix**: Create regression testing skill.

---

## Skill Quality Checklist

For each skill to be "complete and usable by any agent":

- [ ] Describe what the feature does
- [ ] List all command-line parameters with explanations
- [ ] Document default values
- [ ] Provide step-by-step workflow
- [ ] Include working examples with real values
- [ ] List prerequisites and dependencies
- [ ] Document expected outputs/result files
- [ ] List common failure modes and solutions
- [ ] Include troubleshooting guide
- [ ] Reference source files and line numbers where applicable
- [ ] Document edge cases
- [ ] Include validation steps

## Recommended Actions

### Priority 1 (CRITICAL - Do Immediately)
1. Fix `e2e-testing` skill: Update supported stacks claim

### Priority 2 (HIGH - Do this session)
1. Enhance `project-generation` skill:
   - Add harness abstraction section
   - Add session management protocol
   - Add timeout/activity monitoring section
   - Add retry strategy documentation
   - Add session record schema

2. Create `cleanup-benchmark.sh` skill:
   - Workspace cleanup workflow
   - Results cleanup workflow
   - Dry-run validation
   - Scope options

3. Create `eval-complete-pipeline` skill:
   - Three-step orchestration (static → e2e → merge)
   - Metadata flow between steps
   - Score weighting (70% static, 30% e2e)
   - Result validation

### Priority 3 (MEDIUM - Do soon)
1. Create `environment-setup` skill for test-setup.sh
2. Create `regression-testing` skill for test-regressions.sh
3. Enhance `prompt-rendering` skill with validation details
4. Create comprehensive `benchmark-orchestration` skill

## File Organization

Current structure:
```
skills/
  INDEX.md
  repo-orientation/SKILL.md
  prompt-rendering/SKILL.md
  project-generation/SKILL.md
  evaluation-workflow/SKILL.md
  e2e-testing/SKILL.md
  docs-maintenance/SKILL.md
```

Recommended additions:
```
skills/
  cleanup-benchmark/SKILL.md
  environment-setup/SKILL.md
  regression-testing/SKILL.md
  harness-abstraction/SKILL.md          (as detailed supplement to project-generation)
  session-management/SKILL.md           (as detailed supplement to project-generation)
  timeout-monitoring/SKILL.md           (as detailed supplement to project-generation)
  eval-complete-pipeline/SKILL.md       (as detailed supplement to evaluation-workflow)
```

## Next Steps

1. Create detailed enhancement plan for each skill
2. Implement critical fixes immediately
3. Test skills with sample agent queries
4. Document interdependencies between skills
5. Create skill routing guide for different task types
