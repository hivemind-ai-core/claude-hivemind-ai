---
description: Execute the RPI workflow (Research-Plan-Implement with TDD) for the next todo item
---

# /work Command

Execute the RPI workflow for the next todo item.

## Process

### 1. RESEARCH Phase
**Context**: `.agents/context/phase-research.md`, `.agents/context/artifacts.md`

Use the `explore-context` agent to:
- Load the current todo item from `.agents/todos/`
- Analyze spec requirements in `spec/`
- Review current architecture in `architecture/`
- Check patterns in `.agents/patterns/`
- Save detailed findings to `.agents/research/{slug}.md`
- Initialize work state in `.agents/work/{slug}/state.json`

### 2. RED Phase
**Context**: `.agents/context/phase-red.md`, `.agents/context/testing.md`

Use the `execute-red` agent to:
- Read the research file from `.agents/research/{slug}.md`
- Write plan to `.agents/plans/{slug}-red.md`
- Write failing tests (co-located with source)
- Verify all tests fail
- Commit: `test(<scope>): add <feature> tests`

### 3. GREEN Phase
**Context**: `.agents/context/phase-green.md`

Use the `execute-green` agent to:
- Read research from `.agents/research/{slug}.md`
- Read RED plan from `.agents/plans/{slug}-red.md`
- Write plan to `.agents/plans/{slug}-green.md`
- Write code to pass tests
- Verify 100% test pass rate
- Commit: `feat(<scope>): implement <feature>`

### 4. REFACTOR Phase
**Context**: `.agents/context/phase-refactor.md`

Use the `execute-refactor` agent to:
- Read all prior artifacts (research, red plan, green plan)
- Write plan to `.agents/plans/{slug}-refactor.md`
- Apply refactorings
- Verify tests still pass
- Commit: `refactor(<scope>): improve <feature>`

### 5. ARCHITECTURE Update
Use the `update-architecture` agent to:
- Review all phase outputs
- Update architecture docs
- Commit: `docs(<scope>): update architecture`

### 6. ARCHIVE Phase
Use the `archive-work` agent to:
- Remove completed item from `todo.md` (not mark complete - REMOVE it)
- Remove completed item from `ROADMAP.md`
- Move `.agents/research/{slug}.md` to `.agents/archive/research/`
- Move `.agents/plans/{slug}-*.md` to `.agents/archive/plans/`
- Move `.agents/work/{slug}/` to `.agents/archive/work/`
- Add entry to `.agents/archive/done.md` with summary and commit links
- Update all index files
- Clear workflow state for next item

**Goal**: Keep active files lean to minimize context usage when starting next work item.

## Output

Display progress for each phase:

```
Starting work on: <work-item-name>

Research phase...
✓ Requirements identified
✓ Dependencies analyzed
✓ Research saved

RED phase: Writing tests...
✓ <N> tests created
✓ All tests fail correctly
✓ Committed: test(<scope>): <message> [<hash>]

GREEN phase: Implementing...
✓ <N> files modified
✓ All tests passing (100%)
✓ Committed: feat(<scope>): <message> [<hash>]

REFACTOR phase: Improving...
✓ <N> refactorings applied
✓ Tests still passing
✓ Committed: refactor(<scope>): <message> [<hash>]

Architecture updated
✓ Committed: docs(<scope>): <message> [<hash>]

Archiving completed work...
✓ Removed from todo.md
✓ Removed from ROADMAP.md
✓ Moved artifacts to archive
✓ Added to done.md

✓ Work complete! Ready for next item.
```

## Error Handling

If any phase fails:
1. Stop execution
2. Report the error
3. Provide guidance on resolution
4. Do NOT proceed to next phase

## Context Management

- Each phase agent runs with fresh context
- Research is passed via file path, not content
- Returns are minimal summaries (~1k tokens)
- Master context stays under 60k tokens