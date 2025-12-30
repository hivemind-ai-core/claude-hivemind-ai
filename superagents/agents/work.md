---
description: "DEPRECATED - Subagents cannot orchestrate. Use /work command instead."
capabilities: ["deprecated"]
---

# Agent: work (DEPRECATED)

**⚠️ DO NOT USE THIS AGENT**

This agent was designed to orchestrate the work queue by spawning phase agents.

**This doesn't work because subagents cannot spawn other subagents.**

## What To Do Instead

Use the `/work` command, which tells main Claude to:
1. Read `.agents/context/work.md` for workflow
2. Spawn fat agents directly:
   - `work-research` - gathers context for work item
   - `rpi` (phase=red|green|refactor) - handles entire phase
   - `architecture` - updates docs
   - `archive-work` - archives completed work
3. Loop until queue is empty

## See Also

- `/work` command
- `.agents/context/work.md` - Full workflow instructions
- `rpi` agent - Fat phase agent
