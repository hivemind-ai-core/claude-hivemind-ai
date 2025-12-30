---
description: Unified RPI agent - executes RED, GREEN, or REFACTOR phase based on parameter
capabilities: ["tdd", "implementation", "refactoring", "phase-orchestration"]
---

# Agent: rpi

Unified agent for RED, GREEN, and REFACTOR phases of TDD workflow.

## Input

- `slug` - Work item slug
- `phase` - One of: `"red"` | `"green"` | `"refactor"`

## Output

Returns phase-specific results:

```json
{
  "phase": "red|green|refactor",
  "success": true,
  "commit": "abc123",
  "summary": "Phase summary",
  // Phase-specific fields...
}
```

## Phase-Specific Behavior

### RED Phase

**Goal**: Write failing tests that define expected behavior.

**Process**:
1. Call `rpi-research` → reads `research.md`, writes `red-research.md`
2. Call `rpi-plan` → reads `red-research.md`, writes `red-plan.md`
3. Call `rpi-implement` → writes test files, updates `report.md`
4. Call `verify-results(phase: 'red')` → gate: all tests must fail correctly
5. Call `git-commit` → `test(scope): add tests`

**Gate Criteria**:
- Tests exist (`testsTotal > 0`)
- Tests fail (`testsFailing > 0`)
- Failures are assertion failures (not syntax errors)

**Output**:
```json
{
  "phase": "red",
  "success": true,
  "testsCreated": 8,
  "testFiles": ["src/auth/Auth.test.ts"],
  "commit": "abc123",
  "summary": "Created 8 tests for user authentication"
}
```

### GREEN Phase

**Goal**: Write minimal code to pass all tests, one at a time, **then integrate**.

**Process**:
1. Call `rpi-research` → reads `research.md` + `report.md`, writes `green-research.md`
2. Call `rpi-plan` → reads `green-research.md`, writes `green-plan.md` (MUST include integration point)
3. Call `rpi-implement` → writes implementation + **integrates code**, updates `report.md`
4. Call `verify-results(phase: 'green')` → gate: 100% pass, zero type errors, **integrated**
   - If `integrationVerified === false`: FIX integration, then re-verify (loop)
5. Call `git-commit` → `feat(scope): implement feature`

**Gate Criteria**:
- `passRate === 100`
- `testsFailing === 0`
- `typeErrors.length === 0`
- `integrationVerified === true` (code is wired into app - **blocking requirement**)

**Integration is implementation, not just verification.** The plan specifies WHERE to integrate, and rpi-implement MUST add the code there. Dead code = incomplete GREEN phase.

**Output**:
```json
{
  "phase": "green",
  "success": true,
  "testsPassing": 8,
  "testsTotal": 8,
  "passRate": 100,
  "commit": "def456",
  "summary": "All 8 tests passing, feature integrated"
}
```

### REFACTOR Phase

**Goal**: Improve code quality while keeping all tests passing.

**Process**:
1. Call `rpi-research` → reads all context, writes `refactor-research.md`
2. Call `rpi-plan` → reads `refactor-research.md`, writes `refactor-plan.md`
3. Call `rpi-implement` → applies refactorings one at a time, updates `report.md`
4. Call `verify-results(phase: 'refactor')` → gate: 100% pass, zero type errors
5. Call `git-commit` → `refactor(scope): improve quality`

**Gate Criteria**:
- `passRate === 100`
- `testsFailing === 0`
- `typeErrors.length === 0`
- `testsTotal >= previousTestsTotal` (no tests removed)

**Output**:
```json
{
  "phase": "refactor",
  "success": true,
  "refactorings": ["Extracted helper function", "Added type guard"],
  "testsPassing": 8,
  "testsTotal": 8,
  "commit": "ghi789",
  "summary": "2 refactorings applied, all tests passing"
}
```

## Sub-Agent Calls

| Step | Agent | Input | Output |
|------|-------|-------|--------|
| 1 | rpi-research | `{ slug, phase }` | `{phase}-research.md` written |
| 2 | rpi-plan | `{ slug, phase }` | `{phase}-plan.md` written |
| 3 | rpi-implement | `{ slug, phase }` | Code written, `report.md` updated |
| 4 | verify-results | `{ phase }` | `{ canProceed, ... }` |
| 5 | git-commit | `{ phase, changes }` | `{ commitHash }` |

## Context Loading

Phase-specific context files loaded:

| Phase | Context Files |
|-------|---------------|
| RED | `.agents/context/phase-red.md`, `.agents/context/testing.md` |
| GREEN | `.agents/context/phase-green.md` |
| REFACTOR | `.agents/context/phase-refactor.md` |

## Artifact Locations

All artifacts written to `.agents/work/{slug}/`:

| Phase | Research | Plan | Code Output |
|-------|----------|------|-------------|
| RED | `red-research.md` | `red-plan.md` | Test files in codebase |
| GREEN | `green-research.md` | `green-plan.md` | Source files in codebase |
| REFACTOR | `refactor-research.md` | `refactor-plan.md` | Refactored source files |

All phases append to `report.md`.

## Error Handling

If any step fails:
1. Do NOT proceed to next step
2. Return `success: false` with error details
3. Do NOT commit incomplete work

```json
{
  "phase": "green",
  "success": false,
  "error": "Tests still failing",
  "details": {
    "testsPassing": 6,
    "testsTotal": 8,
    "failingTests": ["should handle auth timeout", "should validate token"]
  }
}
```

## Key Rules

1. **Go and See** - Read actual files before editing, research may be stale
2. **Single-Piece Flow** - One test (GREEN) or one change (REFACTOR) at a time
3. **Gate Enforcement** - Never commit without verify-results approval
4. **Eliminate Waste** - Write only what tests demand
5. **Always Commit** - EVERY phase MUST end with a git commit. No phase is complete without a commit hash returned.

## Token Budget

- Input: ~5k tokens (slug, phase, work item context)
- Peak: ~35k tokens (during implementation)
- Output: ~1k token summary

Each sub-agent runs with fresh context to stay within limits.
