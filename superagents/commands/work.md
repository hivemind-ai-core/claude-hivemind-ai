---
description: Execute the RPI workflow (Research-Plan-Implement with TDD) for queued items
---

# /work Command

Process the work queue by following the workflow in `.agents/context/work.md`.

## Instructions

1. Read `.agents/context/work.md` for the complete workflow
2. Follow the steps exactly as described
3. Spawn leaf agents via Task tool (subagents cannot spawn subagents)
4. Loop until queue is empty
5. Do not ask the user - just execute

## Quick Reference

The workflow file tells you to:
- Read `queued.md` for next item
- For each phase (Research → RED → GREEN → REFACTOR → Architecture → Archive):
  - Load phase context
  - Spawn leaf agents: `rpi-research`, `rpi-plan`, `rpi-implement`, `verify-results`, `git-commit`
- Update queue and loop

**Start by reading `.agents/context/work.md`.**
