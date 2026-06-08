---
name: prompt-rendering
description: Render benchmark prompts from templates, specs, and cartridges. Use when working on `scripts/render-prompt.sh`, prompt templates, spec levels, or cartridge content.
---

# Prompt Rendering

## Overview

Use this skill when the task is to build or verify the final prompt text that gets fed into project generation. The goal is to keep the prompt derived from the source spec and cartridges, not hand-edited drift.

## Inputs

- Template: `PROMPTS/templates/project-generation.md`
- Spec level: `PROMPTS/overview.md` or `PROMPTS/detailed.md`
- Backend cartridge: `PROMPTS/cartridges/backend/*.md`
- Frontend cartridge: `PROMPTS/cartridges/frontend/*.md`

## Workflow

1. Confirm the target level, backend, and frontend before rendering.
2. Run `scripts/render-prompt.sh` with the template, spec, and cartridges.
3. Inspect the rendered output for missing sections, stale claims, or stack mismatches.
4. If the prompt looks wrong, fix the source spec or cartridge rather than patching the rendered prompt.
5. If the prompt changes in a meaningful way, make sure the generation workflow still uses the same inputs.

## Validate

- Compare the rendered prompt against `docs/PROMPT_SPECIFICATIONS.md`.
- Check for unsupported stack combinations before letting generation proceed.
- Treat the rendered prompt as a derived artifact, not a source file.
