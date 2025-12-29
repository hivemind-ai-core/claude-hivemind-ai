# Superagents Plugin

Full-featured Research-Plan-Implement (RPI) workflow with Test-Driven Development (TDD) for Claude Code.

## Features

- **Research-Plan-Implement Workflow**: Systematic approach to all development tasks
- **Red-Green-Refactor TDD**: Strict test-driven development with quality gates
- **Hierarchical Agents**: Master → Phase → Internal (minimal context)
- **Context Compression**: Stay under 60k tokens via compression-restart pattern
- **Lazy-Loaded Skills**: 14+ skills across TypeScript, Rust, Python stacks
- **Automated Commits**: Conventional format after each phase
- **Bidirectional Links**: Full traceability (spec ↔ roadmap ↔ todos ↔ code)

## Quick Start

### 1. Install the Plugin

```bash
# Add the hivemind-ai marketplace
/plugin marketplace add git@github.com:skypuppy-labs/claude-hivemind-ai.git

# Install superagents
/plugin install superagents@hivemind-ai

# Restart Claude Code, then run setup
/setup
```

### 2. Create Your Spec

Add markdown files to `spec/` describing your requirements:
- `spec/requirements.md` - Functional requirements
- `spec/api.md` - API specifications
- `spec/database.md` - Data model requirements

### 3. Generate Roadmap

```bash
/update-roadmap
```

This analyzes your spec and creates:
- `.agents/ROADMAP.md` - Work chunks with dependencies
- `.agents/todos/*.md` - Individual work items

### 4. Start Working

```bash
/work
```

Executes the RPI cycle for the next todo:
1. **RESEARCH** - Gather context, analyze requirements
2. **RED** - Write failing tests
3. **GREEN** - Implement to pass tests
4. **REFACTOR** - Improve code quality
5. **ARCHITECTURE** - Update documentation

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | Initialize .agents directory and update CLAUDE.md |
| `/work` | Execute RPI workflow for next todo |
| `/backlog` | Add work items interactively |
| `/queue-add` | Move items from backlog to queue |
| `/queue-status` | Show current queue state |
| `/update-roadmap` | Regenerate roadmap from spec |
| `/fix-tests` | Systematic test repair |
| `/project-status` | Show current state and progress |
| `/janitor` | Clean up stale files and orphaned work items |

## Agents

### Master Agents (called by commands)

| Agent | Purpose | Output |
|-------|---------|--------|
| `explore-context` | Deep research | ~12k research file |
| `execute-red` | RED phase execution | ~1k summary |
| `execute-green` | GREEN phase execution | ~1k summary |
| `execute-refactor` | REFACTOR phase execution | ~1k summary |
| `update-architecture` | Sync documentation | ~1k summary |

### Internal Agents (called by phase agents)

| Agent | Purpose | Output |
|-------|---------|--------|
| `plan` | Phase-specific planning | ~10k plan |
| `execute-plan` | Minimal execution | ~500 bytes |
| `verify-results` | Objective verification | ~1k report |
| `git-commit` | Auto-commit | ~500 bytes |

### Supporting Agents

| Agent | Purpose |
|-------|---------|
| `spec-analyzer` | Parallel spec analysis |
| `roadmap-updater` | Roadmap synthesis |

## Skills

### TypeScript

| Skill | Description |
|-------|-------------|
| `api` | REST + type-safe APIs (Hono, tRPC) |
| `frontend-react` | React 19 + state management |
| `frontend-design` | Mantine v8 (365 component docs) |
| `pixi` | PixiJS games and media |
| `telegram-miniapp` | TMA.js + Preact |
| `telegram-bot` | grammY framework |
| `cli` | Bun CLI tools |
| `database` | Drizzle, Bun SQLite, SQLx |

### Rust

| Skill | Description |
|-------|-------------|
| `rust-services` | Axum + WebSocket |

### Python

| Skill | Description |
|-------|-------------|
| `python-service` | FastAPI services |
| `python-analytics` | Data science + ML |

### General

| Skill | Description |
|-------|-------------|
| `testing` | Test patterns |
| `debugging` | Systematic debugging |
| `refactoring` | Safe refactoring techniques |

## Architecture

### Context Flow

```
Master: 5k → 18k (research) → 8k (discard) → 9k (final)
Phase agents: 30-40k (fresh context per phase)
All under 60k target
```

### Agent Communication

Agents communicate via files in `.agents/`:
- Research → `.agents/research/{slug}.md`
- Plans → `.agents/plans/{slug}-{phase}.md`
- State → `.agents/work/{slug}/state.json`

### Directory Structure (after setup)

```
.agents/
├── ROADMAP.md           # Generated from spec
├── workflow.json        # Current workflow state
├── context/             # Phase-specific guidance
│   ├── phase-research.md
│   ├── phase-red.md
│   ├── phase-green.md
│   ├── phase-refactor.md
│   └── artifacts.md
├── patterns/            # Successful patterns
│   └── index.md
├── mistakes/            # Mistakes to avoid
│   └── index.md
├── research/            # Research artifacts
├── plans/               # Execution plans
├── todos/               # Work items
│   └── todo.md
└── work/                # Active work files

.claude/
├── agents/              # Subagent definitions
├── commands/            # User commands
├── hooks/               # Runtime enforcement
└── skills/              # Domain knowledge (14 skills)
```

## Workflow Phases

### RESEARCH
- Load work item details
- Analyze spec requirements
- Check patterns and mistakes
- Output: `.agents/research/{slug}.md`

### RED (Test-First)
- Write 1-5 tests per work item
- Tests must fail correctly
- No implementation code allowed
- Commit: `test(<scope>): description`

### GREEN (Implement)
- Pass one test at a time
- 100% pass rate required
- Zero type errors required
- Commit: `feat(<scope>): description`

### REFACTOR (Improve)
- One change at a time
- Tests must continue passing
- Behavior preserved
- Commit: `refactor(<scope>): description`

## Quality Gates

| Phase | Gate |
|-------|------|
| RESEARCH | Research artifact written |
| RED | Tests fail correctly |
| GREEN | 100% pass, zero type errors, integrated |
| REFACTOR | 100% pass, zero type errors |

## Configuration

After running `/setup-superagents`, your CLAUDE.md will be updated with the RPI workflow rules. You can customize:

- `.agents/context/*.md` - Phase guidance
- `.agents/patterns/` - Add successful patterns
- `.agents/mistakes/` - Document mistakes to avoid
- `.claude/skills/` - Add/modify domain skills

## License

MIT - Part of the Hivemind AI marketplace.
