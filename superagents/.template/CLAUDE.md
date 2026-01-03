# RPI Workflow

<!-- superagents:1.2.0 -->

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

The `verify-results` agent enforces gates, and `git-commit` handles commits after each phase.

## Workflow

```
/work → research → RED → GREEN → REFACTOR → architecture → archive
                    ↓       ↓         ↓            ↓           ↓
                 tests   one test   one change   docs    move to
                 fail    at a time  at a time   update   archive/
```

## Phase Rules

| Phase | Flow | Gate |
|-------|------|------|
| RESEARCH | Read spec, code, architecture | Research artifact written |
| RED | Write 1-5 tests for work item | Tests fail correctly |
| GREEN | Pass one test, then next, **then integrate** | 100% pass, zero type errors, **integrated** |
| REFACTOR | One change, verify, next | 100% pass, zero type errors |
| ARCHIVE | Move work dir to archive | Item in completed.md, artifacts archived |

### GREEN Phase Integration Requirement

**Integration is an implementation step, not just a verification.**

GREEN phase is NOT complete until:
1. All tests pass (100%)
2. Zero type errors
3. **Code is wired into the application** (user can access the feature)

Dead code = incomplete GREEN phase. The plan MUST specify the integration point, and implementation MUST include adding the code to that integration point.

## Queue System

Work flows through a queue:

```
backlog.md → queued.md → completed.md
     ↓           ↓            ↓
  waiting    processing    finished
```

- `/queue-add` moves items from backlog to queue
- `/work` processes items from queue (auto-continues until empty)
- Completed items archived to `.agents/archive/<slug>/`

## Workflow Artifacts

Each work item has its own directory with all artifacts:

```
.agents/work/<slug>/
├── definition.md       # Work item description
├── research.md         # Master research
├── red-research.md     # RED phase research
├── red-plan.md         # RED phase plan
├── green-research.md   # GREEN phase research
├── green-plan.md       # GREEN phase plan
├── refactor-research.md
├── refactor-plan.md
└── report.md           # Combined results
```

## Key Files

| Purpose | Path |
|---------|------|
| Backlog (waiting) | `.agents/work/backlog.md` |
| Queue (processing) | `.agents/work/queued.md` |
| Completed | `.agents/work/completed.md` |
| Work items | `.agents/work/<slug>/` |
| **Archived work** | `.agents/archive/<slug>/` |
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
1. **Moved** entire `.agents/work/<slug>/` to `.agents/archive/<slug>/`
2. **Removed** from `queued.md`
3. **Added** to `completed.md`
4. **Entry added** to `.agents/archive/index.md`

### Archive Structure

```
.agents/archive/
├── index.md             # List of archived work items
├── auth-system/         # Archived work item
│   ├── definition.md
│   ├── research.md
│   ├── *-research.md
│   ├── *-plan.md
│   └── report.md
└── user-profile/        # Another archived item
    └── ...
```

### Why Archive?

- `queued.md` only shows pending/in-progress work
- `backlog.md` only shows waiting items
- Work directories only contain active work
- Context window usage minimized when checking "what's next"

To view history: read `.agents/archive/index.md`

## Git Workflow

<!-- superagents:git-config -->
- **Mode:** direct
- **Branch prefix:** feature
- **PR target:** (not applicable)
<!-- /superagents:git-config -->

### Mode Reference

| Mode | Behavior |
|------|----------|
| `direct` | Commits go to current branch immediately |
| `feature-squash` | Create `<prefix>/<slug>` branch, squash merge when done, delete branch |
| `feature-pr` | Create `<prefix>/<slug>` branch, open PR when done |

The `git-commit` agent reads this config and acts accordingly. The `archive-work` agent handles end-of-work-item actions (squash merge or PR).

## Commands

- `/work` - Execute RPI workflow (continues until queue empty)
- `/backlog` - Add work items interactively
- `/queue-add` - Move items from backlog to queue
- `/queue-status` - Show current queue state
- `/update-roadmap` - Generate roadmap and backlog from spec
- `/project-status` - Show current state
- `/fix-tests` - Systematic test repair
- `/update-architecture` - Update architecture docs with diagrams
- `/create-spec` - Interactive spec creation/amendment
- `/janitor` - Clean up stale files and orphaned work items
