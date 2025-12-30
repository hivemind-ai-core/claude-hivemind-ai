# Work Orchestration

Read this file when running `/work`. Follow it exactly. Do not ask the user.

## Minimal Context Rule

**Only accumulate the work item slug.** Everything else goes in files or is isolated in agents.

Agents communicate via files:
- Agent reads input files
- Agent does work (may read many files internally - this stays isolated)
- Agent writes output files
- Agent returns minimal summary
- You (main Claude) just track the slug and orchestrate

## Workflow

### 1. Get Next Work Item

```
Read: .agents/work/queued.md
Find: First item in "## Up Next"
Action: Move it to "## In Progress"
Write: Updated queued.md
Extract: {slug}
```

### 2. Research Phase

```
Task(superagents:work-research, "{slug}")
  Reads: .agents/work/{slug}/definition.md, spec/, architecture/
  Writes: .agents/work/{slug}/research.md
  Returns: { testCount, summary }
```

If testCount > 5: Work item too large, needs splitting. STOP.

### 3. RED Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=red")
  Reads: research.md, the code
  Writes: red-research.md

Task(superagents:rpi-plan, "{slug} phase=red")
  Reads: red-research.md
  Writes: red-plan.md

Task(superagents:rpi-implement, "{slug} phase=red")
  Reads: red-plan.md
  Writes: test files, report.md
  Returns: { testsCreated, filesAffected }

Task(superagents:verify-results, "phase=red")
  Returns: { canProceed, testsFailing }
  Gate: testsFailing > 0, failures are assertions

If canProceed === false: STOP, report error.

Task(superagents:git-commit, "phase=red workItem={slug}")
  Returns: { commitHash }
```

### 4. GREEN Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=green")
  Reads: research.md, the code, report.md
  Writes: green-research.md

Task(superagents:rpi-plan, "{slug} phase=green")
  Reads: green-research.md
  Writes: green-plan.md
  MUST include integration point

Task(superagents:rpi-implement, "{slug} phase=green")
  Reads: green-plan.md
  Writes: source files, report.md
  MUST integrate code into application
  Returns: { filesAffected, integrated }

Task(superagents:verify-results, "phase=green")
  Returns: { canProceed, passRate, integrationVerified }
  Gate: passRate === 100, integrationVerified === true

If canProceed === false:
  - Integration issue? Fix and re-verify
  - Test failure? STOP, report error

Task(superagents:git-commit, "phase=green workItem={slug}")
  Returns: { commitHash }
```

### 5. REFACTOR Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=refactor")
  Reads: research.md, the code, report.md
  Writes: refactor-research.md

Task(superagents:rpi-plan, "{slug} phase=refactor")
  Reads: refactor-research.md
  Writes: refactor-plan.md

Task(superagents:rpi-implement, "{slug} phase=refactor")
  Reads: refactor-plan.md
  Writes: source files, report.md
  One change at a time, verify after each
  Returns: { refactoringsApplied, filesAffected }

Task(superagents:verify-results, "phase=refactor")
  Returns: { canProceed, passRate }
  Gate: passRate === 100

If canProceed === false: STOP, report error.

Task(superagents:git-commit, "phase=refactor workItem={slug}")
  Returns: { commitHash }
```

### 6. Architecture Phase

```
Task(superagents:architecture, "{slug}")
  Reads: definition.md, report.md
  Writes: architecture documentation files
  Returns: { docsUpdated, diagramsGenerated }

Task(superagents:git-commit, "phase=docs workItem={slug}")
  Returns: { commitHash }
```

### 7. Archive Phase

```
Task(superagents:archive-work, "{slug}")
  Moves: .agents/work/{slug}/ → .agents/archive/{slug}/
  Updates: .agents/archive/index.md, .agents/work/completed.md
  Returns: { archivedTo }

Action: Remove {slug} from queued.md "## In Progress"

Task(superagents:git-commit, "phase=chore workItem={slug}")
  Returns: { commitHash }
```

### 8. Check for More Work

```
Read: .agents/work/queued.md "## Up Next"
If items remain: Go to Step 1
If empty: Report "Queue empty. All work complete."
```

## Error Handling

If any agent fails or gate doesn't pass:
1. Keep item in "## In Progress"
2. STOP (do not continue)
3. Report error
4. User fixes and re-runs /work

## What You Track

Only track:
- `{slug}` - current work item slug
- Agent return values (minimal summaries)

Everything else is in files. Don't accumulate agent internals.
