---
description: "DEPRECATED - Subagents cannot orchestrate. Use /work command instead."
capabilities: ["deprecated"]
---

# Agent: work (DEPRECATED)

**⚠️ DO NOT USE THIS AGENT**

This agent was designed to orchestrate the work queue by spawning phase agents.

**This doesn't work because subagents cannot spawn other subagents.**

## What To Do Instead

Use the `/work` command, which tells the main Claude instance to:
1. Read `.agents/context/work.md` for workflow
2. Spawn leaf agents directly (rpi-plan, rpi-implement, verify-results, etc.)
3. Loop until queue is empty

## See Also

- `/work` command
- `.agents/context/work.md` - Full workflow instructions
