---
description: Update architecture/ directory with current implementation description including Mermaid charts, convert to images, link in markdown
---

# /update-architecture Command

Update architecture documentation with Mermaid diagrams reflecting current implementation.

## What This Command Does

1. **Analyzes current implementation** - Scans source files, git changes, existing architecture docs
2. **Generates Mermaid diagrams** - Creates/updates diagrams for system overview, data flow, data model
3. **Converts to images** - Uses mmdc to generate SVG files from .mmd sources
4. **Updates markdown docs** - Links diagrams into architecture documentation
5. **Commits changes** - Creates conventional commit for documentation update

## Process

### 1. Analyze Current Implementation

Scan the codebase to understand current structure:

```
Inputs:
- git diff (recent changes)
- Source files (src/, lib/, etc.)
- Existing architecture/ docs
- Database schemas
- API routes
```

Identify:
- Components and services
- API endpoints and routes
- Database tables and relationships
- External integrations
- State machines and workflows

### 2. Generate Diagrams

Use `diagram-generator` agent to create/update diagrams:

| Analysis | Diagram | Output Path |
|----------|---------|-------------|
| Overall system structure | System Overview (flowchart) | `architecture/diagrams/system-overview.mmd` |
| API request flows | Data Flow (sequence) | `architecture/diagrams/data-flow.mmd` |
| Database schema | Data Model (ER) | `architecture/diagrams/data-model.mmd` |
| Per-feature interactions | Feature-specific (sequence) | `architecture/diagrams/{feature}-flow.mmd` |
| State machines | State diagrams | `architecture/diagrams/{entity}-states.mmd` |

**Only generate diagrams that add value:**
- Skip if system is trivial (< 3 components)
- Skip if no database (no ER diagram needed)
- Skip if no complex state (no state diagram needed)

### 3. Convert to Images

Use `diagram-to-image` agent:

```bash
# Convert all .mmd files to .svg
for f in architecture/diagrams/*.mmd; do
    npx @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.svg" -t default
done
```

Output:
- `architecture/diagrams/system-overview.svg`
- `architecture/diagrams/data-flow.svg`
- `architecture/diagrams/data-model.svg`
- etc.

### 4. Update Architecture Documentation

Update markdown files to reference generated images:

**architecture/README.md:**
```markdown
# System Architecture

## Overview

![System Overview](./diagrams/system-overview.svg)

The system consists of the following components:
- **API Gateway** - Handles routing and authentication
- **User Service** - Manages user data and profiles
- **Data Service** - Handles business logic

## Data Flow

![Data Flow](./diagrams/data-flow.svg)

When a request comes in...

## Data Model

![Data Model](./diagrams/data-model.svg)

The core entities are...
```

**Update architecture/index.md:**
```markdown
README.md -- System architecture overview with diagrams -- architecture, diagrams, overview
diagrams/system-overview.mmd -- System component diagram source -- mermaid, flowchart
diagrams/system-overview.svg -- System component diagram image -- diagram, svg
...
```

### 5. Commit Changes

Create conventional commit with all changes:

```bash
git add architecture/
git commit -m "docs(architecture): update diagrams

- Updated system-overview diagram
- Added data-flow sequence diagram
- Refreshed data-model ER diagram
- Linked diagrams in README.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Directory Structure

After running command:

```
architecture/
├── README.md              # Overview with embedded diagrams
├── index.md               # File index
├── diagrams/              # Diagram source and images
│   ├── system-overview.mmd
│   ├── system-overview.svg
│   ├── data-flow.mmd
│   ├── data-flow.svg
│   ├── data-model.mmd
│   └── data-model.svg
├── components/            # Component documentation
│   └── *.md
└── api/                   # API documentation
    └── *.md
```

## Output

```
Updating architecture documentation...

Analyzing implementation...
✓ Found 8 components/services
✓ Found 12 API endpoints
✓ Found 5 database tables
✓ Detected 2 state machines

Generating diagrams...
✓ system-overview.mmd (flowchart, 8 nodes)
✓ data-flow.mmd (sequence, 4 participants)
✓ data-model.mmd (ER, 5 entities)
✓ order-states.mmd (state, 6 states)

Converting to images...
✓ system-overview.svg
✓ data-flow.svg
✓ data-model.svg
✓ order-states.svg

Updating documentation...
✓ README.md (linked 4 diagrams)
✓ index.md (added 8 entries)

Committed: docs(architecture): update diagrams [abc123]

✓ Architecture documentation updated!
```

## When to Use

- After completing features (via /work)
- After major refactoring
- When architecture changes significantly
- Before major releases
- When onboarding new team members

## Options

The command can be invoked with focus areas:

```
/update-architecture              # Full update
/update-architecture --api        # Focus on API documentation
/update-architecture --database   # Focus on data model
/update-architecture --feature X  # Focus on specific feature
```

## Diagram Selection Logic

Only generate diagrams that provide value:

| Condition | Diagrams to Generate |
|-----------|---------------------|
| Multi-service system | System overview flowchart |
| API endpoints exist | Sequence diagram for key flows |
| Database present | ER diagram |
| Status/state fields | State diagram |
| Complex user flow | User journey |

Skip diagram generation when:
- System is trivial (single service, no DB)
- Diagram would be identical to existing
- No meaningful changes since last update

## Error Handling

| Error | Action |
|-------|--------|
| No source files found | Report warning, skip analysis |
| Diagram generation fails | Report error, continue with others |
| Image conversion fails | Report syntax error, skip file |
| Git commit fails | Report error, changes remain unstaged |

## Integration

This command:
- Is called at the end of `/work` workflow (ARCHITECTURE phase)
- Can be run standalone for documentation updates
- Works with `diagram-generator` and `diagram-to-image` agents
