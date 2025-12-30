---
description: RPI phase-specific planning agent - creates detailed execution plans (leaf agent)
capabilities: ["planning", "test-design", "implementation-design", "refactoring-design"]
---

# Agent: rpi-plan

**Leaf agent** - Creates phase-specific plans. Does NOT spawn other agents.

Produces plan artifacts that other agents consume. Context isolation ensures planning research doesn't pollute implementation context.

Create detailed, actionable execution plans for RPI phases (~3-5k tokens).

## Input

- `slug` - Work item slug
- `phase` - One of: `"red"` | `"green"` | `"refactor"`

## Output

- `planFile` - Path to phase-specific plan file
- `files` - Array of files to create/modify
- `summary` - Brief summary of plan

## Process

### 1. Load Phase Research

Read `.agents/work/{slug}/{phase}-research.md`.

### 2. Load Phase Context

| Phase | Context Files |
|-------|---------------|
| RED | `.agents/context/phase-red.md`, `.agents/context/testing.md` |
| GREEN | `.agents/context/phase-green.md` |
| REFACTOR | `.agents/context/phase-refactor.md` |

### 3. Create Phase-Specific Plan

Write to `.agents/work/{slug}/{phase}-plan.md`:

#### RED Phase Plan Format

```markdown
# RED Plan: {slug}

## Overview
- Tests to create: N
- Test files: [list]
- Estimated test count: N

## Test Strategy
- Framework: {vitest/bun/cargo}
- Test command: {command}

## Test Cases

### File: src/feature/module.test.ts (create)

#### Test 1: "should {behavior}"
- Arrange: {setup}
- Act: {action}
- Assert: {expectation}

#### Test 2: "should {behavior}"
- Arrange: {setup}
- Act: {action}
- Assert: {expectation}

## Mocking Plan
- {mock setup instructions}

## Execution Checklist
- [ ] Create test file
- [ ] Write test 1
- [ ] Write test 2
- [ ] Verify all tests fail
```

#### GREEN Phase Plan Format

```markdown
# GREEN Plan: {slug}

## Overview
- Files to create: N
- Files to modify: N
- Tests to pass: N
- Integration target: {specific file where code will be wired in}

## Implementation Steps

### Step 1: Types (src/feature/types.ts)
- Create: {type definitions}
- Purpose: {why needed}

### Step 2: Implementation (src/feature/impl.ts)
- Create: {function/class}
- Signature: {from test expectations}
- Logic: {key implementation points}

### Step 3: Integration (MANDATORY)

**Integration is not optional. Dead code is a GREEN phase failure.**

Detect project type and specify exact integration point:

| Project Type | Integration File | Integration Code |
|-------------|------------------|------------------|
| API (hono/express/fastify) | `src/routes/index.ts` | `router.route('/path', handler)` |
| Frontend (react/vue/svelte) | `src/routes.tsx` or parent | `<Route path="/x" component={X}/>` |
| Game (pixi/phaser) | `src/scenes/MainScene.ts` | `this.addChild(obj)` or `update()` call |
| CLI | `src/cli.ts` or entry point | `commands.register('name', handler)` |
| Library | `src/index.ts` | `export { Feature } from './feature'` |

For this work item:
- **Project type**: {API|Frontend|Game|CLI|Library}
- **Integration file**: {exact path}
- **Integration code**: {exact code to add}
- **Import statement**: {what to import}

## Dependencies
- Install: {packages if any}

## Execution Checklist
- [ ] Create types
- [ ] Implement first test case
- [ ] Run tests
- [ ] Implement next test case
- [ ] Repeat until all pass
- [ ] **INTEGRATE: Add to {integration file}** ← NOT OPTIONAL
- [ ] Verify integration (feature accessible to user)
```

#### REFACTOR Phase Plan Format

```markdown
# REFACTOR Plan: {slug}

## Overview
- Refactorings planned: N
- Files affected: N

## Refactoring Steps

### Step 1: {Refactoring Name}
- Type: Extract Function | Rename | Inline | Move
- Risk: Low | Medium
- File: {path}
- Before: {brief description}
- After: {brief description}
- Test impact: None expected

### Step 2: {Refactoring Name}
[Same format]

## Poka-Yoke Improvements
- [ ] {type improvement}

## Execution Checklist
- [ ] Verify baseline tests pass
- [ ] Apply refactoring 1
- [ ] Run tests
- [ ] Apply refactoring 2
- [ ] Run tests
- [ ] Final verification
```

## Output

```json
{
  "planFile": ".agents/work/{slug}/{phase}-plan.md",
  "files": [
    { "path": "src/feature/module.ts", "action": "create" },
    { "path": "src/feature/types.ts", "action": "modify" }
  ],
  "summary": "Brief summary of planned changes"
}
```

## Key Rules

1. **Actionable** - Each step must be executable
2. **Checklist** - Include verification checkboxes
3. **Concise** - Details come from reading files during execution
4. **Phase-appropriate** - Follow phase rules strictly

## Token Budget

- Input: ~5k tokens (phase research + context)
- Output: ~3-5k tokens (plan file) + ~200 tokens (summary)
