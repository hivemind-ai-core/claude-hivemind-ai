#!/usr/bin/env bun

import * as fs from 'fs'
import * as path from 'path'
import {
  runHook,
  type PreToolUsePayload,
  type PreToolUseResponse,
  type SessionStartPayload,
  type SessionStartResponse,
  type StopPayload,
  type StopResponse,
  type SubagentStopPayload,
  type SubagentStopResponse,
  log,
} from './lib'

// Minimal workflow state - just phase tracking
interface WorkflowState {
  version?: string
  currentPhase?: 'research' | 'red' | 'green' | 'refactor' | null
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

// Helper to extract items from a specific section of queued.md
function getItemsInSection(content: string, sectionName: string): string | null {
  const sectionRegex = new RegExp(`## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`)
  const match = content.match(sectionRegex)
  if (!match) return null

  const sectionContent = match[1]
  const itemMatch = sectionContent.match(/^- \*\*([^*]+)\*\*/m)
  return itemMatch ? itemMatch[1].trim() : null
}

// Helper to check if queued.md has pending or in-progress items
function getNextQueuedItem(cwd: string): { slug: string; status: 'in_progress' | 'pending' } | null {
  try {
    const queuedPath = path.join(cwd, '.agents', 'work', 'queued.md')
    if (!fs.existsSync(queuedPath)) {
      return null
    }
    const content = fs.readFileSync(queuedPath, 'utf-8')

    // First check "In Progress" - if something is there, it needs to be finished
    const inProgress = getItemsInSection(content, 'In Progress')
    if (inProgress) {
      return { slug: inProgress, status: 'in_progress' }
    }

    // Then check "Up Next" for pending items
    const upNext = getItemsInSection(content, 'Up Next')
    if (upNext) {
      return { slug: upNext, status: 'pending' }
    }

    return null
  } catch (error) {
    log('Error reading queued.md:', error)
    return null
  }
}

// SessionStart handler - welcome message
const sessionStart = async (_payload: SessionStartPayload): Promise<SessionStartResponse> => {
  return {
    decision: 'approve',
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Superagents RPI workflow active. Commands: /work, /backlog, /queue-add, /queue-status, /update-roadmap, /project-status, /fix-tests, /janitor`,
    },
  }
}

// PreToolUse handler - enforce phase rules
const preToolUse = async (payload: PreToolUsePayload): Promise<PreToolUseResponse> => {
  const { tool_name, tool_input } = payload

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

  // Try to find workflow.json from current directory
  const workflow = readWorkflowState(process.cwd())

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
      reason: `RED phase: only test files can be edited. Current file: ${filePath}. Edit a .test.ts file instead.`
    }
  }

  // GREEN phase: don't modify test files
  if (workflow.currentPhase === 'green' && isTestFile) {
    return {
      decision: 'block',
      reason: `GREEN phase: test files cannot be modified. Tests define the spec. Fix implementation code instead.`
    }
  }

  return {}
}

// Stop handler - check if work queue has pending or in-progress items
const stop = async (payload: StopPayload): Promise<StopResponse> => {
  const { transcript_path } = payload

  // Extract cwd from transcript_path (transcript is in .claude/transcripts/)
  const cwd = transcript_path
    ? path.dirname(path.dirname(transcript_path))
    : process.cwd()

  const queueItem = getNextQueuedItem(cwd)

  if (!queueItem) {
    return {} // Queue empty, allow stop
  }

  if (queueItem.status === 'in_progress') {
    return {
      decision: 'block',
      reason: `Work item "${queueItem.slug}" is still in progress. Continue the workflow phases (RED → GREEN → REFACTOR → archive). Read .agents/context/work.md if needed.`,
    }
  }

  return {
    decision: 'block',
    reason: `Queue has pending items. Next: "${queueItem.slug}". Read .agents/context/work.md and continue. Do not ask the user.`,
  }
}

// SubagentStop handler - subagents should always be allowed to stop
// (orchestration happens in main Claude, not subagents)
const subagentStop = async (_payload: SubagentStopPayload): Promise<SubagentStopResponse> => {
  // Subagents complete their specific task and return.
  // Main Claude orchestrates continuation based on Stop hook.
  return {}
}

// Run the hook
runHook({
  sessionStart,
  preToolUse,
  stop,
  subagentStop,
})
