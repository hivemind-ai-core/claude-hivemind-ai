---
description: Add a new work item to the backlog interactively
---

# /superagents:backlog Command

Add work items to the backlog. This command **automatically breaks down tasks** into small, atomic work items.

## Core Principle: Atomic Work Items

All work items MUST be small, focused, and atomic. A single work item should:
- Be completable in a single focused session
- Have 1-5 tests maximum
- Touch a limited number of files
- Have clear, unambiguous scope

**Large tasks are NEVER created directly.** Instead:
1. Create a **research item** to analyze and break down the task
2. The research phase creates multiple atomic work items

## Arguments

If called with arguments (e.g., `/superagents:backlog Implement user authentication`), use the arguments as the description directly. Skip asking for description, just ask for priority.

## Process

### 1. Gather Information

**If arguments provided** (e.g., `/superagents:backlog Add dark mode support`):
- Use arguments as the description
- Only ask for priority

**If no arguments**:
Ask the user:
1. **Description**: "What work needs to be done?"
2. **Priority**: "What priority?" (high/medium/low)

### 2. Analyze Task Complexity

Quickly assess whether the task is:

**ATOMIC** (create directly):
- Single, focused change
- Obvious scope (e.g., "Fix typo in header", "Add loading spinner to button")
- Would need 1-5 tests maximum
- Clearly touches limited files

**COMPLEX** (needs breakdown):
- Multi-part feature (e.g., "Implement user authentication")
- Vague scope (e.g., "Improve performance", "Add dark mode")
- Would need 6+ tests
- Unclear which files are involved
- Contains words like "implement", "add feature", "refactor system", "improve"

### 3. Generate Slug(s)

Create URL-safe slug(s):
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Max 50 characters

For research items, prefix with `research-`:
- "Implement user auth" → `research-user-auth`

### 4. Create Work Item(s)

#### For ATOMIC Tasks

Create `.agents/work/{slug}/` with:

**definition.md**:
```markdown
# {Description}

## Priority
{high|medium|low}

## Type
atomic

## Description
{User's description}

## Acceptance Criteria
- [ ] {derived from description}

## Created
{timestamp}
```

#### For COMPLEX Tasks

Create `.agents/work/research-{slug}/` with:

**definition.md**:
```markdown
# Research: {Description}

## Priority
{high|medium|low}

## Type
research

## Description
{User's description}

## Research Goal
Analyze this task and break it down into atomic work items.

## Output Required
This research item will:
1. Investigate the codebase to understand scope
2. Identify all sub-tasks needed
3. Create atomic work items for each sub-task
4. Add created items to the backlog

## Original Request
{User's original description verbatim}

## Created
{timestamp}
```

### 5. Add to Backlog

Edit `.agents/work/backlog.md`:
- Add item(s) to the appropriate priority section
- Format: `- **{slug}** -- {short description}`

For research items:
- `- **research-user-auth** -- [RESEARCH] Break down: Implement user authentication`

### 6. Confirm

**For ATOMIC tasks:**
```
✓ Work item created: {slug}
  Priority: {priority}
  Type: atomic
  Location: .agents/work/{slug}/definition.md

  Run /superagents:queue-add {slug} to add it to the processing queue.
```

**For COMPLEX tasks:**
```
✓ Research item created: research-{slug}
  Priority: {priority}
  Type: research (will create atomic sub-tasks)
  Location: .agents/work/research-{slug}/definition.md

  This task needs breakdown. When processed, it will:
  1. Analyze the codebase and requirements
  2. Create small, atomic work items
  3. Add them to the backlog automatically

  Run /superagents:queue-add research-{slug} to start the breakdown.
```

## Output

Return:
```json
{
  "slug": "research-user-authentication",
  "priority": "high",
  "type": "research",
  "definitionPath": ".agents/work/research-user-authentication/definition.md",
  "message": "Complex task - will be broken down into atomic items during research"
}
```

Or for atomic:
```json
{
  "slug": "fix-login-typo",
  "priority": "medium",
  "type": "atomic",
  "definitionPath": ".agents/work/fix-login-typo/definition.md"
}
```

## Examples

| User Request | Type | Items Created |
|-------------|------|---------------|
| "Fix the typo in the header" | atomic | `fix-header-typo` |
| "Add loading spinner to submit button" | atomic | `add-submit-spinner` |
| "Implement user authentication" | research | `research-user-authentication` |
| "Add dark mode support" | research | `research-dark-mode` |
| "Refactor the payment system" | research | `research-refactor-payments` |
| "Improve API performance" | research | `research-api-performance` |

## Notes

- Use AskUserQuestion tool to gather information
- Validate slug doesn't already exist
- If slug exists, append a number (e.g., `add-feature-2`)
- When in doubt, create a research item (it's better to over-analyze than create oversized work items)
- The user doesn't need to think about breakdown - just describe what they want
