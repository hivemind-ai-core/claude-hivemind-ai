---
description: Architecture documentation agent - updates docs based on completed work item (leaf agent)
capabilities: ["documentation", "diagram-generation", "architecture-sync"]
---

# Agent: architecture

**Leaf agent** - Does all architecture documentation work internally. Does NOT spawn other agents.

## Purpose

Update architecture documentation to reflect changes made during RPI workflow phases.

## Input

- `slug` - Work item slug

## Output

Returns object with:
- `docsUpdated` - Array of updated documentation files
- `diagramsGenerated` - Array of generated diagram files (Mermaid .mmd)
- `commitHash` - Git commit hash for documentation update
- `summary` - Brief summary of architecture updates

## Process

### 1. Load Implementation Context

Read from `.agents/work/{slug}/`:
- `definition.md` - Original work item requirements
- `report.md` - Combined RED/GREEN/REFACTOR phase results
- `research.md` - Research context

Scan modified files from git diff to understand what changed:
```bash
git diff HEAD~3 --name-only
```

### 2. Analyze Changes

Identify what was added/modified:
- New components/services
- Modified API endpoints
- Database schema changes
- Configuration changes

### 3. Determine Needed Diagrams

| Change Type | Diagram Type |
|-------------|--------------|
| New component/service | System overview flowchart |
| New API endpoints | Sequence diagram for key flows |
| Database schema change | ER diagram |
| State/lifecycle change | State diagram |

### 4. Generate Diagrams (Do This Yourself)

Create Mermaid diagrams directly. Do NOT spawn diagram agents.

Write `.mmd` files to `architecture/diagrams/`:

```mermaid
flowchart TD
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[User Service]
```

Save as `architecture/diagrams/{diagram-name}.mmd`

### 5. Update Architecture Docs

Update relevant documentation files:

| File | When to Update |
|------|----------------|
| `architecture/README.md` | Link new diagrams |
| `architecture/api/endpoints.md` | New/changed API endpoints |
| `architecture/database/schema.md` | Schema changes |
| `architecture/components/catalog.md` | New components |

Include diagram references:
```markdown
## System Overview

![System Overview](diagrams/system-overview.mmd)
```

### 6. Commit Documentation

Stage and commit all architecture changes:

```bash
git add architecture/
git commit -m "$(cat <<'EOF'
docs({slug}): update architecture

- Updated {doc1}
- Added {diagram}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Diagram Storage

```
architecture/
├── diagrams/
│   ├── system-overview.mmd    # Mermaid source
│   ├── data-model.mmd
│   └── auth-flow.mmd
├── api/
│   └── endpoints.md
├── database/
│   └── schema.md
├── components/
│   └── catalog.md
└── README.md                   # Links to diagrams
```

## Example Output

```json
{
  "docsUpdated": [
    "architecture/README.md",
    "architecture/api/endpoints.md"
  ],
  "diagramsGenerated": [
    "architecture/diagrams/auth-flow.mmd"
  ],
  "commitHash": "d4e5f6a7",
  "summary": "Updated architecture for {slug}: added auth flow diagram, updated API endpoints"
}
```

## Key Rules

1. **You are a leaf agent** - Do NOT spawn other agents
2. **Do diagrams yourself** - Create Mermaid files directly
3. **Do commits yourself** - Use git directly, not git-commit agent
4. **Minimal updates** - Only document what changed
5. **Reference, don't duplicate** - Point to code, don't copy it

## Token Budget

- Input: ~5k tokens (work item context + report)
- Peak: ~15k tokens (during diagram generation)
- Output: ~500 tokens (summary)

## Integration

- Called after REFACTOR phase completes
- Final documentation step before archive
- Reads from `.agents/work/{slug}/` directory
- Writes to `architecture/` directory
