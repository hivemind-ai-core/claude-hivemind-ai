#!/usr/bin/env bun

import * as fs from 'fs'
import * as path from 'path'
import {
  runHook,
  type PreToolUsePayload,
  type PreToolUseResponse,
  type UserPromptSubmitPayload,
  type UserPromptSubmitResponse,
  type SessionStartPayload,
  type SessionStartResponse,
  type StopPayload,
  type StopResponse,
  type SubagentStopPayload,
  type SubagentStopResponse,
  type PostToolUsePayload,
  type PostToolUseResponse,
  log,
} from './lib'

// Skill auto-activation keywords
const SKILL_KEYWORDS: Record<string, string[]> = {
  'api': ['api', 'endpoint', 'rest', 'trpc', 'hono', 'route'],
  'database': ['database', 'schema', 'migration', 'drizzle', 'sqlite', 'postgres', 'sql'],
  'frontend-react': ['react', 'component', 'hook', 'useState', 'useEffect'],
  'frontend-design': ['mantine', 'ui', 'design', 'style', 'theme', 'button', 'form', 'modal'],
  'pixi': ['pixi', 'game', 'sprite', 'canvas', 'render', 'animation'],
  'telegram-bot': ['telegram', 'bot', 'grammy', 'message', 'command'],
  'telegram-miniapp': ['tma', 'miniapp', 'mini app', 'telegram app'],
  'testing': ['test', 'vitest', 'jest', 'mock', 'assert', 'expect'],
  'debugging': ['debug', 'error', 'bug', 'fix', 'issue', 'problem'],
  'refactoring': ['refactor', 'clean', 'improve', 'restructure', 'rename'],
  'cli': ['cli', 'command line', 'terminal', 'argument', 'flag'],
  'rust-services': ['rust', 'axum', 'tokio', 'cargo'],
  'python-service': ['fastapi', 'python', 'pip', 'async'],
  'python-analytics': ['pandas', 'numpy', 'sklearn', 'data', 'analytics', 'ml'],
}

// Detect skills needed based on prompt keywords
function detectSkills(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase()
  const detectedSkills: string[] = []

  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      detectedSkills.push(skill)
    }
  }

  return detectedSkills
}

// Build additional context from detected skills
function buildSkillContext(skills: string[]): string {
  if (skills.length === 0) return ''

  const skillPaths = skills.map(skill => `.claude/skills/${skill}/SKILL.md`)
  return `\n\nRelevant skills detected: ${skills.join(', ')}\nConsider loading: ${skillPaths.join(', ')}`
}

// PreToolUse handler - validate workflow rules
const preToolUse = async (payload: PreToolUsePayload): Promise<PreToolUseResponse> => {
  const { tool_name, tool_input } = payload

  // For Edit/Write tools, we could enforce phase rules here
  // But for now, we'll let the agents handle this

  return {}
}

// UserPromptSubmit handler - auto-detect skills
const userPromptSubmit = async (payload: UserPromptSubmitPayload): Promise<UserPromptSubmitResponse> => {
  const { prompt } = payload

  // Detect relevant skills
  const detectedSkills = detectSkills(prompt)
  const skillContext = buildSkillContext(detectedSkills)

  // Build context files list
  const contextFiles: string[] = []

  // Always include core workflow files
  contextFiles.push('.agents/context/artifacts.md')

  // Add detected skill files
  for (const skill of detectedSkills) {
    contextFiles.push(`.claude/skills/${skill}/SKILL.md`)
  }

  return {
    decision: 'approve',
    contextFiles: contextFiles.length > 0 ? contextFiles : undefined,
    hookSpecificOutput: skillContext ? {
      hookEventName: 'UserPromptSubmit',
      additionalContext: skillContext,
    } : undefined,
  }
}

