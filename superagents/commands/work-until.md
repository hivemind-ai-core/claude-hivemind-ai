---
description: Set a work item target and execute the RPI workflow until that item is complete
---

# /work-until Command

Execute the RPI workflow continuously until a specific work item is completed.

## Usage

```
/work-until
```

No arguments required - the command will prompt you to select from available work items.

## Process

### 1. Read Todo File
Load `.agents/todos/todo.md` to get all available work items.

### 2. Display Work Items
Show the user all queued work items organized by status:

```
## In Progress
1. user-authentication - Implement JWT-based authentication
2. database-schema - Design and create database tables

## Up Next
3. api-endpoints - Create REST API endpoints
4. frontend-ui - Build user interface components
```

### 3. Prompt for Selection
Ask the user which work item to work until:

```
Which work item would you like to work until? (Enter the number or slug)
```

### 4. Update workflow.json
Set the `workUntil` field in `.agents/workflow.json`:

```json
{
  "workUntil": "user-authentication"
}
```

### 5. Execute /work
Issue the `/work` command to begin execution.

### 6. Automatic Continuation
The Stop hook will now:
- Check if the target work item is in `completedItems`
- Block stop attempts if the target is not yet complete
- Display current progress and prompt to run `/work` again

### 7. Completion
When the target work item is completed:
- The `workUntil` field is automatically cleared
- Stop attempts are allowed again

## Behavior

Once `/work-until` is active:

1. **Each work item completes** → Run `/work` again to continue to the next item
2. **Target item completes** → The workflow.json `workUntil` is cleared automatically
3. **Stop attempt** → Blocked with message showing current progress

## Example

```
/work-until
```

Output:
```
## Queued Work Items

### In Progress
1. **user-authentication** - Implement JWT-based authentication
2. **database-schema** - Design and create database tables

### Up Next
3. **api-endpoints** - Create REST API endpoints
4. **frontend-ui** - Build user interface components

Which work item would you like to work until? (Enter the number or slug)
> 4

Set work-until target: frontend-ui
Use /work to begin. The workflow will continue until 'frontend-ui' is complete.
```

## Stop Behavior

When `work-until` is active and you try to stop:

```
Blocked: Work until 'frontend-ui' is active.
Currently working on: user-authentication (phase: green).
Run /work to continue.
```

## Cancelling work-until

To cancel the work-until mode:
1. Edit `.agents/workflow.json`
2. Remove or set `workUntil` to null
3. Save the file

Or simply complete the target work item - it will auto-clear.
