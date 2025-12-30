# REFACTOR Phase

Improve code quality while preserving behavior. One change at a time.

## Artifacts

### Read Before Starting
- `.agents/work/{slug}/research.md` - Research findings
- `.agents/work/{slug}/red-plan.md` - Test plan
- `.agents/work/{slug}/green-plan.md` - Implementation plan

### Write Before Executing
- `.agents/work/{slug}/refactor-plan.md` - Refactoring plan

## Gate: Entry

Before starting REFACTOR:
1. GREEN phase committed
2. All tests passing (100%)
3. Zero TypeScript errors

## Gate: Exit

Before committing REFACTOR:
1. All tests still passing (100%)
2. Zero TypeScript errors
3. Code quality improved

## Single-Piece Flow

Make **one change at a time**:

1. Identify improvement opportunity
2. Apply refactoring
3. Run tests to verify behavior preserved
4. If tests fail: UNDO and try different approach
5. Move to next improvement

**Never batch multiple refactorings.** This isolates problems.

## Safe Refactorings

Prefer low-risk refactorings:

### Very Low Risk
- Rename variable/function
- Extract constant
- Remove unused code
- Add type annotations

### Low Risk
- Extract function
- Inline function
- Move function to better location
- Simplify conditional

### Medium Risk
- Extract class/module
- Change function signature
- Replace algorithm

### High Risk (Avoid)
- Restructure entire module
- Change data structures
- Modify shared dependencies

## Refactoring Catalog

Common refactorings to consider:

**Extract Function**: Code does multiple things
```typescript
// Before
function process() {
  // validate
  if (!x) throw new Error()
  // calculate
  const result = x * 2
  // format
  return `Result: ${result}`
}

// After
function process() {
  validate()
  const result = calculate()
  return format(result)
}
```

**Rename for Clarity**: Names don't describe purpose
```typescript
// Before
const d = new Date()

// After
const currentDate = new Date()
```

**Remove Duplication**: Same code in multiple places
```typescript
// Before
function a() { /* shared logic */ }
function b() { /* same shared logic */ }

// After
function shared() { /* shared logic */ }
function a() { shared() }
function b() { shared() }
```

## What NOT to Refactor

Skip refactoring if:
- Code works and is readable
- Change would be high risk
- Benefit is unclear
- Tests don't cover the area

## Verification

After each refactoring:
```bash
bun test  # Must still be 100% passing
tsc --noEmit  # Must still have zero errors
```

## Commit

When refactoring complete:
```
refactor(scope): improve code quality

- Extracted X function
- Renamed Y for clarity
- Removed duplication in Z
- All tests still passing (N/N)
```
