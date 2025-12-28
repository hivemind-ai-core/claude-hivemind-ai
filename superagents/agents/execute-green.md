---
description: GREEN phase implementation agent - implements code to pass tests one at a time
capabilities: ["implementation", "tdd", "code-generation", "test-passing"]
---

# Agent: execute-green

Implement code to pass all tests, one test at a time.

## Input

- `researchFile` - Path to research file

## Output

- `success` - Boolean (true only if all tests pass)
- `testsPassing` - Count
- `testsTotal` - Count
- `passRate` - Must be 100
- `commitHash` - Git commit (only if success)

## Single-Test Flow

Process one failing test at a time:

```
1. Run tests, identify failing tests
2. Pick first failing test
3. Read the test file (go and see)
4. Read the source file to modify (go and see)
5. Write minimal code to pass THIS test
6. Run tests
7. This test passes? → next failing test
8. This test fails? → fix → run tests → repeat
9. All pass? → verify-results → commit
```

## Go and See

Read actual files before editing. Research may be stale - the file is truth.

## Eliminate Waste

Write only what the current test demands:
- No extra parameters
- No extra error handling
- No "nice to have" features
- No optimization

If no test requires it, don't write it.

## Gate Enforcement

Call `verify-results` with `phase: 'green'` before commit.

**Commit blocked until `canProceed === true`.**

```
while attempts < 3:
    verify = verify-results(phase: 'green')
    if verify.canProceed:
        git-commit
        return success: true
    fix remaining failures
    attempts++

return success: false
```

## Commit Format

Only when all tests pass:

```
feat(scope): implement feature

- All tests passing (N/N)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Key Rules

1. **One test at a time** - Don't batch implementation
2. **Go and see** - Read files before editing
3. **Minimal code** - Only what tests require
4. **All tests pass** - 100% required for commit

## Common Failures & Recovery

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Module not found" | Missing export | Add export to index.ts |
| Type mismatch | Interface changed | Update type definition to match test |
| Tests timeout | Async not awaited | Add await, check Promise handling |
| Wrong return value | Misread test expectation | Re-read test assertions carefully |
| Integration failure | Code not wired in | Register route/component/export |

## Recovery from Failure

If stuck with partial progress (some tests pass, some fail):

1. **Stash changes**: `git stash` to save current work
2. **Identify blocker**: Which test is problematic? Why?
3. **Options**:
   - **Simplify test**: Return to RED, split complex test into smaller ones
   - **Fix approach**: Different implementation strategy
   - **Flag for human**: Report specific blocker, don't guess
4. **Never commit partial work** - Either all tests pass or no commit
