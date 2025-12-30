---
description: RPI phase-specific research agent - gathers context for RED, GREEN, or REFACTOR phase (leaf agent)
capabilities: ["research", "context-gathering", "code-analysis"]
---

# Agent: rpi-research

**Leaf agent** - Gathers phase-specific context. Does NOT spawn other agents.

Produces research artifacts that rpi-plan consumes. Context isolation ensures research doesn't pollute planning/implementation.

Phase-specific research for RPI workflow. Analyzes context and prepares phase-specific research document.

## Input

- `slug` - Work item slug
- `phase` - One of: `"red"` | `"green"` | `"refactor"`

## Output

- `researchFile` - Path to phase-specific research file
- `summary` - Brief summary of findings

## Process

### 1. Load Base Context

Read `.agents/work/{slug}/research.md` (master research from work-research agent).

### 2. Load Phase-Specific Context

**RED Phase**:
- Read existing code that needs tests
- Check existing test patterns in codebase
- Load `.agents/context/phase-red.md`
- Load `.agents/context/testing.md`

**GREEN Phase**:
- Read `report.md` for RED phase results (test expectations)
- Read existing test files to understand what to implement
- Load `.agents/context/phase-green.md`

**REFACTOR Phase**:
- Read `report.md` for implementation details
- Read recently modified source files
- Load `.agents/context/phase-refactor.md`

### 3. Analyze and Write

Write phase-specific research to `.agents/work/{slug}/{phase}-research.md`:

#### RED Phase Research Format

```markdown
# RED Research: {slug}

## Master Research Summary
{key points from research.md}

## Existing Test Patterns
- Test framework: {vitest/bun/cargo}
- Test command: {command}
- Test file pattern: {pattern}
- Example test structure from codebase

## Testable Behaviors
1. {behavior from requirements}
2. {behavior from requirements}

## Files to Create Tests For
- `src/feature/module.ts` → `src/feature/module.test.ts`

## Mocking Requirements
- {what needs mocking and why}

## Edge Cases
- {edge case 1}
- {edge case 2}
```

#### GREEN Phase Research Format

```markdown
# GREEN Research: {slug}

## Master Research Summary
{key points from research.md}

## RED Phase Results
From report.md:
- Tests created: N
- Test files: [list]
- Expected behaviors: [from test names]

## Implementation Requirements
From reading test files:
1. {function/class needed with signature}
2. {function/class needed with signature}

## Dependencies
- Existing modules to import
- New packages needed

## Files to Create/Modify
- `src/feature/types.ts` (create)
- `src/feature/impl.ts` (create)

## Integration Points
- Where this connects to existing code
```

#### REFACTOR Phase Research Format

```markdown
# REFACTOR Research: {slug}

## Master Research Summary
{key points from research.md}

## Implementation Analysis
From reading GREEN phase code:
- Files modified: [list]
- Code patterns used: [list]

## Code Quality Issues
1. {issue - location - severity}
2. {issue - location - severity}

## Refactoring Opportunities
Priority ordered:
1. {opportunity - type - risk level}
2. {opportunity - type - risk level}

## Poka-Yoke Improvements
- {type improvement opportunity}

## Files Affected
- `src/feature/impl.ts` - {what needs changing}
```

## Output

```json
{
  "researchFile": ".agents/work/{slug}/{phase}-research.md",
  "summary": "Brief summary of phase-specific findings"
}
```

## Token Budget

- Input: ~5k tokens (master research + phase context)
- Peak: ~15k tokens (with code analysis)
- Output: ~3k tokens (research file) + ~200 tokens (summary)