// SessionStart handler - welcome message
const sessionStart = async (payload: SessionStartPayload): Promise<SessionStartResponse> => {
  return {
    decision: 'approve',
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Superagents RPI workflow active. Commands: /work, /work-until, /update-roadmap, /project-status, /fix-tests`,
    },
  }
}

// Workflow state interface
interface WorkflowState {
  version?: string
  projectInitialized?: boolean
  initializedAt?: string
  currentPhase?: 'research' | 'red' | 'green' | 'refactor' | 'architecture' | null
  currentWorkItem?: string
  workUntil?: string  // New field: work item slug to work until
  workItemStartedAt?: string  // When the current work item started
  lastUpdated?: string
  completedItems?: string[]
  stats?: {
    totalWorkItems?: number
    completedWorkItems?: number
    totalTests?: number
    passingTests?: number
  }
}

// Todo file parsing
interface TodoItem {
  slug: string
  status: 'in-progress' | 'up-next' | 'completed'
  description: string
  section: 'In Progress' | 'Up Next' | 'Completed'
}

// Helper to read workflow.json
function readWorkflowState(cwd: string): WorkflowState | null {
  try {
    const workflowPath = path.join(cwd, '.agents', 'workflow.json')
    if (!fs.existsSync(workflowPath)) {
      return null
    }
    const content = fs.readFileSync(workflowPath, 'utf-8')
    return JSON.parse(content) as WorkflowState
  } catch (error) {
    log('Error reading workflow.json:', error)
    return null
  }
}

// Helper to write workflow.json
function writeWorkflowState(cwd: string, state: WorkflowState): boolean {
  try {
    const agentsDir = path.join(cwd, '.agents')
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true })
    }
    const workflowPath = path.join(agentsDir, 'workflow.json')
    fs.writeFileSync(workflowPath, JSON.stringify(state, null, 2))
    return true
  } catch (error) {
    log('Error writing workflow.json:', error)
    return false
  }
}

// Helper to parse todo.md and extract work items
function parseTodoFile(cwd: string): TodoItem[] {
  try {
    const todoPath = path.join(cwd, '.agents', 'todos', 'todo.md')
    if (!fs.existsSync(todoPath)) {
      return []
    }
    const content = fs.readFileSync(todoPath, 'utf-8')
    const items: TodoItem[] = []

    const sections: Array<{name: 'In Progress' | 'Up Next' | 'Completed', prefix: 'in-progress' | 'up-next' | 'completed'}> = [
      {name: 'In Progress', prefix: 'in-progress'},
      {name: 'Up Next', prefix: 'up-next'},
      {name: 'Completed', prefix: 'completed'},
    ]

    for (const section of sections) {
      // Find the section
      const sectionRegex = new RegExp(`##\\s*${section.name}\\s*([\\s\\S]*?)(?=##|$)`, 'i')
      const match = content.match(sectionRegex)
      if (!match) continue

      const sectionContent = match[1]

      // Extract work items (format: - [ ] **slug** - description or - [x] **slug** - description)
      const itemRegex = /-?\s*\[[ x]\]\s*\*\*([^*]+)\*\*\s*-?\s*(.+?)(?=\n|$)/gi
      let itemMatch
      while ((itemMatch = itemRegex.exec(sectionContent)) !== null) {
        items.push({
          slug: itemMatch[1].trim(),
          status: section.prefix,
          description: itemMatch[2].trim(),
          section: section.name,
        })
      }
    }

    return items
  } catch (error) {
    log('Error parsing todo.md:', error)
    return []
  }
}

// Helper to get the current work item from todo file
function getCurrentWorkItemFromTodo(cwd: string): string | null {
  const items = parseTodoFile(cwd)
  const inProgress = items.find(i => i.status === 'in-progress')
  return inProgress?.slug || null
}

// Helper to update workflow state from todo file
function syncWorkflowFromTodo(cwd: string, workflow: WorkflowState): void {
  const items = parseTodoFile(cwd)

  // Update completed items from todo file
  const completedSlugs = items
    .filter(i => i.status === 'completed')
    .map(i => i.slug)

  if (completedSlugs.length > 0) {
    workflow.completedItems = completedSlugs
  }

  // Update current work item if not set
  if (!workflow.currentWorkItem) {
    const currentSlug = getCurrentWorkItemFromTodo(cwd)
    if (currentSlug) {
      workflow.currentWorkItem = currentSlug
      workflow.workItemStartedAt = new Date().toISOString()
    }
  }

  workflow.lastUpdated = new Date().toISOString()
}

