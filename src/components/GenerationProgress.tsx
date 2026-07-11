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

// ── Pipeline Step Definitions ──

const PIPELINE_STEPS = [
  { key: 'planner', label: 'Planificateur', icon: 'account_tree' },
  { key: 'writer', label: 'Redacteur', icon: 'edit_note' },
  { key: 'uml', label: 'UML', icon: 'schema' },
  { key: 'tables', label: 'Tableaux', icon: 'table_chart' },
  { key: 'reviewer', label: 'Relecteur', icon: 'fact_check' },
] as const

// ── State Mapping ──

function mapToAgentStatus(status: string): 'idle' | 'thinking' | 'writing' | 'done' | 'error' {
  switch (status) {
    case 'thinking':
    case 'structuring':
      return 'thinking'
    case 'writing':
    case 'rescoping':
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
        sectionTitle: currentSectionTitle(e.agent, events),
        tokenCount: existing?.tokenCount ?? 0,
        errorMessage: e.message,
      })
    }
  }

  return agents
}

function currentSectionTitle(agent: string, events: HermesEvent[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'agent_status' && e.agent === agent && e.section_title) {
      return e.section_title
    }
  }
  return undefined
}

// ── Helper: derive pipeline stage from events ──

function derivePipelineStage(events: HermesEvent[]): string {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'context_updated' && e.key === 'pipelineStage') {
      return e.value as string
    }
  }
  return 'planner'
}

function deriveCompletedSteps(events: HermesEvent[]): Set<string> {
  const completed = new Set<string>()
  for (const e of events) {
    if (e.type === 'agent_status') {
      const step = e.agent.toLowerCase()
      if (PIPELINE_STEPS.some(s => s.key === step) && e.status === 'done') {
        completed.add(step)
      }
    }
  }
  return completed
}

// ── Pipeline Progress Bar ──

function PipelineProgress({ currentStage, completedSteps }: { currentStage: string; completedSteps: Set<string> }) {
  const currentIndex = PIPELINE_STEPS.findIndex(s => s.key === currentStage)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1">
        {PIPELINE_STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.key)
          const isCurrent = step.key === currentStage
          const isPending = !isCompleted && !isCurrent

          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold flex-shrink-0
                  ${isCompleted ? 'bg-status-final text-white' : ''}
                  ${isCurrent ? 'bg-ai-vibrant text-white animate-pulse' : ''}
                  ${isPending ? 'bg-surface-alt text-on-surface-variant' : ''}
                `}
              >
                {isCompleted ? (
                  <Icon name="check" className="text-[12px]" />
                ) : (
                  <Icon name={step.icon} className="text-[12px]" />
                )}
              </div>
              <span className={`font-label-sm text-[10px] hidden sm:inline ${isCurrent ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`h-[2px] flex-1 min-w-[8px] ${isCompleted ? 'bg-status-final' : 'bg-surface-alt'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Component ──

export function GenerationProgress({ events, isStreaming }: GenerationProgressProps) {
  const agentStates = useMemo(() => deriveAgentStates(events), [events])
  const pipelineStage = useMemo(() => derivePipelineStage(events), [events])
  const completedSteps = useMemo(() => deriveCompletedSteps(events), [events])

  // Nothing to show
  if (!isStreaming && events.length === 0) {
    return null
  }

  const agentList = Array.from(agentStates.values())
  const activeCount = agentList.filter((a) => a.status !== 'done' && a.status !== 'error').length
  const sectionCount = events.filter((e) => e.type === 'section_complete').length
  const totalTokens = agentList.reduce((sum, a) => sum + a.tokenCount, 0)

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
              {sectionCount} section{sectionCount > 1 ? 's' : ''} cree{sectionCount > 1 ? 'es' : 'e'}
            </p>
          )}
          {totalTokens > 0 && (
            <p className="font-label-sm text-[10px] text-on-surface-variant">
              {totalTokens} token{totalTokens > 1 ? 's' : ''} generes
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

      <PipelineProgress currentStage={pipelineStage} completedSteps={completedSteps} />

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
            {!agent.sectionTitle && !agent.errorMessage && agent.status === 'structuring' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Structuration du plan...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && agent.status === 'rescoping' && (
              <p className="text-[12px] text-status-review font-label-sm">
                Correction de qualite...
              </p>
            )}
          </AgentStatus>
        ))}
      </div>
    </div>
  )
}

export default GenerationProgress
