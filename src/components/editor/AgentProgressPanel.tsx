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
  sseEvents: HermesEvent[]
  isGenerating: boolean
  agents: BackendAgent[]
}

export function AgentProgressPanel({ sseEvents, isGenerating, agents }: AgentProgressPanelProps) {
  const enabledAgents = agents.filter((a) => a.enabled)
  const activeAgentCount = sseEvents.length > 0
    ? new Set(
        sseEvents
          .filter((e) => e.type === 'agent_status' && (e as any).status !== 'done')
          .map((e) => (e as any).agent),
      ).size || enabledAgents.length
    : enabledAgents.length || 3

  return sseEvents.length > 0 || isGenerating ? (
    <GenerationProgress events={sseEvents} isStreaming={isGenerating} />
  ) : (
    <div className="p-gutter border-b border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">Orchestrateur IA</h3>
        <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">{activeAgentCount} ACTIFS</span>
      </div>

      {/* Agent list with model info */}
      <div className="space-y-2">
        {enabledAgents.map((agent) => (
          <div key={agent.name} className="flex items-center gap-2 py-1">
            <div className="w-2 h-2 rounded-full bg-on-surface-variant/30" />
            <span className="font-label-sm text-[12px] text-on-surface-variant flex-1">{agent.name}</span>
            <span className="font-mono text-[10px] text-on-surface-variant/60 truncate max-w-[120px]" title={agent.modelId}>
              {agent.modelId ?? agent.provider}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center py-6 text-on-surface-variant font-label-sm">
        <Icon name="auto_awesome" className="text-[24px] mx-auto mb-2 text-outline" />
        <p className="text-[11px]">Lancez une generation pour voir les agents en action.</p>
      </div>
    </div>
  )
}

export default AgentProgressPanel
