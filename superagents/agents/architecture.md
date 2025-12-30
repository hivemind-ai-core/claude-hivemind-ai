---
description: Architecture documentation agent - updates docs based on completed work item
capabilities: ["documentation", "diagram-generation", "architecture-sync"]
---

# Agent: architecture

Synchronize architecture documentation with completed RPI work.

## Purpose

Update architecture documentation to reflect changes made during RPI workflow phases.

## Input

- `slug` - Work item slug

## Output

Returns object with:
- `docsUpdated` - Array of updated documentation files
- `diagramsGenerated` - Array of generated diagram files
- `imagesCreated` - Array of SVG/PNG images
- `commitHash` - Git commit hash for documentation update
- `summary` - Brief summary of architecture updates

## Process

### 1. Load Implementation Context

Read from `.agents/work/{slug}/`:
- `definition.md` - Original work item requirements
- `report.md` - Combined RED/GREEN/REFACTOR phase results
- `research.md` - Research context

Scan modified files from git diff to understand what changed.

### 2. Analyze Changes

- Identify new components/services added
- Find modified API endpoints
- Detect database schema changes
- Note configuration changes

### 3. Determine Needed Diagrams

| Change Type | Diagram to Generate |
|-------------|---------------------|
| New component/service | System overview flowchart |
| New API endpoints | Sequence diagram for key flows |
| Database schema change | ER diagram |
| State/lifecycle change | State diagram |

### 4. Generate Diagrams

**Use Task tool to spawn diagram agents (do NOT use bash/CLI):**

```
Task(superagents:diagram-generator, "Generate system overview diagram for {slug}")
```

Then convert to images:

```
Task(superagents:diagram-to-image, "Convert diagrams to SVG in architecture/diagrams/")
```

### 5. Update Architecture Docs

Update relevant documentation files:

| File | When to Update |
|------|----------------|
| `architecture/README.md` | Link new diagrams |
| `architecture/api/endpoints.md` | New/changed API endpoints |
| `architecture/database/schema.md` | Schema changes |
| `architecture/components/catalog.md` | New components |

### 6. Commit Documentation

**Use Task tool (do NOT use bash/CLI):**

```
Task(superagents:git-commit, "Commit architecture docs for {slug}")
```

- Commit type: `docs`
- Scope: `{slug}`
- Message: `update architecture`

## Diagram Storage

```
architecture/
├── diagrams/
│   ├── system-overview.mmd    # Mermaid source
│   ├── system-overview.svg    # Generated image
│   ├── data-model.mmd
│   ├── data-model.svg
│   └── ...
└── README.md                   # Links to diagrams
```

## Documentation Standards

### File Organization
- Use clear, descriptive file names
- Follow consistent directory structure
- Include table of contents in long docs

### Content Guidelines
- Start with purpose statement
- Include examples for each component
- Document dependencies and integrations
- Note security considerations

### Visual Documentation
- Use Mermaid for diagrams
- Generate SVG images for embedding
- Use consistent styling

## Example Output

```json
{
  "docsUpdated": [
    "architecture/README.md",
    "architecture/api/endpoints.md",
    "architecture/components/catalog.md"
  ],
  "diagramsGenerated": [
    "architecture/diagrams/system-overview.mmd",
    "architecture/diagrams/auth-flow.mmd"
  ],
  "imagesCreated": [
    "architecture/diagrams/system-overview.svg",
    "architecture/diagrams/auth-flow.svg"
  ],
  "commitHash": "d4e5f6a7",
  "summary": "Updated architecture for user-auth: added component catalog entry, generated system overview and auth flow diagrams"
}
```

## Token Budget

- Input: ~5k tokens (work item context + report)
- Peak: ~15k tokens (during diagram generation)
- Output: ~1k token summary

## Integration

- Called after REFACTOR phase completes
- Final commit before archive
- Reads from `.agents/work/{slug}/` directory
- Writes to `architecture/` directory
