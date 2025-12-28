---
name: archive-work
description: Archive completed work items by removing from active files and moving to archive
---

# Archive Work Agent

Remove completed work items from active files and move to archive to minimize context usage.

## Purpose

When a work item completes all RPI phases, this agent:
1. **Removes** the item from active todo lists (not just marks complete)
2. **Moves** all artifacts (research, plans, work state) to archive directories
3. **Updates** index files to reflect the move
4. **Creates** an entry in done.md with summary and links

## Goal: Minimize Active Context

The primary goal is to keep active files lean so that:
- Reading `todo.md` only shows pending/in-progress work
- Reading `ROADMAP.md` only shows uncompleted phases
- `.agents/research/` only contains active research
- `.agents/plans/` only contains active plans
- Context window usage is minimized when checking "what's next"

## Input

- `workItem` (required): Name/slug of completed work item
- `commits` (optional): Array of commit hashes from the work
- `summary` (optional): Brief summary of what was implemented
- `requirements` (optional): Array of requirement IDs addressed (REQ-XXX)

## Output

Returns object with:
- `archivedTo` - Path to entry in done.md
- `filesMoved` - Array of files moved to archive
- `filesUpdated` - Array of files that were updated (todo.md, ROADMAP.md, etc.)
- `success` - Boolean indicating success

## Process

### 1. Remove from todo.md

Parse `.agents/todos/todo.md` and remove the work item entirely:

**Before:**
```markdown
## In Progress

- [x] **auth-system** - User authentication
  - Requirements: REQ-001, REQ-002

## Up Next

- [ ] **user-profile** - User profile management
```

**After:**
```markdown
## In Progress

_No work in progress. Run `/work` to start the next item._

## Up Next

- [ ] **user-profile** - User profile management
```

The completed item is **removed**, not moved to a "Completed" section.

### 2. Update ROADMAP.md

Remove completed item from roadmap phases:

**Before:**
```markdown
## Phase 1: Foundation

- [x] auth-system - User authentication ✓
- [ ] user-profile - User profile management
```

**After:**
```markdown
## Phase 1: Foundation

- [ ] user-profile - User profile management
```

Or if phase is now empty, mark it complete:
```markdown
## Phase 1: Foundation ✓

_All items completed. See `.agents/archive/done.md` for details._
```

### 3. Move Artifacts to Archive

Move files from active directories to archive:

| From | To |
|------|-----|
| `.agents/research/{slug}.md` | `.agents/archive/research/{slug}.md` |
| `.agents/plans/{slug}-red.md` | `.agents/archive/plans/{slug}-red.md` |
| `.agents/plans/{slug}-green.md` | `.agents/archive/plans/{slug}-green.md` |
| `.agents/plans/{slug}-refactor.md` | `.agents/archive/plans/{slug}-refactor.md` |
| `.agents/work/{slug}/` | `.agents/archive/work/{slug}/` |
| `.agents/plans/diagrams/{slug}-*` | `.agents/archive/plans/diagrams/{slug}-*` |

### 4. Update Index Files

**Remove from active indices:**
- `.agents/research/index.md` - Remove entry
- `.agents/plans/index.md` - Remove entries

**Add to archive indices:**
- `.agents/archive/research/index.md` - Add entry
- `.agents/archive/plans/index.md` - Add entries
- `.agents/archive/work/index.md` - Add entry

### 5. Create Entry in done.md

Append to `.agents/archive/done.md`:

```markdown
### auth-system

**Completed**: 2025-01-15
**Description**: User authentication with JWT tokens and session management

**Requirements**: REQ-001, REQ-002, REQ-003
**Commits**:
- `abc1234` - test(auth): add authentication tests
- `def5678` - feat(auth): implement login and logout
- `ghi9012` - refactor(auth): extract validation utilities
- `jkl3456` - docs(auth): update architecture

**Artifacts**:
- Research: [research/auth-system.md](research/auth-system.md)
- Plans: [plans/auth-system-red.md](plans/auth-system-red.md), [plans/auth-system-green.md](plans/auth-system-green.md)
- Work: [work/auth-system/](work/auth-system/)

**Summary**: Implemented complete authentication flow including registration, login, logout, and JWT token refresh. Added rate limiting and session expiry.

---
```

### 6. Update Workflow State

Update `.agents/workflow.json`:
- Remove item from any tracking
- Clear `currentWorkItem` if it matches
- Clear `currentPhase`
- Item is NOT added to `completedItems` (that list is deprecated, use done.md)

```json
{
  "currentPhase": null,
  "currentWorkItem": null,
  "lastUpdated": "2025-01-15T10:30:00Z"
}
```

## File Operations

### Atomic Updates

Perform all file operations atomically:
1. Read all files to update
2. Prepare all changes in memory
3. Write all changes
4. Verify success

### Rollback on Failure

If any operation fails:
1. Report which operation failed
2. Do not leave files in inconsistent state
3. Suggest manual recovery steps

## Example Output

```json
{
  "archivedTo": ".agents/archive/done.md",
  "filesMoved": [
    ".agents/research/auth-system.md -> .agents/archive/research/auth-system.md",
    ".agents/plans/auth-system-red.md -> .agents/archive/plans/auth-system-red.md",
    ".agents/plans/auth-system-green.md -> .agents/archive/plans/auth-system-green.md",
    ".agents/plans/auth-system-refactor.md -> .agents/archive/plans/auth-system-refactor.md",
    ".agents/work/auth-system/ -> .agents/archive/work/auth-system/"
  ],
  "filesUpdated": [
    ".agents/todos/todo.md (removed item)",
    ".agents/ROADMAP.md (removed item)",
    ".agents/research/index.md (removed entry)",
    ".agents/plans/index.md (removed entries)",
    ".agents/archive/done.md (added entry)",
    ".agents/archive/research/index.md (added entry)",
    ".agents/archive/plans/index.md (added entries)",
    ".agents/workflow.json (cleared current work)"
  ],
  "success": true
}
```

## Quality Criteria

1. **Complete Removal** - No traces of completed work in active files
2. **Proper Archiving** - All artifacts preserved in archive
3. **Index Consistency** - All index files updated correctly
4. **Linked References** - done.md entries link to archived artifacts
5. **Atomic Operation** - Either fully succeeds or fully fails

## Integration

This agent is called:
- At the end of `/work` command after ARCHITECTURE phase
- After `update-architecture` agent completes successfully
- The final step before starting the next work item

## Context Reduction Impact

After archiving:
- `todo.md` - Only shows pending/in-progress (no completed history)
- `ROADMAP.md` - Only shows remaining work
- `.agents/research/` - Only contains active research
- `.agents/plans/` - Only contains active plans
- `.agents/work/` - Only contains active work state

To view completed work history, read `.agents/archive/done.md`.
