import { useMemo } from 'react'
import { AgentStatus } from './AgentStatus'
import Icon from './Icon'
import type { HermesEvent } from '../hooks/useQueries'

// ── Types ──

export interface GenerationProgressProps {
  events: HermesEvent[]
  isStreaming: boolean
}

interface AgentState {
  name: string
  status: string
  section?: string
  sectionTitle?: string
  tokenCount: number
  errorMessage?: string
}

// ── State Mapping ──

function mapToAgentStatus(status: string): 'idle' | 'thinking' | 'writing' | 'done' | 'error' {
  switch (status) {
    case 'thinking':
      return 'thinking'
    case 'writing':
      return 'writing'
    case 'done':
      return 'done'
    case 'error':
      return 'error'
    default:
      return 'idle'
  }
}

// ── Helper: derive agent state map from events ──

function deriveAgentStates(events: HermesEvent[]): Map<string, AgentState> {
  const agents = new Map<string, AgentState>()

  for (const e of events) {
    if (e.type === 'agent_status') {
      const existing = agents.get(e.agent)
      agents.set(e.agent, {
        name: e.agent,
        status: e.status,
        section: e.section ?? existing?.section,
        sectionTitle: e.section_title ?? existing?.sectionTitle,
        tokenCount: existing?.tokenCount ?? 0,
        errorMessage: existing?.errorMessage,
      })
    } else if (e.type === 'token') {
      const existing = agents.get(e.agent)
      agents.set(e.agent, {
        name: e.agent,
        status: 'writing',
        section: existing?.section,
        sectionTitle: existing?.sectionTitle,
        tokenCount: (existing?.tokenCount ?? 0) + 1,
        errorMessage: existing?.errorMessage,
      })
    } else if (e.type === 'generation_error') {
      const existing = agents.get(e.agent)
      agents.set(e.agent, {
        name: e.agent,
        status: 'error',
        section: existing?.section,
        sectionTitle: existing?.sectionTitle,
        tokenCount: existing?.tokenCount ?? 0,
        errorMessage: e.message,
      })
    }
  }

  return agents
}

// ── Component ──

export function GenerationProgress({ events, isStreaming }: GenerationProgressProps) {
  const agentStates = useMemo(() => deriveAgentStates(events), [events])

  // Nothing to show
  if (!isStreaming && events.length === 0) {
    return null
  }

  const agentList = Array.from(agentStates.values())
  const activeCount = agentList.filter((a) => a.status !== 'done' && a.status !== 'error').length
  const sectionCount = events.filter((e) => e.type === 'section_complete').length

  // Completion summary when stream ended
  if (!isStreaming && events.length > 0) {
    return (
      <div className="p-gutter border-b border-outline-variant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">
            Orchestrateur IA
          </h3>
          <span className="bg-status-final/10 text-status-final font-label-sm text-label-sm px-2 py-0.5 rounded">
            TERMINE
          </span>
        </div>
        <div className="text-center py-4 space-y-2">
          <Icon name="check_circle" className="text-[32px] mx-auto text-status-final" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Generation terminee
          </p>
          {sectionCount > 0 && (
            <p className="font-label-sm text-[10px] text-on-surface-variant">
              {sectionCount} section{sectionCount > 1 ? 's' : ''} creee{sectionCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Active streaming view
  return (
    <div className="p-gutter border-b border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">
          Orchestrateur IA
        </h3>
        <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">
          {activeCount} ACTIF{activeCount !== 1 ? 'S' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {agentList.map((agent) => (
          <AgentStatus
            key={agent.name}
            name={agent.name}
            state={mapToAgentStatus(agent.status)}
            progress={
              agent.tokenCount > 0
                ? Math.min(95, Math.round(agent.tokenCount / 3))
                : undefined
            }
          >
            {agent.sectionTitle && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                {agent.sectionTitle}
              </p>
            )}
            {agent.errorMessage && (
              <p className="text-[12px] text-status-review font-label-sm">
                {agent.errorMessage}
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && agent.status === 'thinking' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Analyse en cours...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && agent.status === 'writing' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Redaction en cours...
              </p>
            )}
          </AgentStatus>
        ))}
      </div>
    </div>
  )
}

export default GenerationProgress
