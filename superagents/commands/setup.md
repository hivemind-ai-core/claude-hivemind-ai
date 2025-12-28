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
| **Repair** | `.agents/` exists, validation fails | Fix invalid files, restore missing required files |
| **Already Current** | `.agents/` exists, version = plugin version, valid | Report status, no changes |

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
  .agents/research/
  .agents/plans/
  .agents/plans/diagrams/
  .agents/todos/
  .agents/work/
  .agents/archive/
  .agents/archive/research/
  .agents/archive/plans/
  .agents/archive/work/
  architecture/
  architecture/diagrams/
  spec/
  spec/diagrams/
```

#### Required Files (must exist and be valid)
```
.agents/workflow.json        # Must be valid JSON with required fields
.agents/ROADMAP.md           # Must exist (can be empty template)
.agents/context/index.md     # Must exist
.agents/context/phase-research.md
.agents/context/phase-red.md
.agents/context/phase-green.md
.agents/context/phase-refactor.md
.agents/context/testing.md
.agents/context/artifacts.md
.agents/todos/todo.md        # Must exist
.agents/archive/done.md      # Must exist
```

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

3. **Update context files** (replace with latest templates):
   - `.agents/context/phase-*.md`
   - `.agents/context/testing.md`
   - `.agents/context/artifacts.md`

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
- Update CLAUDE.md with `<!-- superagents:1.0.1 -->` version marker

#### CLAUDE.md Version Detection
The CLAUDE.md file contains a version marker comment:
```html
<!-- superagents:1.0.1 -->
```

During upgrade:
1. Search for `<!-- superagents:` in existing CLAUDE.md
2. If found, extract version and compare
3. If older or missing, replace the RPI Workflow section with latest template
4. If not found, append the RPI Workflow section

#### Future migrations
Document here as versions are released.

## Output

### Fresh Install
```
Superagents RPI Workflow Setup
==============================
Mode: Fresh Install
Plugin Version: 1.0.1

Creating directory structure...
✓ Created .agents/ (14 directories)
✓ Created architecture/ (2 directories)
✓ Created spec/ (2 directories)

Creating files...
✓ Created context files (6 files)
✓ Created index files (12 files)
✓ Created workflow.json (v1.0.1)
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
Installed: 1.0.0 → Plugin: 1.0.1

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

Upgrade complete! Now at v1.0.1
```

### Repair
```
Superagents RPI Workflow Setup
==============================
Mode: Repair
Plugin Version: 1.0.1

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
Plugin Version: 1.0.1

Validation Results:
✓ All 18 required directories present
✓ All 12 required files present
✓ workflow.json valid (v1.0.1)
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
| `.template/todos/todo.md` | `.agents/todos/todo.md` |
| `.template/archive/done.md` | `.agents/archive/done.md` |
| `.template/patterns/index.md` | `.agents/patterns/index.md` |
| `.template/mistakes/index.md` | `.agents/mistakes/index.md` |
| `.template/research/index.md` | `.agents/research/index.md` |
| `.template/plans/index.md` | `.agents/plans/index.md` |
| `.template/work/index.md` | `.agents/work/index.md` |
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
