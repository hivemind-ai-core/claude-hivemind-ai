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
  'diagrams': ['diagram', 'mermaid', 'flowchart', 'sequence', 'er diagram', 'state diagram', 'class diagram', 'visualization', 'chart', 'architecture diagram'],
}

// Detect skills needed based on prompt keywords
// Requires 2+ keyword matches to reduce false positives from common words
function detectSkills(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase()
  const detectedSkills: string[] = []

  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => lowerPrompt.includes(keyword)).length
    // Require 2+ matches to activate skill (reduces noise from common words like "test", "api")
    if (matchCount >= 2) {
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
  const { tool_name, tool_input, session_id } = payload

  // Only enforce for Edit/Write tools
  if (tool_name !== 'Edit' && tool_name !== 'Write') {
    return {}
  }

  const input = tool_input as { file_path?: string }
  const filePath = input?.file_path || ''

  // Skip enforcement for .agents directory (workflow files)
  if (filePath.includes('.agents/') || filePath.includes('.agents\\')) {
    return {}
  }

  // Try to get workflow state (need cwd from session or default)
  // Note: preToolUse doesn't have transcript_path, so we try common locations
  const possibleCwds = [process.cwd(), '.']
  let workflow: WorkflowState | null = null

  for (const cwd of possibleCwds) {
    workflow = readWorkflowState(cwd)
    if (workflow) break
  }

  if (!workflow?.currentPhase) {
    return {} // No active phase, allow all edits
  }

  const isTestFile = filePath.includes('.test.') ||
                     filePath.includes('.spec.') ||
                     filePath.includes('__tests__')

  // RED phase: only allow test file edits
  if (workflow.currentPhase === 'red' && !isTestFile) {
    return {
      decision: 'block',
      reason: `RED phase active: only test files can be edited. Current file: ${filePath}. Edit a .test.ts file instead or complete RED phase first.`
    }
  }

  // GREEN phase: don't modify test files
  if (workflow.currentPhase === 'green' && isTestFile) {
    return {
      decision: 'block',
      reason: `GREEN phase active: test files cannot be modified. Tests define the spec. Fix implementation code instead.`
    }
  }

  return {}
}

