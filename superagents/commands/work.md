---
description: Execute the RPI workflow (Research-Plan-Implement with TDD) for queued items
---

# /work Command

Process the work queue autonomously until empty.

## Instructions

1. Read `.agents/context/work.md` - it contains the full workflow
2. Follow it exactly
3. Do not ask the user - just execute
4. Stop hook will tell you to continue if items remain

## Key Points

- **Minimal context**: Only track the work slug, everything else in files
- **Fine-grained agents**: Each agent does one thing, returns minimal summary
- **Phase context files**: Load phase-red/green/refactor.md for phase guidance
- **Artifacts via files**: Agents communicate through files, not context

**Start by reading `.agents/context/work.md`.**
