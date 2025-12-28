# RPI Workflow

<!-- superagents:1.0.1 -->

Research-Plan-Implement with TDD. Quality built in, not inspected in.

## Core Principles

1. **Stop for Quality** - All tests MUST pass before commit. No exceptions.
2. **Single-Piece Flow** - One test at a time (GREEN), one refactoring at a time (REFACTOR)
3. **Go and See** - Read actual files before editing. Research can be stale.
4. **Eliminate Waste** - Write only what tests demand. No speculative code.
5. **Right-Size Work** - Each work item produces 1-5 tests. Split larger items.
6. **Poka-Yoke** - Design code that makes errors impossible, not just catchable.

## Test Gate

**All tests MUST pass AND code MUST be integrated before committing GREEN or REFACTOR phases.**

```
Run tests → All pass? → YES → Integration check? → YES → Commit allowed
                ↓                              ↓
               NO → Fix → Run again → Repeat    NO → Wire into app → Repeat
```

The `verify-results` agent gates all commits. `canProceed: true` required.

## Workflow

```
/work → research → RED → GREEN → REFACTOR → architecture → archive
                    ↓       ↓         ↓            ↓           ↓
                 tests   one test   one change   docs    remove from
                 fail    at a time  at a time   update   active files
```

## Phase Rules

| Phase | Flow | Gate |
|-------|------|------|
| RESEARCH | Read spec, code, architecture | Research artifact written |
| RED | Write 1-5 tests for work item | Tests fail correctly |
| GREEN | Pass one test, then next | 100% pass, zero type errors, integrated |
| REFACTOR | One change, verify, next | 100% pass, zero type errors |
| ARCHIVE | Remove from active, move to archive | Item in done.md, artifacts archived |

## Workflow Artifacts

Each workflow phase produces artifacts stored in `.agents/`. These MUST be created regardless of how work is initiated.

| Directory | Purpose | When Created |
|-----------|---------|--------------|
| `.agents/research/` | Research findings, analysis | Before RED phase |
| `.agents/plans/` | Implementation plans | Before each phase |
| `.agents/work/` | Active work state | During work |

### Artifact Flow

```
Research → .agents/research/{slug}.md
    ↓
RED reads research → writes .agents/plans/{slug}-red.md
    ↓
GREEN reads research + red plan → writes .agents/plans/{slug}-green.md
    ↓
REFACTOR reads all above → writes .agents/plans/{slug}-refactor.md
```

## Key Files

| Purpose | Path |
|---------|------|
| Current work | `.agents/todos/todo.md` |
| Research artifacts | `.agents/research/` |
| Phase plans | `.agents/plans/` |
| Work state | `.agents/work/` |
| **Completed work** | `.agents/archive/done.md` |
| Archived artifacts | `.agents/archive/` |
| Phase guidance | `.agents/context/phase-*.md` |
| Artifact guidance | `.agents/context/artifacts.md` |
| Patterns | `.agents/patterns/` |
| Mistakes to avoid | `.agents/mistakes/` |
| Requirements | `spec/` |
| Architecture | `architecture/` |

## Index Files

Each directory has an `index.md` for fast navigation:
```
<filename> -- <short description> -- <comma,separated,tags>
```

Read index files first to find relevant files without searching.

## Archiving Completed Work

**Goal**: Minimize context usage by keeping active files lean.

When a work item completes:
1. **Removed** from `todo.md` (not marked complete - REMOVED)
2. **Removed** from `ROADMAP.md`
3. **Moved** to archive: research, plans, work state
4. **Entry added** to `.agents/archive/done.md`

### Archive Structure

```
.agents/archive/
├── done.md              # List of completed work with summaries
├── research/            # Archived research artifacts
├── plans/               # Archived execution plans
└── work/                # Archived work state files
```

### Why Archive?

- `todo.md` only shows pending/in-progress work
- `ROADMAP.md` only shows remaining phases
- Research/plans directories only contain active work
- Context window usage minimized when checking "what's next"

To view history: read `.agents/archive/done.md`

## Commands

- `/work` - Execute RPI workflow for next todo
- `/update-roadmap` - Generate roadmap from spec
- `/project-status` - Show current state
- `/fix-tests` - Systematic test repair
- `/update-architecture` - Update architecture docs with diagrams
- `/create-spec` - Interactive spec creation/amendment
