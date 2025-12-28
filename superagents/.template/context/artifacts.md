# Workflow Artifacts

Each workflow phase produces artifacts stored in `.agents/`. These MUST be created regardless of how work is initiated.

## Why Artifacts Matter

1. **Context Management** - Pass information between phases via files, not memory
2. **Resumability** - Work can resume after interruption
3. **Audit Trail** - Decisions are documented and traceable
4. **Fresh Context** - Each phase can start clean by reading files

## Artifact Locations

| Directory | Purpose | When Created |
|-----------|---------|--------------|
| `.agents/research/` | Research findings, analysis | Before RED phase |
| `.agents/plans/` | Implementation plans | Before each phase |
| `.agents/work/` | Active work state | During work |

## Naming Convention

```
.agents/research/{work-item-slug}.md     # Research for work item
.agents/plans/{work-item-slug}-red.md    # RED phase plan
.agents/plans/{work-item-slug}-green.md  # GREEN phase plan
.agents/plans/{work-item-slug}-refactor.md # REFACTOR phase plan
.agents/work/{work-item-slug}/           # Work-in-progress artifacts
```

## Artifact Flow

```
Research → .agents/research/{slug}.md
    ↓
RED reads research → writes .agents/plans/{slug}-red.md
    ↓
GREEN reads research + red plan → writes .agents/plans/{slug}-green.md
    ↓
REFACTOR reads all above → writes .agents/plans/{slug}-refactor.md
```

## Research Artifact Format

```markdown
# Research: {work-item-name}

## Scope
- Estimated tests: N
- Files to modify: [list]

## Requirements
From spec section X:
- Requirement 1
- Requirement 2

## Relevant Patterns
- Pattern A (why relevant)

## Risks
- Risk 1 (mitigation)

## Approach
Brief recommended approach.
```

## Plan Artifact Format

```markdown
# {Phase} Plan: {work-item-name}

## Files to Create/Modify
- path/to/file.ts (create|modify)

## Steps

### Step 1: Description
```code
Code to write or change
```

### Step 2: Description
...

## Verification
- [ ] Verification criterion 1
- [ ] Verification criterion 2
```

## Index Files

Each directory has an `index.md` for fast agent navigation:

```markdown
# Directory Index

filename.md -- Short description -- tag1, tag2, tag3
another.md -- Another description -- tag4, tag5
```

## Keeping Artifacts Clean

- Delete research/plan files after work item complete
- Archive important learnings to `.agents/patterns/` or `.agents/mistakes/`
- Update index.md files when adding/removing files

## Token Budgets

Standardized limits for all workflow components:

| Artifact | Target Size | Notes |
|----------|-------------|-------|
| **Research file** | ~3-5k tokens | Focus on requirements, file paths, risks. Point to sources, don't duplicate. |
| **Plan file** | ~3-5k tokens | Concise steps. Detailed code comes from reading files during execution. |
| **Agent output** | ~500-1k tokens | Summary object only. Details are in saved files. |

| Agent Phase | Input Budget | Peak Usage | Output |
|-------------|--------------|------------|--------|
| explore-context | ~5k (todo + spec refs) | ~15k | ~500 bytes + research file |
| plan | ~8k (research + phase context) | ~15k | ~500 bytes + plan file |
| execute-red | ~8k (research + test context) | ~25k | ~1k summary |
| execute-green | ~8k (research + red plan) | ~30k | ~1k summary |
| execute-refactor | ~8k (research + green plan) | ~25k | ~1k summary |
| verify-results | ~2k (test command) | ~5k | ~500 bytes |

### Why These Limits?

1. **Fresh context per phase** - Each phase starts clean, reads from files
2. **Small outputs** - Pass file paths, not content
3. **Disk is cheap** - Write to files, reference by path
4. **Total under 40k** - Keep well below model limits for response room
