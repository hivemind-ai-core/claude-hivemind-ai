# Workflow Artifacts

Each work item has a dedicated directory with all its artifacts.

## Why Artifacts Matter

1. **Context Management** - Pass information between phases via files, not memory
2. **Resumability** - Work can resume after interruption
3. **Audit Trail** - Decisions are documented and traceable
4. **Fresh Context** - Each phase agent starts clean by reading files

## Work Item Directory Structure

All artifacts for a work item live in `.agents/work/{slug}/`:

```
.agents/work/{slug}/
├── definition.md       # Work item description and acceptance criteria
├── research.md         # Master research (from work-research agent)
├── red-plan.md         # RED phase test plan
├── green-plan.md       # GREEN phase implementation plan
├── refactor-plan.md    # REFACTOR phase refactoring plan
└── report.md           # Combined phase results
```

## Artifact Flow

```
work-research writes research.md
    ↓
rpi(phase=red) reads research.md → writes red-plan.md → updates report.md
    ↓
rpi(phase=green) reads red-plan.md → writes green-plan.md → updates report.md
    ↓
rpi(phase=refactor) reads green-plan.md → writes refactor-plan.md → updates report.md
    ↓
archive-work moves .agents/work/{slug}/ → .agents/archive/{slug}/
```

## Definition Format

Created by `/backlog` or `/queue-add` commands:

```markdown
# Work Item: {slug}

## Description
{what needs to be done}

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Priority
{high|medium|low}

## Notes
{any additional context}
```

## Research Format

Created by `work-research` agent:

```markdown
# Research: {slug}

## Work Item
{description from definition.md}

## Scope
- Estimated tests: N
- Files to modify: [list]
- New files needed: [list]

## Requirements
From spec:
- Requirement 1
- Requirement 2

## Architecture Context
- Relevant system: X
- Integration points: Y

## Existing Code Patterns
- Pattern found in src/X
- Similar implementation in src/Y

## Risks
- Risk 1 (mitigation)

## Approach
Brief recommended approach.

## Test Cases
High-level test scenarios:
1. Test case 1
2. Test case 2
```

## Plan Format

Created by `rpi` agent for each phase:

```markdown
# {Phase} Plan: {slug}

## Overview
- {phase-specific summary}

## Steps

### Step 1: {Description}
- File: {path}
- Action: {create|modify}
- Details: {what to do}

### Step 2: {Description}
...

## Verification Checklist
- [ ] Verification criterion 1
- [ ] Verification criterion 2
```

## Report Format

Updated by `rpi` agent after each phase:

```markdown
# Report: {slug}

## RED Phase
**Completed**: {timestamp}
**Status**: success

### Tests Created
- test 1
- test 2

### Files
- path/to/test.ts

---

## GREEN Phase
**Completed**: {timestamp}
**Status**: success

### Implementation
- Created X
- Modified Y

### Integration
- Integrated into: {path}

---

## REFACTOR Phase
**Completed**: {timestamp}
**Status**: success

### Changes
- Refactoring 1
- Refactoring 2
```

## Archive Structure

After work item completes:

```
.agents/archive/
├── index.md              # List of all archived work items
├── {slug}/               # Archived work item (moved from .agents/work/{slug}/)
│   ├── definition.md
│   ├── research.md
│   ├── red-plan.md
│   ├── green-plan.md
│   ├── refactor-plan.md
│   └── report.md
└── ...
```

## Token Budgets

| Artifact | Target Size | Notes |
|----------|-------------|-------|
| definition.md | ~500 tokens | Concise description + criteria |
| research.md | ~3-5k tokens | Point to sources, don't duplicate |
| *-plan.md | ~2-3k tokens | Concise steps, details from reading files |
| report.md | ~1k tokens per phase | Summary, not exhaustive |

## Key Principles

1. **One directory per work item** - All artifacts together
2. **Files over memory** - Write to disk, reference by path
3. **Small outputs** - Agents return summaries, not full content
4. **Clean up on archive** - Move completed work to archive
