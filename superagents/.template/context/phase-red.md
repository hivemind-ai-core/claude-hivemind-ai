# RED Phase

Write failing tests that define expected behavior.

## Artifacts

### Read Before Starting
- `.agents/work/{slug}/research.md` - Research findings

### Write Before Executing
- `.agents/work/{slug}/red-plan.md` - Test plan

## Gate: Entry

Before starting RED:
1. Research artifact exists at `.agents/work/{slug}/research.md`
2. Work item is right-sized (1-5 tests)

## Gate: Exit

Before committing RED:
1. Tests exist and run
2. All tests fail (with assertion failures, not errors)
3. Tests cover the work item requirements

## Right-Size Work Items

Work items should produce **1-5 tests**. This ensures:
- Consistent flow (no huge items blocking progress)
- Fast feedback (complete a work item in one session)
- Clear scope (know when you're done)

**If a work item needs more than 5 tests, split it.**

## Test One Behavior at a Time

Each test should verify ONE behavior:

```typescript
// Good - one behavior per test
it('returns user for valid ID', async () => {
  const user = await service.findById('123')
  expect(user.id).toBe('123')
})

it('returns null for unknown ID', async () => {
  const user = await service.findById('unknown')
  expect(user).toBeNull()
})

// Bad - multiple behaviors
it('handles user lookup', async () => {
  const user1 = await service.findById('123')
  expect(user1.id).toBe('123')
  const user2 = await service.findById('unknown')
  expect(user2).toBeNull()
})
```

## Go and See

Before writing tests:
1. Read the actual spec section (not just research summary)
2. Read any existing related tests
3. Read the source file structure

## Test Structure

```typescript
describe('FeatureName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange - set up test data
      // Act - call the code
      // Assert - verify result
    })
  })
})
```

## Verification

After writing tests, run them:
```bash
bun test
```

Verify:
- [ ] Tests run without syntax errors
- [ ] Tests fail with assertion failures (not import/runtime errors)
- [ ] Each test failure message is clear
- [ ] Tests match the work item requirements

## Commit

When tests are complete and failing correctly:
```
test(scope): add feature tests

- Test 1 description
- Test 2 description
- All tests fail as expected (0/N passing)
```
