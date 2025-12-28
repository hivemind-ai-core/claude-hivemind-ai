# Diagrams Skill

Visual documentation through Mermaid diagrams.

## When to Use

- Architecture documentation (system overviews, component relationships)
- Spec visualizations (data models, user flows, API interactions)
- Plan references (implementation approach, component interactions)
- Data flow documentation (request/response flows, event processing)
- State machines and workflows (order status, auth flow)

## Technology Selection

| Diagram Type | Use Case | When to Choose |
|--------------|----------|----------------|
| Flowchart | System architecture, processes, decision trees | Showing component layout, process flow, branching logic |
| Sequence | API calls, service interactions, message flow | Request/response patterns, multi-service interactions |
| Class | Object models, interfaces, type hierarchies | TypeScript/Rust types, inheritance, composition |
| State | Lifecycles, status transitions, FSMs | Order status, auth states, workflow phases |
| ER | Database schema, entity relationships | Tables, foreign keys, cardinality |
| Journey | User experience, onboarding flows | Multi-step user interactions with satisfaction scores |
| Mindmap | Concept breakdown, brainstorming | Feature decomposition, idea exploration |

## Diagram Type Selection Guide

### Analyze Source → Choose Diagram

| Source Type | Recommended Diagram |
|-------------|---------------------|
| System overview | Flowchart (`graph TB`) |
| API endpoints/routes | Sequence diagram |
| Database schema | ER diagram |
| TypeScript interfaces/classes | Class diagram |
| State management code | State diagram |
| User-facing workflow | User journey |
| Feature breakdown | Mindmap |

### When NOT to Use Diagrams

- Simple single-file changes (diagram adds no value)
- Trivial CRUD operations (self-explanatory from code)
- When text description is clearer
- Temporary/throwaway code

## Output Paths

Diagrams are stored context-specifically:

| Context | Mermaid Source | Generated Image |
|---------|----------------|-----------------|
| Architecture | `architecture/diagrams/*.mmd` | `architecture/diagrams/*.svg` |
| Specifications | `spec/diagrams/*.mmd` | `spec/diagrams/*.svg` |
| Plans | `.agents/plans/diagrams/*.mmd` | `.agents/plans/diagrams/*.svg` |

## File Naming Convention

```
{context}-{description}.mmd

Examples:
system-overview.mmd
auth-sequence.mmd
user-data-model.mmd
order-state-machine.mmd
```

## Markdown Embedding

Reference diagrams using relative paths:

```markdown
## System Architecture

![System Overview](./diagrams/system-overview.svg)

The system consists of...
```

## Related Files

- [mermaid.md](mermaid.md) - Mermaid syntax reference for all diagram types
- [conversion.md](conversion.md) - Image conversion with `npx mmdc`

## Related Skills

- `architecture` - System documentation patterns
- `api` - API design and documentation
- `database` - Schema documentation

## Agents

| Agent | Purpose |
|-------|---------|
| `diagram-generator` | Analyze code/specs and generate Mermaid diagrams |
| `diagram-to-image` | Convert .mmd files to SVG images |

## Best Practices

1. **Keep diagrams focused** - One concept per diagram, split if complex
2. **Use consistent naming** - Same entity names across diagrams
3. **Add labels to edges** - Describe relationships, not just connections
4. **Limit nodes** - 7-12 nodes max for readability
5. **Choose direction wisely** - TB for hierarchies, LR for sequences
6. **Use subgraphs** - Group related components logically
7. **Apply consistent styling** - Use theme colors, not custom everywhere
