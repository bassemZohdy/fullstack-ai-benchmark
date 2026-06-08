---
name: repo-orientation
description: Navigate the benchmark repo, find the correct scripts and docs, and confirm supported stacks, paths, and conventions before editing or running tasks. Use when locating a workflow, reading repo status, or deciding which benchmark script to run.
---

# Repo Orientation

## Overview

Use this skill to orient inside the benchmark repository before changing code, docs, prompts, or results. It keeps the agent aligned with the actual workflow boundaries in this repo.

## Key Rules

- Root orchestration is Bash-only.
- Do not add root Node.js scripts for benchmark orchestration.
- Spec levels are `overview` and `detailed` only.
- Runtime E2E support is currently implemented for Spring Boot + Angular only.
- Generated workspaces live under `WORKSPACE/opencode-<model-slug>/<level>/`.
- Permanent outputs live under `RESULTS/opencode-<model-slug>/<backend>-<frontend>/<level>/`.

## Find The Right File

- Benchmark entry points: `scripts/run-benchmark.sh`, `scripts/generate-project.sh`, `scripts/eval-complete.sh`
- Prompt generation: `scripts/render-prompt.sh` and `PROMPTS/`
- Static evaluation: `scripts/eval-generated-project.sh` and `EVAL/`
- Runtime validation: `scripts/run-e2e-tests.sh` and `E2E_TESTS/`
- Repo docs: `README.md`, `docs/START.md`, `docs/SCRIPTS.md`, `docs/PROJECT_STATUS.md`, `docs/EVALUATION_SYSTEM.md`, `docs/E2E_TESTING.md`
- Current cleanup notes: `TODO.md`

## Workflow

1. Read the relevant docs before editing anything.
2. Confirm the target stack and level before touching prompts or scripts.
3. Prefer the existing shell scripts over ad hoc command construction.
4. If a change affects supported stacks, result paths, or scoring, update the matching docs and tests together.
5. If the task is about one specific phase, switch to the narrower skill instead of staying in this one.

## Escalate Early For Ambiguity

If the task could change generated output paths, supported stack claims, or evaluation semantics, verify the docs and scripts first instead of assuming the old behavior is still true.
