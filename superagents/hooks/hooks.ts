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

// Helper to check if queued.md has items
function getNextQueuedItem(cwd: string): string | null {
  try {
    const queuedPath = path.join(cwd, '.agents', 'work', 'queued.md')
    if (!fs.existsSync(queuedPath)) {
      return null
    }
    const content = fs.readFileSync(queuedPath, 'utf-8')

    // Look for items in format: - **slug** -- description
    const match = content.match(/^- \*\*([^*]+)\*\*/m)
    return match ? match[1].trim() : null
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

// Stop handler - check if work queue has pending items
const stop = async (payload: StopPayload): Promise<StopResponse> => {
  const { transcript_path } = payload

  // Extract cwd from transcript_path (transcript is in .claude/transcripts/)
  const cwd = transcript_path
    ? path.dirname(path.dirname(transcript_path))
    : process.cwd()

  const nextItem = getNextQueuedItem(cwd)

  if (!nextItem) {
    return {} // Queue empty, allow stop
  }

  return {
    decision: 'block',
    reason: `Queue has items. Next: "${nextItem}". Read .agents/context/work.md and continue. Do not ask the user.`,
  }
}

// SubagentStop handler - same logic as Stop
const subagentStop = async (payload: SubagentStopPayload): Promise<SubagentStopResponse> => {
  const { transcript_path } = payload

  const cwd = transcript_path
    ? path.dirname(path.dirname(transcript_path))
    : process.cwd()

  const nextItem = getNextQueuedItem(cwd)

  if (!nextItem) {
    return {}
  }

  return {
    decision: 'block',
    reason: `Queue has items. Next: "${nextItem}". Continue workflow. Do not ask the user.`,
  }
}

// Run the hook
runHook({
  sessionStart,
  preToolUse,
  stop,
  subagentStop,
})
