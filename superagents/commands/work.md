---
description: Execute the RPI workflow (Research-Plan-Implement with TDD) for queued items
---

# /work Command

**This is a thin dispatcher. It just spawns the work agent.**

## What To Do

Use the Task tool to spawn a `superagents:work` agent:

```
Task tool:
  subagent_type: "superagents:work"
  prompt: "Process the work queue. Continue until queue is empty."
```

That's it. The work agent handles everything else:
- Queue management (in-progress, up-next, completed)
- Spawning RPI agents for each phase
- Archiving completed work
- Looping until queue is empty

## DO NOT

- Do NOT read queue files yourself
- Do NOT implement anything yourself
- Do NOT manage workflow state yourself
- Do NOT ask the user anything

Just spawn the work agent and let it handle everything.
