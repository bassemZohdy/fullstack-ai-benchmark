---
name: cleanup-benchmark
description: Remove generated benchmark workspace and results for a specific model/backend/frontend/level combination. Use when resetting benchmarks, cleaning up failed runs, or preparing for fresh generation.
---

# Benchmark Cleanup

## Overview

Use this skill when you need to remove generated projects, evaluation results, or both for a specific benchmark configuration. Cleanup is useful for:
- Resetting failed generations to start fresh
- Removing intermediate results before re-benchmarking
- Freeing disk space after testing
- Validating cleanup behavior

## Workflow

1. Identify the model, level, backend, frontend combination to clean
2. Choose scope: `workspace` (generated code), `results` (evaluation files), or `all` (both)
3. Run with `--dry-run` first to verify what will be deleted
4. Run actual cleanup when ready

## Command Reference

```bash
./scripts/cleanup-benchmark.sh \
  --model <model> \
  --level <level> \
  --backend <backend> \
  --frontend <frontend> \
  [--harness <harness>] \
  [--scope <scope>] \
  [--dry-run]
```

### Required Parameters

| Parameter | Value | Example | Notes |
|-----------|-------|---------|-------|
| `--model` | Model ID | `GLM-5.1Z.AI`, `kimi/2.6` | Must match the model used for generation |
| `--level` | Spec level | `overview`, `detailed` | Only these two are supported |
| `--backend` | Backend framework | `spring-boot`, `node-js`, `quarkus` | Must match the backend used for generation |
| `--frontend` | Frontend framework | `angular`, `react` | Must match the frontend used for generation |

### Optional Parameters

| Parameter | Default | Options | Purpose |
|-----------|---------|---------|---------|
| `--harness` | `opencode` | `opencode`, `pi` | Harness used in generation |
| `--scope` | `all` | `workspace`, `results`, `all` | What to delete |
| `--dry-run` | Off | (flag) | Show what would be deleted without deleting |

## Scope Explanation

### `workspace` Scope
Removes the generated project directory:
```
WORKSPACE/
  <harness>-<model-slug>/
    <level>/          ← DELETED
      backend/
      frontend/
      .opencode-session-id
      ...all generated files...
```

**Use when**: You want to regenerate from scratch but keep evaluation results for comparison

### `results` Scope
Removes evaluation outputs:
```
RESULTS/
  <harness>-<model-slug>/
    <backend>-<frontend>/
      <level>/        ← DELETED
        static-evaluation.json
        e2e-execution.json
        evaluation-results.json
```

**Use when**: You want to re-evaluate without regenerating the project

### `all` Scope (default)
Removes both workspace and results directories completely

**Use when**: Completely reset a benchmark run for fresh start

## Model Slug Generation

The script uses `benchmark_slugify_model` from `scripts/benchmark-support.sh` to derive the workspace and results paths from the model ID and harness. The full directory prefix is `{harness}-{slug}`.

| Model ID | Harness | Full prefix |
|----------|---------|-------------|
| `GLM-5.1Z.AI` | `opencode` | `opencode-glm-5.1` |
| `GLM-5.1Z.AI` | `pi` | `pi-glm-5.1` |
| `kimi/2.6` | `opencode` | `opencode-kimi-2.6` |
| `minimax/1.5` | `opencode` | `opencode-minimax-1.5` |
| `xiaomi/mimo-2.5` | `opencode` | `opencode-xiaomi-mimo-2.5` |

The slug is created by:
1. Converting to lowercase
2. For GLM models matching `glm-X.Yz.ai`, simplifying to `glm-X.Y`
3. Replacing `/` with `-`
4. Replacing remaining non-alphanumeric characters (except `.`, `-`, `_`) with `-`
5. Collapsing repeated `-` and stripping leading/trailing `-`

## Working Examples

### Example 1: Preview Cleanup (Dry Run)

```bash
# See what will be deleted without actually deleting
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --dry-run

# Output:
# [INFO] Scope: all
# [INFO] Would clean: WORKSPACE/opencode-glm-5.1/overview
# [INFO] Would clean: RESULTS/opencode-glm-5.1/spring-boot-angular/overview
# (No files actually deleted)
```

