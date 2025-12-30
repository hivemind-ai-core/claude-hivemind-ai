# Work Orchestration Context

This file is loaded when running `/work`. Follow it exactly.

## Architecture

**Subagents CANNOT spawn other subagents.** You (main Claude) orchestrate directly.

Each phase runs in an isolated subagent to prevent context pollution.

```
Main Claude (you)
  ├── work-research        (gathers context for work item)
  ├── rpi phase=red        (writes tests, verifies they fail, commits)
  ├── rpi phase=green      (implements, integrates, verifies, commits)
  ├── rpi phase=refactor   (refactors, verifies, commits)
  ├── architecture         (updates docs)
  └── archive-work         (archives and commits)
```

## Workflow Per Work Item

For each item in `queued.md`:

### 1. Setup

```
Read: .agents/work/queued.md
Action: Move first item from "## Up Next" to "## In Progress"
Write: Updated queued.md
Extract: {slug} from moved item
```

### 2. Research Phase

```
Task(superagents:work-research):
  "Research work item {slug}.
   Read: .agents/work/{slug}/definition.md
   Write: .agents/work/{slug}/research.md
   Return: summary and estimated test count"
```

If test count > 5: Flag item as too large, need to split.

### 3. RED Phase

```
Task(superagents:rpi):
  "Execute RED phase for {slug}.
   Phase: red
   Read: .agents/context/phase-red.md for guidance
   Do: Plan tests, write tests, verify they fail, commit
   Expected: Tests exist and fail with assertion errors"
```

If `success: false`: STOP, report error.

### 4. GREEN Phase

```
Task(superagents:rpi):
  "Execute GREEN phase for {slug}.
   Phase: green
   Read: .agents/context/phase-green.md for guidance
   Do: Plan implementation, implement one test at a time, INTEGRATE into app, verify 100% pass, commit
   Expected: 100% pass rate, zero type errors, integration verified"
```

If `success: false`: STOP, report error.

### 5. REFACTOR Phase

```
Task(superagents:rpi):
  "Execute REFACTOR phase for {slug}.
   Phase: refactor
   Read: .agents/context/phase-refactor.md for guidance
   Do: Plan refactorings, apply one at a time, verify after each, commit
   Expected: 100% pass rate maintained"
```

If `success: false`: STOP, report error.

### 6. Architecture Phase

```
Task(superagents:architecture):
  "Update architecture docs for completed work item {slug}.
   Generate Mermaid diagrams if helpful."
```

### 7. Archive Phase

```
Task(superagents:archive-work):
  "Archive work item {slug}.
   Move: .agents/work/{slug}/ to .agents/archive/{slug}/
   Update: .agents/archive/index.md
   Update: .agents/work/completed.md"

Action: Remove {slug} from queued.md "## In Progress"
Action: git commit -m "chore({slug}): archive completed work"
```

### 8. Loop

```
Check: .agents/work/queued.md "## Up Next"
If items remain: Go to Step 1 with next item
If empty: Report "Queue empty. All work complete."
```

## Task Tool Usage

When spawning agents:

```javascript
Task({
  subagent_type: "superagents:rpi",
  prompt: "Execute GREEN phase for {slug}. Phase: green. Read .agents/context/phase-green.md for guidance. Implement and integrate code.",
  description: "GREEN phase for {slug}"
})
```

Include:
- Work item slug
- Phase parameter (for rpi agent)
- Path to context file
- Expected outcome

## Error Handling

If any phase agent returns `success: false`:

1. Log the error details
2. Keep item in "## In Progress"
3. STOP the workflow (do NOT continue to next item)
4. Report error to user
5. User must fix issue and re-run `/work`

## Context Isolation

Each phase runs in a separate subagent. This means:
- Phase agents only receive their specific context
- Intermediary work (plan files, code changes) stay in the subagent
- Only results (success/failure, summary) return to main Claude
- Main Claude's context stays lean

## Phase Agent Responsibilities

Each rpi phase agent internally:
1. Loads phase context file (phase-red.md, phase-green.md, phase-refactor.md)
2. Creates phase plan (writes to .agents/work/{slug}/{phase}-plan.md)
3. Executes plan (writes code/tests)
4. Verifies gates (runs tests, checks types)
5. Commits with conventional message
6. Returns result summary

The agent reads the phase context file to know:
- What gates must pass
- What to do (tests vs implementation vs refactoring)
- How to commit

## Gate Summary

| Phase | Agent Returns Success When |
|-------|---------------------------|
| Research | research.md written, test count <= 5 |
| RED | Tests exist, tests fail with assertions, committed |
| GREEN | 100% pass, zero type errors, integrated, committed |
| REFACTOR | 100% pass, zero type errors, committed |
