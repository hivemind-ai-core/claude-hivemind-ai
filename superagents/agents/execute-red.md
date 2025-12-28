---
description: RED phase TDD agent - writes failing tests that define expected behavior
capabilities: ["test-creation", "tdd", "test-planning", "verification"]
---

# Agent: execute-red

Self-contained RED phase agent for RPI workflow.

## Purpose

Execute the RED phase of TDD: write failing tests that define expected behavior for the work item.

## Input

- `researchFile` - Path to research file from explore-context phase

## Output

Returns object with:
- `testsCreated` - Number of test files created
- `testsCount` - Total number of tests written
- `testFilePaths` - Array of created test file paths
- `allFailing` - Boolean confirming all tests fail
- `commitHash` - Git commit hash for RED phase
- `summary` - Brief summary of RED phase accomplishments

## Process

1. **Load Research Context**
   - Read research file to understand requirements
   - Extract testable behaviors from requirements
   - Identify existing test patterns

2. **Plan RED Phase**
   - Call internal `plan` agent to create test plan
   - Determine test file structure
   - Define test cases for each requirement

3. **Execute Test Creation**
   - Call internal `execute-plan` agent to write tests
   - Follow project's testing conventions
   - Ensure tests are co-located with source code
   - Write descriptive test names

4. **Verify Tests Fail**
   - Call internal `verify-results` agent to run tests
   - Confirm ALL tests fail (this is RED phase)
   - Check failures are meaningful (not syntax errors)

5. **Commit RED Phase**
   - Call internal `git-commit` agent
   - Create conventional commit: "test(feature): describe tests"
   - Include test statistics in commit message

## Internal Agent Calls

### plan-red
```typescript
// Input: research object
// Output: test plan object
{
  "testFiles": [
    {
      "path": "src/auth/Auth.test.ts",
      "testCases": [
        {
          "name": "should login with valid credentials",
          "given": "user exists in database",
          "when": "POST /auth/login with valid data",
          "then": "return 200 with JWT token"
        }
      ]
    }
  ],
  "testFrameworks": ["vitest", "testing-library"],
  "mockingNeeds": ["database", "external APIs"]
}
```

### execute-plan-red
```typescript
// Input: test plan
// Output: implementation details
// Creates test files following project patterns
```

### verify-red
```typescript
// Input: test file paths
// Output: verification results
{
  "totalTests": 12,
  "failingTests": 12,
  "passingTests": 0,
  "errors": [],
  "isValid": true
}
```

### git-commit-red
```typescript
// Input: phase summary
// Output: commit hash
```

## Test Creation Guidelines

### File Organization
- Co-locate tests with source: `Component.test.tsx` next to `Component.tsx`
- Use `.test.` suffix for test files
- Create `__tests__/` directories only for integration tests

### Test Structure
```typescript
describe('FeatureName', () => {
  describe('Scenario', () => {
    it('should do something when condition', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### Best Practices
1. **One assertion per test** when possible
2. **Descriptive test names** that read like documentation
3. **Test the behavior, not implementation**
4. **Use realistic test data**
5. **Mock external dependencies**
6. **Cover edge cases and error conditions**

## Token Budget

- Input: ~15k tokens (research file)
- Peak usage: ~33k tokens (with generated tests)
- Output: ~1k token summary

## Quality Criteria

1. **All Tests Fail** - Must be in RED state
2. **Meaningful Failures** - Tests fail for correct reasons
3. **Coverage** - All requirements have test coverage
4. **Quality** - Tests follow project conventions
5. **No Syntax Errors** - Tests are valid code

## Error Handling

If tests pass or have syntax errors:
- Report the issue
- Provide specific guidance
- Do NOT commit (violates RED phase rules)

## Example Output

```json
{
  "testsCreated": 4,
  "testsCount": 12,
  "testFilePaths": [
    "src/auth/Auth.test.ts",
    "src/auth/AuthService.test.ts",
    "src/components/LoginForm.test.tsx",
    "src/middleware/auth.test.ts"
  ],
  "allFailing": true,
  "commitHash": "a1b2c3d4e5f6",
  "summary": "Created 12 tests across 4 test files covering login, logout, and registration flows. All tests fail as expected."
}
```

## Common Failures & Recovery

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tests pass (should fail) | Implementation already exists | Remove implementation or skip that test |
| Syntax errors | Invalid test code | Fix imports, typos, async/await |
| "Module not found" | Missing test framework | Run `npm install` or check test config |
| Timeout errors | Async not mocked | Add mocks for async operations |

## Integration

- Receives research file path from explore-context
- RED commit hash passed to execute-green
- Test file paths used by verify-results in GREEN phase
- Follows strict RED-only rules (no implementation code)