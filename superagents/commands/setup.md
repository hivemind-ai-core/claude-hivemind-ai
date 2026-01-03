---
description: Initialize the superagents RPI workflow for this project
---

# /setup Command

Initialize or upgrade the superagents RPI workflow for this project.

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Fresh Install** | No `.agents/` directory | Create full structure from templates |
| **Upgrade** | `.agents/` exists, version < plugin version | Add missing files, update context files |
| **Repair** | `.agents/` exists, validation fails (including missing template files) | Fix invalid files, restore missing required files |
| **Already Current** | `.agents/` exists, version = plugin version, ALL template files present | Report status, no changes |

**Note:** Validation includes comparing project files against actual template contents. If any template file is missing from the project, validation fails and Repair mode is triggered—even if versions match.

## Process

### 1. Check Current State

```
1. Read plugin version from superagents/.claude-plugin/plugin.json
2. Check if .agents/ directory exists
3. If exists, read .agents/workflow.json for installed version
4. Run validation checks
5. Determine mode: fresh | upgrade | repair | current
```

### 2. Validation Checks

Run these checks and report results:

#### Directory Structure
```
Required directories (must exist):
  .agents/
  .agents/context/
  .agents/patterns/
  .agents/mistakes/
  .agents/work/                  # Queue files and work item directories
  .agents/archive/               # Archived completed work items
  architecture/
  architecture/diagrams/
  spec/
  spec/diagrams/

Legacy directories (for migration):
  .agents/todos/                 # Old todo.md location (migrated to .agents/work/)
  .agents/research/              # Old research location (migrated to .agents/work/<slug>/)
  .agents/plans/                 # Old plans location (migrated to .agents/work/<slug>/)
```

#### Required Files (must exist and be valid)

**IMPORTANT: Validate dynamically against actual template contents, not a hardcoded list.**

For each file in `.template/`:
1. Determine the corresponding destination path (see Template Reference section)
2. Check if the destination file exists in the project
3. If missing, report as validation failure and trigger repair/sync

Core files that must always be validated:
```
.agents/workflow.json        # Must be valid JSON with required fields
.agents/ROADMAP.md           # Must exist (can be empty template)
```

Dynamic validation (compare against actual template files):
```
For each file in .template/context/*:
  Check: .agents/context/<filename> exists

For each file in .template/work/*:
  Check: .agents/work/<filename> exists

For each file in .template/archive/*:
  Check: .agents/archive/<filename> exists (excluding work/ subdirs)

For each file in .template/patterns/*:
  Check: .agents/patterns/<filename> exists

For each file in .template/mistakes/*:
  Check: .agents/mistakes/<filename> exists
```

This ensures new template files are automatically detected and copied during validation, regardless of version number.

#### File Format Validation
```
workflow.json:
  - Must be valid JSON
  - Must have: version, projectInitialized, currentPhase, currentWorkItem
  - version must be semver format (x.y.z)

index.md files:
  - Must have header line starting with #
  - Format: <filename> -- <description> -- <tags>

Context files (phase-*.md):
  - Must have # header
  - Must have ## sections
```

### 3. Fresh Install

When `.agents/` doesn't exist:

1. **Create all directories** from Required Directories list
2. **Copy template files** from `.template/`:
   - All context files
   - workflow.json (set version to plugin version)
   - ROADMAP.md template
   - All index.md files
3. **Create architecture/README.md and spec/README.md**
4. **Update or create CLAUDE.md** with RPI workflow rules
5. **Create .gitkeep files** in diagram directories

### 4. Upgrade

When `.agents/` exists and installed version < plugin version:

1. **Preserve user data** (never modify):
   - `.agents/research/*.md` (except index.md)
   - `.agents/plans/*.md` (except index.md)
   - `.agents/work/*`
   - `.agents/patterns/*.md` (except index.md)
   - `.agents/mistakes/*.md` (except index.md)
   - `.agents/archive/*`
   - `.agents/todos/todo.md` content
   - `.agents/ROADMAP.md` content

2. **Add missing directories** from Required Directories list

