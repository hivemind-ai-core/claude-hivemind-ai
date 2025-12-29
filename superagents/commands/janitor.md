---
description: Scan .agents directories and clean up stale files, orphaned work items, and inconsistencies
---

# /janitor Command

Scan the `.agents` directory structure and identify/fix inconsistencies.

## Purpose

Over time, the `.agents` directory can accumulate stale files:
- Work items that were completed but not properly archived
- Orphaned work directories (not in backlog or queue)
- Stale entries in queue files that reference non-existent work
- workflow.json pointing to work items that no longer exist
- Research/plan files from old workflows

This command identifies these issues and optionally fixes them.

## Process

### 1. Verify Directory Structure

Check that required directories exist:
```
.agents/
├── work/
│   ├── backlog.md
│   ├── queued.md
│   └── completed.md
├── archive/
│   └── index.md (or done.md)
├── context/
├── patterns/
├── mistakes/
├── research/
├── plans/
└── workflow.json
```

Report any missing required files.

### 2. Scan Work Directories

List all directories in `.agents/work/` (excluding markdown files):

```bash
find .agents/work -mindepth 1 -maxdepth 1 -type d
```

For each work directory found:
1. Check if it's referenced in `queued.md` (In Progress or Up Next)
2. Check if it's referenced in `backlog.md`
3. Check if it's referenced in `completed.md`

**Orphaned work directories** are those not referenced anywhere.

### 3. Check Queue Consistency

Parse `queued.md`:
- For each item in "## In Progress": verify `.agents/work/{slug}/` exists
- For each item in "## Up Next": verify `.agents/work/{slug}/` exists

**Stale queue entries** reference work directories that don't exist.

### 4. Check Backlog Consistency

Parse `backlog.md`:
- For each item: check if `.agents/work/{slug}/definition.md` exists (optional for backlog items)
- Items in backlog don't require work directories until queued

### 5. Check Completed Items

Parse `completed.md`:
- For each completed item: verify it exists in `.agents/archive/{slug}/` OR `.agents/archive/work/{slug}/`
- Items in completed.md should be archived

**Unarchived completed items** are in completed.md but not in archive.

### 6. Check Workflow State

Read `.agents/workflow.json`:
- If `currentWorkItem` is set, verify `.agents/work/{currentWorkItem}/` exists
- If `currentPhase` is set but `currentWorkItem` is null, this is inconsistent

### 7. Check Archive Integrity

List all directories in `.agents/archive/`:
- Verify each archived work item has at least a `definition.md` or `report.md`
- Check that archived items appear in `completed.md` or `.agents/archive/index.md`

### 8. Check for Stale Research/Plans (Legacy)

Old workflows may have left files in:
- `.agents/research/*.md` (should be in work directories now)
- `.agents/plans/*.md` (should be in work directories now)

These are candidates for cleanup or migration.

## Output

```
╔══════════════════════════════════════════════════════════════╗
║                        JANITOR SCAN                           ║
╚══════════════════════════════════════════════════════════════╝

📁 Directory Structure
   ✓ .agents/work/ exists
   ✓ .agents/archive/ exists
   ✓ .agents/context/ exists
   ✓ workflow.json exists

🔍 Work Directory Scan
   Found 3 work directories

   ✓ auth-system (in queue: In Progress)
   ✓ user-profile (in queue: Up Next)
   ⚠ old-feature (ORPHANED - not in backlog or queue)

📋 Queue Consistency
   ✓ In Progress: 1 item, all valid
   ✓ Up Next: 1 item, all valid

📦 Backlog Consistency
   ✓ High Priority: 2 items
   ✓ Medium Priority: 3 items
   ✓ Low Priority: 1 item

✅ Completed Items
   ✓ 2 items in completed.md
   ⚠ payment-system - NOT ARCHIVED (should be in .agents/archive/)

🔄 Workflow State
   ✓ currentWorkItem: auth-system (exists)
   ✓ currentPhase: GREEN

📂 Archive Integrity
   ✓ 5 archived items found
   ✓ All archived items have required files

📜 Legacy Files
   ⚠ Found 2 files in .agents/research/ (legacy location)
   ⚠ Found 1 file in .agents/plans/ (legacy location)

─────────────────────────────────────────────────────────────────

SUMMARY
═══════
Issues Found: 4
  - 1 orphaned work directory
  - 1 unarchived completed item
  - 3 legacy files

Run /janitor --fix to automatically resolve these issues.
```

## Fix Mode

When run with `--fix` argument:

### Fix Orphaned Work Directories

For each orphaned work directory:
1. Check if it has a `report.md` (indicates completed work)
   - If yes: Archive it to `.agents/archive/{slug}/`
   - Update completed.md and archive/index.md
2. If no report.md but has definition.md:
   - Add to backlog.md under "## Medium Priority"
3. If neither:
   - Ask user before deletion

### Fix Unarchived Completed Items

For each item in completed.md without archive:
1. Check if `.agents/work/{slug}/` exists
   - If yes: Move to `.agents/archive/{slug}/`
2. If work directory doesn't exist:
   - Note in completed.md that archive is missing

### Fix Stale Queue Entries

For each stale queue entry:
1. Remove from queued.md
2. Log the removal

### Fix Workflow State

If workflow.json is inconsistent:
1. If currentWorkItem doesn't exist, set to null
2. If currentPhase is set but currentWorkItem is null, set currentPhase to null

### Fix Legacy Files

For files in legacy locations:
1. If they correspond to an existing work item, suggest moving
2. If orphaned, move to `.agents/archive/legacy/`

## Output (Fix Mode)

```
╔══════════════════════════════════════════════════════════════╗
║                     JANITOR CLEANUP                           ║
╚══════════════════════════════════════════════════════════════╝

🧹 Fixing Issues...

1. Orphaned work directory: old-feature
   ✓ Found report.md - work was completed
   ✓ Moved to .agents/archive/old-feature/
   ✓ Added entry to completed.md
   ✓ Updated archive/index.md

2. Unarchived completed item: payment-system
   ✓ Found in .agents/work/payment-system/
   ✓ Moved to .agents/archive/payment-system/
   ✓ Updated archive/index.md

3. Legacy files
   ✓ Moved .agents/research/old-research.md to .agents/archive/legacy/
   ✓ Moved .agents/plans/old-plan.md to .agents/archive/legacy/

─────────────────────────────────────────────────────────────────

✓ All issues resolved!
✓ Committed: chore(agents): clean up stale files
```

## Safety

- Never deletes files without explicit user confirmation
- Creates backups before moving files (to `.agents/archive/`)
- All fixes are non-destructive
- Dry-run (default) shows what would be done without making changes

## Notes

- This command should be run periodically to keep .agents clean
- Especially useful after interrupted workflows
- Can be run in CI/CD to verify .agents integrity

## Git Integration

After fixes are applied:
1. Stage all changed files in .agents/
2. Commit with message: `chore(agents): clean up stale files`
