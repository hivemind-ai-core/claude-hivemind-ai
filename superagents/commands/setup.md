---
description: Initialize the superagents RPI workflow for this project
---

# /setup Command

Initialize the superagents RPI workflow for this project.

## What This Command Does

1. **Creates .agents directory structure** with contexts, workflows, patterns, and mistakes
2. **Creates architecture/ and spec/ directories** for documentation and requirements
3. **Sets up index.md files** in key directories for fast agent navigation
4. **Updates CLAUDE.md** with RPI workflow rules
5. **Configures the workflow** from spec → todos → work → architecture

## Process

### 1. Create Directory Structure

Create the following directories and files:

```
.agents/
├── ROADMAP.md               # Generated from spec (template)
├── workflow.json            # Current workflow state
├── context/                 # Phase-specific guidance
│   ├── index.md            # Index of context files
│   ├── phase-research.md
│   ├── phase-red.md
│   ├── phase-green.md
│   ├── phase-refactor.md
│   ├── testing.md
│   └── artifacts.md
├── patterns/               # Successful patterns (indexed)
│   └── index.md
├── mistakes/               # Mistakes to avoid (indexed)
│   └── index.md
├── research/               # Research artifacts
│   └── index.md
├── plans/                  # Execution plans
│   └── index.md
├── todos/                  # Work items
│   ├── index.md
│   └── todo.md
└── work/                   # Active work files
    └── index.md

architecture/               # Implementation documentation
├── index.md               # Architecture index
└── README.md              # Architecture overview

spec/                      # Requirements (source of truth)
├── index.md              # Spec index
└── README.md             # How to write specs
```

### 2. Create Index Files

Each directory should have an `index.md` with format:
```markdown
# Directory Index

<filename> -- <short description> -- <comma separated list of tags>

## Example
phase-red.md -- RED phase TDD instructions -- testing, tdd, red, tests
phase-green.md -- GREEN phase implementation -- implementation, tdd, green, code
```

### 3. Create Context Files

Create phase context files based on templates in `.template/`:

**phase-research.md**: Research phase guidance
**phase-red.md**: RED phase TDD (write failing tests)
**phase-green.md**: GREEN phase (implement to pass tests)
**phase-refactor.md**: REFACTOR phase (improve code)
**testing.md**: Testing conventions
**artifacts.md**: Artifact creation guidelines

### 4. Initialize Workflow State

Create `.agents/workflow.json`:
```json
{
  "currentPhase": null,
  "currentWorkItem": null,
  "lastUpdated": "<timestamp>",
  "completedItems": [],
  "projectInitialized": true
}
```

### 5. Update CLAUDE.md

If CLAUDE.md exists, append the RPI workflow rules. If not, create it.

**CLAUDE.md content to add:**

```markdown
# RPI Workflow

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

## Workflow

```
/work → research → RED → GREEN → REFACTOR → architecture
                    ↓       ↓         ↓
                 tests   one test   one change
                 fail    at a time  at a time
```

## Phase Rules

| Phase | Flow | Gate |
|-------|------|------|
| RESEARCH | Read spec, code, architecture | Research artifact written |
| RED | Write 1-5 tests for work item | Tests fail correctly |
| GREEN | Pass one test, then next | 100% pass, zero type errors, integrated |
| REFACTOR | One change, verify, next | 100% pass, zero type errors |

## Key Files

| Purpose | Path |
|---------|------|
| Current work | `.agents/todos/todo.md` |
| Research artifacts | `.agents/research/` |
| Phase plans | `.agents/plans/` |
| Phase guidance | `.agents/context/phase-*.md` |
| Patterns | `.agents/patterns/` |
| Mistakes to avoid | `.agents/mistakes/` |
| Requirements | `spec/` |
| Architecture | `architecture/` |

## Commands

- `/work` - Execute RPI workflow for next todo
- `/update-roadmap` - Generate roadmap from spec
- `/project-status` - Show current state
- `/fix-tests` - Systematic test repair
```

### 6. Create Starter Spec

Create `spec/README.md` with guidance on writing specs:

```markdown
# Specifications

This directory contains the source of truth for project requirements.

## How to Write Specs

Create markdown files describing your requirements:
- `requirements.md` - Functional requirements
- `api.md` - API specifications
- `database.md` - Data model requirements
- `ui.md` - UI/UX requirements

## Spec Format

```markdown
# Feature Name

## Overview
Brief description of the feature.

## Requirements

### REQ-001: Requirement Name
- **Priority**: High/Medium/Low
- **Description**: Detailed description
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2

### REQ-002: Another Requirement
...
```

## After Writing Specs

Run `/update-roadmap` to:
1. Analyze spec files
2. Generate roadmap chunks
3. Create todo items
```

### 7. Create Architecture README

Create `architecture/README.md`:

```markdown
# Architecture

This directory documents the implemented architecture.

## Overview

Architecture docs are updated AFTER implementation, reflecting what actually exists.

## Structure

- `index.md` - Index of all architecture files
- `*.md` - Individual system/component documentation

## Format

```markdown
# System Name

## Status
Implemented | Planned | Deprecated

## Files
- `src/path/file.ts` - Description

## Description
How this system works.

## Dependencies
- Other systems this depends on

## API
Key interfaces and functions.
```

## Updating Architecture

Architecture is updated automatically by the `/work` command after each feature is complete.
```

## Output

Display progress:

```
Setting up Superagents RPI workflow...

✓ Created .agents/ directory structure
✓ Created context files (6 files)
✓ Created index files (8 files)
✓ Initialized workflow.json
✓ Created architecture/ directory
✓ Created spec/ directory
✓ Updated CLAUDE.md with RPI rules

Superagents setup complete!

Next steps:
1. Add your requirements to spec/*.md
2. Run /update-roadmap to generate todos
3. Run /work to start implementing

Available commands:
- /work - Execute RPI workflow
- /update-roadmap - Generate roadmap from spec
- /project-status - Show current state
- /fix-tests - Fix failing tests
```

## File Templates

Use the templates in `.template/` directory to create the context and index files. The templates provide the complete content for each file.