// Stop handler - check if work should continue
const stop = async (payload: StopPayload): Promise<StopResponse> => {
  const { session_id, transcript_path } = payload

  // Extract cwd from transcript_path (transcript is in .claude/transcripts/)
  const cwd = path.dirname(path.dirname(transcript_path))

  let workflow = readWorkflowState(cwd)

  // If no workflow state, create it and sync from todo
  if (!workflow) {
    workflow = {
      version: '1.0.0',
      projectInitialized: true,
      initializedAt: new Date().toISOString(),
      currentPhase: null,
      currentWorkItem: undefined,
      completedItems: [],
      stats: { totalWorkItems: 0, completedWorkItems: 0, totalTests: 0, passingTests: 0 },
    }
  }

  // Always sync from todo file to get latest state
  syncWorkflowFromTodo(cwd, workflow)

  // Write updated state
  writeWorkflowState(cwd, workflow)

  // If no workUntil set, allow stop
  if (!workflow.workUntil) {
    return {}
  }

  const { workUntil, currentWorkItem, completedItems = [] } = workflow

  // Check if the target work item is completed
  const targetCompleted = completedItems.includes(workUntil)

  // Check if current work item matches the target
  const isCurrentTarget = currentWorkItem === workUntil

  // Allow stop if:
  // 1. Target work item is completed, OR
  // 2. We're not currently working on anything (idle state)
  if (targetCompleted || (!currentWorkItem && !isCurrentTarget)) {
    // Clear workUntil if target is reached
    if (targetCompleted) {
      workflow.workUntil = undefined
      writeWorkflowState(cwd, workflow)
    }
    return {}
  }

  // Block the stop - work should continue
  let reason = `Work until '${workUntil}' is active.`

  if (currentWorkItem) {
    reason += ` Currently working on: ${currentWorkItem} (phase: ${workflow.currentPhase || 'unknown'}). Run /work to continue.`
  } else {
    reason += ` Run /work to continue.`
  }

  return {
    decision: 'block',
    reason,
  }
}

// PostToolUse handler - track phase progress via commits and tool usage
const postToolUse = async (payload: PostToolUsePayload): Promise<PostToolUseResponse> => {
  const { tool_name, tool_input, transcript_path } = payload

  // Only track specific tools that indicate phase transitions
  if (tool_name !== 'Bash') {
    return {}
  }

  const input = tool_input as { command?: string }
  const command = input?.command || ''

  // Extract cwd from transcript_path
  const cwd = path.dirname(path.dirname(transcript_path))

  // Detect git commits - they indicate phase completion
  const commitMatch = command.match(/git\s+commit\s+-m\s+["'](.+?)["']/i)
  if (commitMatch) {
    const commitMsg = commitMatch[1]

    const workflow = readWorkflowState(cwd)
    if (!workflow) {
      return {}
    }

    // Update phase based on commit message convention
    // test(...) -> RED phase done
    // feat(...) -> GREEN phase done
    // refactor(...) -> REFACTOR phase done
    // docs(...) update architecture -> ARCHITECTURE phase done (work item complete!)

    if (commitMsg.match(/^test\(/i)) {
      workflow.currentPhase = 'red'
    } else if (commitMsg.match(/^feat\(/i)) {
      workflow.currentPhase = 'green'
    } else if (commitMsg.match(/^refactor\(/i)) {
      workflow.currentPhase = 'refactor'
    } else if (commitMsg.match(/^docs\(.+:\s*update\s+architecture/i)) {
      // Architecture update complete - work item is done!
      workflow.currentPhase = 'architecture'

      if (workflow.currentWorkItem) {
        // Add to completed items
        if (!workflow.completedItems) {
          workflow.completedItems = []
        }
        if (!workflow.completedItems.includes(workflow.currentWorkItem)) {
          workflow.completedItems.push(workflow.currentWorkItem)
        }

        // Clear current work item
        workflow.currentWorkItem = undefined
        workflow.workItemStartedAt = undefined

        // Update stats
        if (workflow.stats) {
          workflow.stats.completedWorkItems = workflow.completedItems.length
        }

        writeWorkflowState(cwd, workflow)
        log(`Work item completed: ${workflow.currentWorkItem}`)
      }
    }

    workflow.lastUpdated = new Date().toISOString()
    writeWorkflowState(cwd, workflow)
  }

  return {}
}

// SubagentStop handler - detect when agents complete
const subagentStop = async (payload: SubagentStopPayload): Promise<SubagentStopResponse> => {
  const { transcript_path } = payload

  // Extract cwd from transcript_path
  const cwd = path.dirname(path.dirname(transcript_path))

  // Sync workflow state from todo file when an agent stops
  // This ensures we catch any changes made by agents
  const workflow = readWorkflowState(cwd)
  if (workflow) {
    syncWorkflowFromTodo(cwd, workflow)
    writeWorkflowState(cwd, workflow)
  }

  return {}
}

// Run the hook
runHook({
  preToolUse,
  userPromptSubmit,
  sessionStart,
  stop,
  postToolUse,
  subagentStop,
})
