# Work Orchestration

Read this file when running `/superagents:work`. Follow it exactly. Do not ask the user.

## Critical: Execute All Steps Sequentially

**DO NOT STOP between phases.** Execute steps 1→2→3→4→5→6→7→8 in one continuous flow.

## Critical: Mandatory Artifact Verification

**EVERY phase produces artifacts. VERIFY artifacts exist before proceeding.**

After each `rpi-research` or `rpi-plan` agent completes:
1. **Read the file** that should have been created
2. **Verify content** - file must have >200 characters of meaningful content
3. **If missing or empty**: STOP immediately. Do not proceed. Report the failure.

This is non-negotiable. An agent claiming to write a file is not proof it was written.

## Two Workflows Based on Item Type

### Atomic Items (type: atomic)
Full RPI workflow:
```
Get Item → Research → RED → GREEN-VALIDATE → GREEN → REFACTOR → Architecture → Archive → Check for More
                        ↑                |
                        └── kickback ────┘ (if tests invalid, max 3 retries)
```

### Research Items (type: research)
Breakdown workflow:
```
Get Item → Research (creates atomic items) → Archive → Check for More
```

Research items do NOT go through RED/GREEN/REFACTOR. They create atomic items that do.

Only stop when:
- A fatal error occurs (gate fails, agent errors)
- Queue is empty (step 8 finds no more items)
- Kickback retry limit reached (3 attempts)

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

### 1.5. Determine Item Type

```
Read: .agents/work/{slug}/definition.md
Find: "## Type" section
Extract: {type} (atomic or research)
```