### Example 2: Clean Workspace Only

```bash
# Keep results, remove generated project for regeneration
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --scope workspace

# Deletes: WORKSPACE/opencode-glm-5.1/overview
# Keeps: RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```

### Example 3: Clean Results Only

```bash
# Keep project, remove evaluation results for re-evaluation
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --scope results

# Keeps: WORKSPACE/opencode-glm-5.1/overview
# Deletes: RESULTS/opencode-glm-5.1/spring-boot-angular/overview
```

### Example 4: Complete Cleanup

```bash
# Remove everything for a complete reset
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --scope all

# Deletes both workspace and results directories
```

### Example 5: OpenRouter Model Cleanup

```bash
# Clean up OpenRouter test results
./scripts/cleanup-benchmark.sh \
  --model kimi/2.6 \
  --level overview \
  --backend spring-boot \
  --frontend react \
  --harness opencode

# Note: Model slug is automatically generated as kimi-2.6
# Cleans: WORKSPACE/opencode-kimi-2.6/overview
#         RESULTS/opencode-kimi-2.6/spring-boot-react/overview
```

### Example 6: Different Harness

```bash
# Clean PI-generated results (not OpenCode)
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness pi

# Cleans: WORKSPACE/pi-glm-5.1/overview
#         RESULTS/pi-glm-5.1/spring-boot-angular/overview
```

## Validation & Safety

- **Dry run first**: Always use `--dry-run` to verify paths
- **Manual deletion prevention**: Only deletes recognized benchmark directories
- **Path validation**: Refuses to delete `/`, `.`, or project root
- **Confirmation**: Shows what will be deleted before proceeding

## Common Patterns

### Pattern 1: Reset and Regenerate

```bash
# 1. Preview what will be cleaned
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --dry-run

# 2. Clean workspace
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --scope workspace

# 3. Regenerate from scratch
./scripts/generate-project.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular
```

### Pattern 2: Clean All Failed Tests

```bash
# Remove workspace and results for a failed level
for backend in spring-boot node-js; do
  for frontend in angular react; do
    ./scripts/cleanup-benchmark.sh \
      --model GLM-5.1Z.AI \
      --level detailed \
      --backend "$backend" \
      --frontend "$frontend" \
      --scope all
  done
done
```

### Pattern 3: Compare Harnesses

```bash
# Test same model with both harnesses
# (results stay in different directories by harness)

# OpenCode results
WORKSPACE/opencode-glm-5.1/overview/
RESULTS/opencode-glm-5.1/spring-boot-angular/overview/

# PI results
WORKSPACE/pi-glm-5.1/overview/
RESULTS/pi-glm-5.1/spring-boot-angular/overview/

# To clean PI results:
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular \
  --harness pi
```

## Troubleshooting

### Issue: "Model, level, backend, and frontend are required"

**Cause**: Missing required parameter

**Solution**: Include all four parameters:
```bash
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview \
  --backend spring-boot \
  --frontend angular
```

### Issue: "Invalid level: [value]"

**Cause**: Level is not `overview` or `detailed`

**Solution**: Use only supported levels:
```bash
# ✅ Correct
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level overview ...

# ❌ Wrong
./scripts/cleanup-benchmark.sh \
  --model GLM-5.1Z.AI \
  --level advanced ...
```

### Issue: Nothing happens with dry-run

**Cause**: Paths don't exist (already cleaned or never created)

**Solution**: This is normal - no cleanup needed. Check:
```bash
# See if workspace exists
ls WORKSPACE/opencode-glm-5.1/overview/

# See if results exist
ls RESULTS/opencode-glm-5.1/spring-boot-angular/overview/
```

## File Locations

- Script: `scripts/cleanup-benchmark.sh`
- Support lib: `scripts/benchmark-support.sh`
- Workspace root: `WORKSPACE/`
- Results root: `RESULTS/`

## Dependencies

- Bash 4.0+
- No external tools required
- Uses standard `rm -rf` for deletion

## Related Skills

- **project-generation**: Create new projects to clean up
- **evaluation-workflow**: Re-evaluate after cleanup
- **repo-orientation**: Understanding directory structure
