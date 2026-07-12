import Icon from '../Icon'
import { GenerationProgress } from '../GenerationProgress'
import type { HermesEvent } from '../../hooks/useQueries'

interface BackendAgent {
  name: string
  provider: string
  enabled: boolean
  modelId?: string
}

interface AgentProgressPanelProps {
  sseEvents?: HermesEvent[]
  isGenerating: boolean
  agents: BackendAgent[]
}

export function AgentProgressPanel({ sseEvents = [], isGenerating, agents }: AgentProgressPanelProps) {
  const enabledAgents = (agents || []).filter((a) => a.enabled)

  // Count unique agents that have appeared in events
  const agentsInEvents = new Set(
    sseEvents
      .filter((e) => e.type === 'agent_status')
      .map((e) => (e as any).agent),
  )

  // Count agents currently active (not done)
  const activeAgents = new Set(
    sseEvents
      .filter((e) => e.type === 'agent_status' && (e as any).status !== 'done')
      .map((e) => (e as any).agent),
  )

  return sseEvents.length > 0 || isGenerating ? (
    <GenerationProgress events={sseEvents} isStreaming={isGenerating} />
  ) : (
    <div className="p-gutter border-b border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">Agents IA</h3>
        {enabledAgents.length > 0 && (
          <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded">
            {enabledAgents.length} configure{enabledAgents.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {enabledAgents.length > 0 ? (
        <div className="space-y-2">
          {enabledAgents.map((agent) => (
            <div key={agent.name} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-container-low transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-surface-variant/30" />
              <span className="font-label-sm text-[12px] text-on-surface-variant flex-1">{agent.name}</span>
              <span className="font-mono text-[10px] text-on-surface-variant/60 truncate max-w-[120px]" title={agent.modelId}>
                {agent.modelId ?? agent.provider}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant/60 italic py-2">Aucun agent configure.</p>
      )}

      <div className="text-center py-6 text-on-surface-variant font-label-sm">
        <Icon name="auto_awesome" className="text-[24px] mx-auto mb-2 text-outline" />
        <p className="text-[11px]">Lancez une generation pour voir les agents en action.</p>
      </div>
    </div>
  )
}

export default AgentProgressPanel