**If type = "research":** Go to [Step 2R: Research Item Workflow](#2r-research-item-workflow)
**If type = "atomic":** Go to [Step 2: Atomic Research Phase](#2-atomic-research-phase)

---

### 2R. Research Item Workflow

Research items break down complex tasks into atomic items. They do NOT go through RPI.

```
Task(superagents:work-research, "{slug}")
  Reads: .agents/work/{slug}/definition.md, spec/, architecture/, src/
  Writes: .agents/work/{slug}/breakdown.md
  Writes: .agents/work/{slug}/report.md
  Creates: Multiple .agents/work/{item-slug}/ directories
  Updates: .agents/work/backlog.md (adds atomic items)
  Returns: { type: "research", createdItems: [...], summary }
```

**VERIFY:**
1. Read `.agents/work/{slug}/breakdown.md` - must exist with >500 chars
2. Read `.agents/work/{slug}/report.md` - must exist with >200 chars
3. Check `createdItems` array - must have at least 1 item
4. For each created item, verify `.agents/work/{item-slug}/definition.md` exists

**If verification fails:** STOP. Report error.

**If verification passes:**
```
Task(superagents:git-commit, "phase=research workItem={slug}")
  Returns: { commitHash }
```

**→ Skip to Step 7 (Archive Phase). Research items don't need RPI.**

---

### 2. Atomic Research Phase

Standard research for atomic items.

```
Task(superagents:work-research, "{slug}")
  Reads: .agents/work/{slug}/definition.md, spec/, architecture/
  Writes: .agents/work/{slug}/research.md
  Returns: { type: "atomic", testCount, summary }
```

If testCount > 5: Work item incorrectly classified. STOP with error.

**→ Immediately proceed to RED phase. Do not stop.**

### 3. RED Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=red")
  Reads: research.md, the code
  Writes: red-research.md

VERIFY: Read .agents/work/{slug}/red-research.md
  - File MUST exist
  - File MUST have >200 chars of content
  - If missing/empty: STOP. Agent failed. Report error.

Task(superagents:rpi-plan, "{slug} phase=red")
  Reads: red-research.md
  Writes: red-plan.md

VERIFY: Read .agents/work/{slug}/red-plan.md
  - File MUST exist
  - File MUST have >200 chars of content
  - If missing/empty: STOP. Agent failed. Report error.

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

**→ Immediately proceed to GREEN phase. Do not stop.**

### 4. GREEN Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=green")
  Reads: research.md, the code, report.md
  Writes: green-research.md

VERIFY: Read .agents/work/{slug}/green-research.md
  - File MUST exist
  - File MUST have >200 chars of content
  - If missing/empty: STOP. Agent failed. Report error.

Task(superagents:rpi-plan, "{slug} phase=green")
  Reads: green-research.md
  Writes: green-plan.md
  MUST include integration point

VERIFY: Read .agents/work/{slug}/green-plan.md
  - File MUST exist
  - File MUST have >200 chars of content
  - File MUST contain "Integration" section
  - If missing/empty/no-integration: STOP. Agent failed. Report error.
```

#### 4.1 Test Validation (Pre-Implementation)

Before implementing, validate that tests are correct:

```
Task(superagents:verify-results, "phase=green-validate workItem={slug}")
  Reads: research.md, spec/, test files, report.md
  Returns: { testsValid, testsAnalyzed, validationErrors[] }
```

**If `testsValid === true`:** Proceed to step 4.2 (Implementation).

**If `testsValid === false`:** The tests are wrong, not the implementation.

```
KICKBACK TO RED:
1. Write validationErrors to .agents/work/{slug}/red-kickback.md:
   ```markdown
   # RED Kickback: {slug}

   Tests were rejected during GREEN validation. Fix these issues:

   ## Validation Errors

   ### {testFile}: {testName}
   - **Issue**: {issue}
   - **Spec Reference**: {specReference}
   - **Correct Behavior**: {correctBehavior}

   (repeat for each error)
   ```

2. Revert RED phase commit:
   git revert HEAD --no-edit

3. Increment redRetryCount (track in memory, reset per work item)

4. If redRetryCount >= 3:
   STOP - Escalate to human: "Requirements may be ambiguous or fundamentally misunderstood after 3 attempts"

5. Go to step 3 (RED phase):
   - rpi-research reads red-kickback.md
   - Tests will be rewritten with corrected understanding
```

#### 4.2 Implementation (Only if tests valid)

```
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

**→ Immediately proceed to REFACTOR phase. Do not stop.**

### 5. REFACTOR Phase

Spawn these agents in sequence (they load phase context internally):

```
Task(superagents:rpi-research, "{slug} phase=refactor")
  Reads: research.md, the code, report.md
  Writes: refactor-research.md

VERIFY: Read .agents/work/{slug}/refactor-research.md
  - File MUST exist
  - File MUST have >200 chars of content
  - If missing/empty: STOP. Agent failed. Report error.

Task(superagents:rpi-plan, "{slug} phase=refactor")
  Reads: refactor-research.md
  Writes: refactor-plan.md

VERIFY: Read .agents/work/{slug}/refactor-plan.md
  - File MUST exist
  - File MUST have >200 chars of content
  - If missing/empty: STOP. Agent failed. Report error.

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

**→ Immediately proceed to Architecture phase. Do not stop.**

### 6. Architecture Phase

```
Task(superagents:architecture, "{slug}")
  Reads: definition.md, report.md
  Writes: architecture documentation files
  Returns: { docsUpdated, diagramsGenerated }

Task(superagents:git-commit, "phase=docs workItem={slug}")
  Returns: { commitHash }
```

**→ Immediately proceed to Archive phase. Do not stop.**

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

**→ Immediately check for more work. Do not stop.**

### 8. Check for More Work

```
Read: .agents/work/queued.md "## Up Next"
If items remain: Go to Step 1
If empty: Report "Queue empty. All work complete."
```

## Error Handling

### Recoverable: Test Validation Kickback
If `testsValid === false` in GREEN-VALIDATE:
- This is NOT an error - it's iterative improvement
- Write `red-kickback.md`, revert RED commit, loop to step 3
- Continue automatically (do not stop)
- Only stop if `redRetryCount >= 3` (escalate to human)

### Fatal: Agent Failure or Gate Failure
If any agent fails or gate doesn't pass (except kickback):
1. Keep item in "## In Progress"
2. STOP (do not continue)
3. Report error
4. User fixes and re-runs /superagents:work

## What You Track

Only track:
- `{slug}` - current work item slug
- `redRetryCount` - number of RED kickbacks for current item (reset to 0 for each new item)
- Agent return values (minimal summaries)

Everything else is in files. Don't accumulate agent internals.
