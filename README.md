# Hivemind AI

A Claude Code marketplace for agentic plugins, skills, and workflows.

## Overview

Hivemind AI provides modular, composable plugins that enhance Claude Code with specialized capabilities:

- **Subagents**: Task-specific AI agents for focused work
- **Skills**: Domain knowledge modules (lazy-loadable documentation)
- **Hooks**: Runtime enforcement and workflow automation
- **Commands**: User-facing workflow orchestration

## Requirements

- **Bun** - Required for plugin hooks (phase enforcement, queue processing)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

## Installation

```bash
# Add marketplace
claude plugin marketplace add git@github.com:hivemind-ai-core/claude-hivemind-ai.git

# Install plugin
claude plugin install superagents@hivemind-ai
```

## Available Plugins

### superagents

Full-featured Research-Plan-Implement (RPI) workflow with Test-Driven Development (TDD).

**Features:**
- Hierarchical agent architecture
- Red-Green-Refactor TDD enforcement
- Context compression and management
- 14+ skills across multiple tech stacks
- Automated commit workflows

**Quick Start:**
```bash
# After installing superagents
/setup-superagents
/update-roadmap
/work
```

[View superagents documentation](./superagents/README.md)

## Plugin Structure

Each plugin follows a standard structure:

```
plugin-name/
├── README.md           # Plugin documentation
├── agents/             # Subagent definitions
├── skills/             # Domain knowledge modules
├── hooks/              # Runtime hooks
├── commands/           # User commands
└── .template/          # Setup templates
```

## Creating Plugins

See the [Plugin Development Guide](./DEVELOPMENT.md) for creating new plugins.

## Philosophy

1. **Composable**: Plugins work independently or together
2. **Focused**: Each component has single responsibility
3. **Lazy-loaded**: Skills and context loaded on-demand
4. **Transparent**: File-based communication, human-readable
5. **Evolvable**: Learn from mistakes, accumulate patterns

## License

MIT