// UserPromptSubmit handler - auto-detect skills
const userPromptSubmit = async (payload: UserPromptSubmitPayload): Promise<UserPromptSubmitResponse> => {
  const { prompt } = payload
  const lowerPrompt = prompt.toLowerCase()

  // Detect relevant skills
  const detectedSkills = detectSkills(prompt)
  const skillContext = buildSkillContext(detectedSkills)

  // Build context files list
  const contextFiles: string[] = []

  // Only include workflow files for workflow-related prompts
  const isWorkflowPrompt = lowerPrompt.includes('/work') ||
                           lowerPrompt.includes('todo') ||
                           lowerPrompt.includes('research') ||
                           lowerPrompt.includes('phase') ||
                           lowerPrompt.includes('roadmap') ||
                           lowerPrompt.includes('rpi')

  if (isWorkflowPrompt) {
    contextFiles.push('.agents/context/artifacts.md')
  }

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
      additionalContext: `Superagents RPI workflow active. Commands: /work, /backlog, /queue-add, /queue-status, /update-roadmap, /project-status, /fix-tests, /janitor`,
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

// Queue file parsing
// Items in queued.md - either in progress or up next
interface QueuedItem {
  slug: string
  status: 'in-progress' | 'up-next'
  description: string
  section: 'In Progress' | 'Up Next'
}

// Backlog item from backlog.md
interface BacklogItem {
  slug: string
  priority: 'high' | 'medium' | 'low'
  description: string
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

// Helper to parse queued.md and extract work items
function parseQueuedFile(cwd: string): QueuedItem[] {
  try {
    const queuedPath = path.join(cwd, '.agents', 'work', 'queued.md')
    if (!fs.existsSync(queuedPath)) {
      return []
    }
    const content = fs.readFileSync(queuedPath, 'utf-8')
    const items: QueuedItem[] = []

    // Parse In Progress and Up Next sections
    const sections: Array<{name: 'In Progress' | 'Up Next', prefix: 'in-progress' | 'up-next'}> = [
      {name: 'In Progress', prefix: 'in-progress'},
      {name: 'Up Next', prefix: 'up-next'},
    ]

    for (const section of sections) {
      // Find the section
      const sectionRegex = new RegExp(`##\\s*${section.name}\\s*([\\s\\S]*?)(?=##|$)`, 'i')
      const match = content.match(sectionRegex)
      if (!match) continue

      const sectionContent = match[1]

      // Extract work items (format: - **slug** -- description)
      const itemRegex = /-\s*\*\*([^*]+)\*\*\s*--?\s*(.+?)(?=\n|$)/gi
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
    log('Error parsing queued.md:', error)
    return []
  }
}

// Legacy support: parse old todo.md format (for migration)
function parseTodoFile(cwd: string): QueuedItem[] {
  try {
    const todoPath = path.join(cwd, '.agents', 'todos', 'todo.md')
    if (!fs.existsSync(todoPath)) {
      return []
    }
    const content = fs.readFileSync(todoPath, 'utf-8')
    const items: QueuedItem[] = []

    const sections: Array<{name: 'In Progress' | 'Up Next', prefix: 'in-progress' | 'up-next'}> = [
      {name: 'In Progress', prefix: 'in-progress'},
      {name: 'Up Next', prefix: 'up-next'},
    ]

    for (const section of sections) {
      const sectionRegex = new RegExp(`##\\s*${section.name}\\s*([\\s\\S]*?)(?=##|$)`, 'i')
      const match = content.match(sectionRegex)
      if (!match) continue

      const sectionContent = match[1]
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

// Helper to get the current work item from queue file
function getCurrentWorkItemFromQueue(cwd: string): string | null {
  // Try new queued.md first
  let items = parseQueuedFile(cwd)
  if (items.length === 0) {
    // Fallback to legacy todo.md
    items = parseTodoFile(cwd)
  }
  const inProgress = items.find(i => i.status === 'in-progress')
  return inProgress?.slug || null
}

// Helper to check if there are pending items in the queue
function hasQueuedItems(cwd: string): { hasPending: boolean; count: number; items: string[] } {
  let items = parseQueuedFile(cwd)
  if (items.length === 0) {
    items = parseTodoFile(cwd)
  }
  const upNext = items.filter(i => i.status === 'up-next')
  return {
    hasPending: upNext.length > 0,
    count: upNext.length,
    items: upNext.map(i => i.slug),
  }
}

// Helper to check if a work item is archived (completed)
function isWorkItemArchived(cwd: string, slug: string): boolean {
  try {
    const donePath = path.join(cwd, '.agents', 'archive', 'done.md')
    if (!fs.existsSync(donePath)) {
      return false
    }
    const content = fs.readFileSync(donePath, 'utf-8')
    // Check if the slug appears as a completed item header
    const headerRegex = new RegExp(`^###\\s+${slug}\\s*$`, 'm')
    return headerRegex.test(content)
  } catch (error) {
    log('Error checking archive:', error)
    return false
  }
}

// Helper to update workflow state from queue file
function syncWorkflowFromQueue(cwd: string, workflow: WorkflowState): void {
  // Update current work item if not set
  if (!workflow.currentWorkItem) {
    const currentSlug = getCurrentWorkItemFromQueue(cwd)
    if (currentSlug) {
      workflow.currentWorkItem = currentSlug
      workflow.workItemStartedAt = new Date().toISOString()
    }
  }

  workflow.lastUpdated = new Date().toISOString()
}

// Stop handler - check if work queue has pending items
const stop = async (payload: StopPayload): Promise<StopResponse> => {
  const { session_id, transcript_path } = payload

  // Extract cwd from transcript_path (transcript is in .claude/transcripts/)
  const cwd = path.dirname(path.dirname(transcript_path))

  let workflow = readWorkflowState(cwd)

  // If no workflow state, create it and sync from queue
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

  // Always sync from queue file to get latest state
  syncWorkflowFromQueue(cwd, workflow)

  // Write updated state
  writeWorkflowState(cwd, workflow)

  // Check if there are items in the queue
  const queueStatus = hasQueuedItems(cwd)
  const { currentWorkItem, currentPhase } = workflow

  // Allow stop if:
  // 1. No items in "Up Next" queue AND no work in progress
  if (!queueStatus.hasPending && !currentWorkItem) {
    return {}
  }

  // Block the stop - there are queued items to process
  // The reason is the PROMPT that tells Claude what to do next
  let reason = ''

  if (currentWorkItem) {
    reason = `Work item "${currentWorkItem}" in progress (phase: ${currentPhase || 'research'}). `
    reason += `Read .agents/context/work.md and continue from current phase. Do not ask the user.`
  } else if (queueStatus.hasPending) {
    reason = `${queueStatus.count} item${queueStatus.count > 1 ? 's' : ''} queued. Next: "${queueStatus.items[0]}". `
    reason += `Read .agents/context/work.md and follow the workflow. Do not ask the user.`
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
      // Note: The archive-work agent will handle:
      // - Removing item from todo.md and ROADMAP.md
      // - Moving artifacts to archive
      // - Adding entry to done.md
      // - Clearing workflow state
      workflow.currentPhase = 'architecture'

      if (workflow.currentWorkItem) {
        const completedItem = workflow.currentWorkItem
        // Clear current work item - archive-work agent will handle the rest
        workflow.currentWorkItem = undefined
        workflow.workItemStartedAt = undefined
        workflow.currentPhase = null

        writeWorkflowState(cwd, workflow)
        log(`Work item completed: ${completedItem} - archive-work agent will handle archiving`)
      }
    }

    workflow.lastUpdated = new Date().toISOString()
    writeWorkflowState(cwd, workflow)
  }

  return {}
}

// SubagentStop handler - detect when agents complete and enforce queue processing
const subagentStop = async (payload: SubagentStopPayload): Promise<SubagentStopResponse> => {
  const { transcript_path } = payload

  // Extract cwd from transcript_path
  const cwd = path.dirname(path.dirname(transcript_path))

  // Sync workflow state from queue file when an agent stops
  let workflow = readWorkflowState(cwd)
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

  syncWorkflowFromQueue(cwd, workflow)
  writeWorkflowState(cwd, workflow)

  // Check if there are items in the queue - block stop if so
  const queueStatus = hasQueuedItems(cwd)
  const { currentWorkItem, currentPhase } = workflow

  // Allow stop only if queue is empty AND no work in progress
  if (!queueStatus.hasPending && !currentWorkItem) {
    return {}
  }

  // Block the stop - there are more items to process
  // The reason is the PROMPT that tells Claude what to do next
  let reason = ''

  if (currentWorkItem) {
    reason = `Work item "${currentWorkItem}" in progress (phase: ${currentPhase || 'research'}). `
    reason += `Follow .agents/context/work.md. Spawn next phase agent. Do not ask the user.`
  } else if (queueStatus.hasPending) {
    reason = `${queueStatus.count} item${queueStatus.count > 1 ? 's' : ''} queued. Next: "${queueStatus.items[0]}". `
    reason += `Follow .agents/context/work.md workflow. Do not ask the user.`
  }

  return {
    decision: 'block',
    reason,
  }
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