3. **Sync all template files** (copy missing, replace context files):
   - For each file in `.template/context/*`: copy to `.agents/context/` (add missing OR replace existing)
   - For each file in `.template/work/*`: copy if missing (don't replace user content)
   - For each file in `.template/archive/*`: copy if missing
   - For each file in `.template/patterns/*`: copy index.md if missing
   - For each file in `.template/mistakes/*`: copy index.md if missing

   **This ensures any new template files are automatically synced, not just hardcoded ones.**

4. **Migrate workflow.json**:
   - Preserve: currentPhase, currentWorkItem, completedItems, stats
   - Update: version to plugin version
   - Add any new required fields with defaults

5. **Update CLAUDE.md** with latest RPI rules (append if exists)

6. **Report changes**:
   - Files added
   - Files updated
   - Version change

### 5. Repair

When validation fails:

1. **Fix invalid JSON files** by recreating from template (with warning)
2. **Recreate missing required files** from templates
3. **Add missing directories**
4. **Report what was repaired**

### 6. Version Migration

Handle schema changes between versions:

#### 1.0.0 → 1.0.1
- Add `stats` field if missing:
  ```json
  "stats": {
    "totalWorkItems": 0,
    "completedWorkItems": 0,
    "totalTests": 0,
    "passingTests": 0
  }
  ```
- Add `initializedAt` field if missing (set to null)
- Add `workUntil` field if missing (set to null)
- Add `workItemStartedAt` field if missing (set to null)
- Update CLAUDE.md with `<!-- superagents:1.1.1 -->` version marker

#### CLAUDE.md Version Detection
The CLAUDE.md file contains a version marker comment:
```html
<!-- superagents:1.1.1 -->
```

During upgrade:
1. Search for `<!-- superagents:` in existing CLAUDE.md
2. If found, extract version and compare
3. If older or missing, replace the RPI Workflow section with latest template
4. If not found, append the RPI Workflow section

#### 1.0.1 → 1.1.1 (Queue System Migration)

**Directory structure changes:**
- Create `.agents/work/backlog.md`, `queued.md`, `completed.md`
- Work items now stored in `.agents/work/<slug>/` directories

**Migration from old structure:**
1. For each item in `.agents/todos/todo.md`:
   - Create `.agents/work/<slug>/` directory
   - Create `definition.md` with item description
   - If `.agents/research/<slug>.md` exists, move to `.agents/work/<slug>/research.md`
   - If `.agents/plans/<slug>-*.md` exists, move to `.agents/work/<slug>/<phase>-plan.md`
2. Populate queue files:
   - Items in "In Progress" → `.agents/work/queued.md` under "## In Progress"
   - Items in "Up Next" → `.agents/work/queued.md` under "## Up Next"
3. Remove `workUntil` field from workflow.json (replaced by queue)
4. Archive old directories (keep for reference but stop using)

**New commands:**
- `/backlog` - Add work items interactively
- `/queue-add` - Move from backlog to queue
- `/queue-status` - Show queue state

**Removed:**
- `/work-until` command (replaced by queue system)

#### Future migrations
Document here as versions are released.

## Output

### Fresh Install
```
Superagents RPI Workflow Setup
==============================
Mode: Fresh Install
Plugin Version: 1.1.1

Creating directory structure...
✓ Created .agents/ (14 directories)
✓ Created architecture/ (2 directories)
✓ Created spec/ (2 directories)

Creating files...
✓ Created context files (6 files)
✓ Created index files (12 files)
✓ Created workflow.json (v1.1.1)
✓ Created ROADMAP.md template
✓ Created todo.md template
✓ Created done.md
✓ Updated CLAUDE.md with RPI rules

Setup complete!

Next steps:
1. Add your requirements to spec/*.md
2. Run /update-roadmap to generate todos
3. Run /work to start implementing
```

### Upgrade
```
Superagents RPI Workflow Setup
==============================
Mode: Upgrade
Installed: 1.0.1 → Plugin: 1.1.1

Checking structure...
✓ All directories present

Upgrading files...
✓ Updated context/phase-research.md
✓ Updated context/phase-red.md
✓ Updated context/phase-green.md
✓ Updated context/phase-refactor.md
✓ Updated context/artifacts.md
✓ Migrated workflow.json (added stats field)
✓ Updated CLAUDE.md with latest RPI rules

Preserved (not modified):
- 3 research files
- 5 plan files
- 2 patterns
- 1 mistake
- todo.md content

Upgrade complete! Now at v1.1.1
```

### Repair
```
Superagents RPI Workflow Setup
==============================
Mode: Repair
Plugin Version: 1.1.1

Validation Results:
✗ .agents/workflow.json - Invalid JSON
✗ .agents/context/phase-green.md - Missing
✗ .agents/archive/plans/ - Missing directory

Repairing...
✓ Recreated workflow.json (preserved currentWorkItem: auth-system)
✓ Recreated context/phase-green.md from template
✓ Created .agents/archive/plans/

Repair complete!

Warning: workflow.json was recreated. Review .agents/workflow.json
to ensure state is correct.
```

### Already Current
```
Superagents RPI Workflow Setup
==============================
Mode: Validation
Plugin Version: 1.1.1

Validation Results:
✓ All 18 required directories present
✓ All 12 required files present
✓ workflow.json valid (v1.1.1)
✓ All context files valid
✓ All index files valid

Status: Already up to date. No changes needed.

Current state:
- Work item: auth-system (phase: green)
- Completed: 3 items
- Pending: 5 items
```

## Template Reference

Templates are in `superagents/.template/`. Copy these during setup:

| Template | Destination |
|----------|-------------|
| `.template/CLAUDE.md` | Append to project CLAUDE.md |
| `.template/workflow.json` | `.agents/workflow.json` |
| `.template/ROADMAP.md` | `.agents/ROADMAP.md` |
| `.template/context/*.md` | `.agents/context/*.md` |
| `.template/work/backlog.md` | `.agents/work/backlog.md` |
| `.template/work/queued.md` | `.agents/work/queued.md` |
| `.template/work/completed.md` | `.agents/work/completed.md` |
| `.template/work/index.md` | `.agents/work/index.md` |
| `.template/patterns/index.md` | `.agents/patterns/index.md` |
| `.template/mistakes/index.md` | `.agents/mistakes/index.md` |
| `.template/spec/README.md` | `spec/README.md` |
| `.template/spec/index.md` | `spec/index.md` |
| `.template/architecture/README.md` | `architecture/README.md` |
| `.template/architecture/index.md` | `architecture/index.md` |

## Error Handling

| Error | Action |
|-------|--------|
| Template file missing | Report error, cannot proceed |
| Permission denied | Report error with specific path |
| Invalid JSON (repair mode) | Backup to `.backup/`, recreate from template |
| Conflict (user file vs template) | Preserve user file, report skipped |

## Flags

The command supports these optional behaviors (implement as needed):

| Flag | Effect |
|------|--------|
| `--force` | Overwrite context files even if customized |
| `--dry-run` | Show what would change without modifying |
| `--validate-only` | Run validation, report results, no changes |
