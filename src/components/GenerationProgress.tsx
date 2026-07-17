import { useMemo, useState, useEffect, useRef } from 'react'
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

const STALL_THRESHOLD_MS = 60_000 // 60 seconds without tokens = stalled

export function GenerationProgress({ events, isStreaming }: GenerationProgressProps) {
  const agentStates = useMemo(() => deriveAgentStates(events), [events])
  const pipelineStage = useMemo(() => derivePipelineStage(events), [events])
  const completedSteps = useMemo(() => deriveCompletedSteps(events), [events])

  // Extract elapsed time from done event
  const elapsedMs = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type === 'done' && (e as any).elapsed_ms) {
        return (e as any).elapsed_ms as number
      }
    }
    return null
  }, [events])

  // Live timer for active streaming
  const startTime = useMemo(() => {
    const first = events[0]
    if (first) return new Date((first as any).timestamp ?? Date.now()).getTime()
    return Date.now()
  }, [events])
  const [liveElapsed, setLiveElapsed] = useState(0)
  useEffect(() => {
    if (!isStreaming) return
    const interval = setInterval(() => {
      setLiveElapsed(Date.now() - startTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [isStreaming, startTime])

  // Track last token timestamp per agent for stall detection
  const lastTokenTime = useRef<Map<string, number>>(new Map())
  const [stalledAgents, setStalledAgents] = useState<Set<string>>(new Set())

  useEffect(() => {
    const now = Date.now()
    // Only check the LATEST token event per agent, not the entire history
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type === 'token' && e.agent && !lastTokenTime.current.has(e.agent)) {
        lastTokenTime.current.set(e.agent, now)
      }
    }
    // Also update from the most recent event directly
    const last = events[events.length - 1]
    if (last?.type === 'token' && (last as any).agent) {
      lastTokenTime.current.set((last as any).agent, now)
    }
    // Check for stalled agents
    const stalled = new Set<string>()
    for (const [agent, lastTime] of lastTokenTime.current.entries()) {
      const state = agentStates.get(agent)
      if (state && (state.status === 'writing' || state.status === 'thinking') && now - lastTime > STALL_THRESHOLD_MS) {
        stalled.add(agent)
      }
    }
    setStalledAgents(stalled)
  }, [events, agentStates])

  // ── Global section progress ──

  const sectionCompleted = events.filter((e) => e.type === 'section_complete').length
  const totalSections = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if (e.type === 'context_updated' && (e as any).key === 'totalSections') {
        return (e as any).value as number
      }
      if (e.type === 'agent_status' && (e as any).sections_created) {
        return (e as any).sections_created as number
      }
    }
    return sectionCompleted
  }, [events, sectionCompleted])
  const sectionProgress = totalSections > 0 ? Math.round((sectionCompleted / totalSections) * 100) : 0

  // ── Current pipeline stage label ──

  const stageLabel = useMemo(() => {
    const step = PIPELINE_STEPS.find((s) => s.key === pipelineStage)
    return step?.label ?? pipelineStage
  }, [pipelineStage])

  // Nothing to show
  if (!isStreaming && events.length === 0) {
    return null
  }

  const agentList = Array.from(agentStates.values())
  const activeCount = agentList.filter((a) => a.status !== 'done' && a.status !== 'error').length
  const totalTokens = agentList.reduce((sum, a) => sum + a.tokenCount, 0)

  // Completion summary when stream ended
  if (!isStreaming && events.length > 0) {
    const hasErrors = agentList.some((a) => a.status === 'error')
    const errorCount = agentList.filter((a) => a.status === 'error').length
    return (
      <div className="p-gutter border-b border-outline-variant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">
            Orchestrateur IA
          </h3>
          {hasErrors ? (
            <span className="bg-status-review/10 text-status-review font-label-sm text-label-sm px-2 py-0.5 rounded">
              TERMINE AVEC ERREURS
            </span>
          ) : (
            <span className="bg-status-final/10 text-status-final font-label-sm text-label-sm px-2 py-0.5 rounded">
              TERMINE
            </span>
          )}
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-label-sm text-on-surface-variant mb-1">
            <span>Progression</span>
            <span>{sectionCompleted}/{totalSections} sections</span>
          </div>
          <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-status-final transition-all duration-500 ease-out rounded-full"
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
        <div className="text-center py-4 space-y-2">
          {hasErrors ? (
            <>
              <Icon name="warning" className="text-[32px] mx-auto text-status-review" />
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {errorCount} agent{errorCount > 1 ? 's' : ''} en erreur
              </p>
            </>
          ) : (
            <>
              <Icon name="check_circle" className="text-[32px] mx-auto text-status-final" />
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Generation terminee
              </p>
            </>
          )}
          {totalTokens > 0 && (
            <p className="font-label-sm text-[10px] text-on-surface-variant">
              ~{totalTokens} token{totalTokens > 1 ? 's' : ''} generes
            </p>
          )}
          {elapsedMs !== null && (
            <p className="font-label-sm text-[10px] text-on-surface-variant">
              Duree: {Math.floor(elapsedMs / 60000)}min {Math.round((elapsedMs % 60000) / 1000)}s
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
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-[10px] text-on-surface-variant tabular-nums">
            {Math.floor(liveElapsed / 60000)}:{String(Math.floor((liveElapsed % 60000) / 1000)).padStart(2, '0')}
          </span>
          <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">
            {activeCount} ACTIF{activeCount !== 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {/* Global section progress bar */}
      {(sectionCompleted > 0 || totalSections > 0) && (
        <div className="mb-4">
          <div className="flex justify-between text-label-sm text-on-surface-variant mb-1">
            <span>Progression document</span>
            <span>
              {sectionCompleted}/{totalSections}
              {sectionProgress === 100 && (
                <span className="ml-1 text-status-final inline-flex items-center gap-0.5">
                  <Icon name="check_circle" className="text-[12px]" />
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                sectionProgress === 100 ? 'bg-status-final' : 'bg-ai-vibrant'
              }`}
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current stage indicator */}
      <div className="mb-3 px-3 py-2 bg-ai-vibrant/5 rounded-lg border border-ai-vibrant/10">
        <div className="flex items-center gap-2 text-label-sm">
          <span className="w-2 h-2 rounded-full bg-ai-vibrant animate-pulse" />
          <span className="font-bold text-ai-vibrant">{stageLabel}</span>
          <span className="text-on-surface-variant">— {activeCount} agent{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''}</span>
        </div>
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
            {stalledAgents.has(agent.name) && !agent.errorMessage && (
              <p className="text-[12px] text-status-review font-label-sm flex items-center gap-1">
                <Icon name="schedule" className="text-[10px]" />
                Agent inactif — tentative de recuperation...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && !stalledAgents.has(agent.name) && agent.status === 'thinking' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Analyse en cours...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && !stalledAgents.has(agent.name) && agent.status === 'writing' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Redaction en cours...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && !stalledAgents.has(agent.name) && agent.status === 'structuring' && (
              <p className="text-[12px] text-on-surface-variant font-label-sm">
                Structuration du plan...
              </p>
            )}
            {!agent.sectionTitle && !agent.errorMessage && !stalledAgents.has(agent.name) && agent.status === 'rescoping' && (
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
