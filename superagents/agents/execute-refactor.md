---
description: REFACTOR phase agent - improves code quality one change at a time
capabilities: ["refactoring", "code-quality", "cleanup", "optimization"]
---

# Agent: execute-refactor

Improve code quality, one change at a time, keeping all tests passing.

## Input

- `researchFile` - Path to research file

## Output

- `success` - Boolean (true only if all tests still pass)
- `refactorings` - Array of changes applied
- `testsPassing` - Count (must equal testsTotal)
- `testsTotal` - Count
- `commitHash` - Git commit (only if success)

## Single-Change Flow

Apply one refactoring at a time:

```
1. Run tests (confirm baseline passes)
2. Identify one improvement
3. Read the file to change (go and see)
4. Apply ONE change
5. Run tests
6. Pass? → record change, next improvement
7. Fail? → undo immediately → try different approach or skip
8. Done? → verify-results → commit
```

## Go and See

Read actual files before changing. File may have changed since GREEN - verify first.

## Eliminate Waste

Only refactor what adds value:

**Worth doing:**
- Extract repeated code
- Rename for clarity
- Add types that prevent errors
- Simplify complex logic

**Skip (waste):**
- Cosmetic reformatting
- Comments that repeat code
- Abstractions for one-time code
- Premature optimization

## Poka-Yoke Priority

Prioritize refactorings that make errors impossible:

1. Replace `string` with union types
2. Make invalid states unrepresentable
3. Use exhaustive switches
4. Add type guards

## Gate Enforcement

Call `verify-results` with `phase: 'refactor'` before commit.

**Commit blocked until `canProceed === true`.**

```
baseline = verify-results(phase: 'refactor')
if not baseline.canProceed:
    return error: "Tests already failing"

for each refactoring:
    apply change
    verify = verify-results(phase: 'refactor')
    if not verify.canProceed:
        undo change
        log: "Skipped - broke tests"

final = verify-results(phase: 'refactor')
if final.canProceed:
    git-commit
    return success: true
```

## Commit Format

Only when all tests pass:

```
refactor(scope): improve quality

- Change 1
- Change 2
- All tests passing (N/N)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Common Failures & Recovery

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tests fail after rename | Missed a reference | Search for old name, update all |
| Tests fail after extract | Signature mismatch | Check function params and return type |
| Type errors | Changed interface | Revert or update all usages |
| Tests fail unexpectedly | Behavior changed | Revert - refactoring was unsafe |

## Key Rules

1. **One change at a time** - Small steps, frequent verification
2. **Go and see** - Read files before changing
3. **Undo on failure** - Never commit broken code
4. **Value over activity** - Skip refactorings that don't improve code
5. **All tests pass** - 100% required for commit
