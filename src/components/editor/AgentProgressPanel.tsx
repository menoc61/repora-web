import Icon from '../Icon'
import { GenerationProgress } from '../GenerationProgress'
import type { HermesEvent } from '../../hooks/useQueries'

interface AgentProgressPanelProps {
  sseEvents: HermesEvent[]
  isGenerating: boolean
  agents: any[]
}

export function AgentProgressPanel({ sseEvents, isGenerating, agents }: AgentProgressPanelProps) {
  const activeAgentCount = sseEvents.length > 0
    ? new Set(
        sseEvents
          .filter((e) => e.type === 'agent_status' && (e as any).status !== 'done')
          .map((e) => (e as any).agent),
      ).size || agents.filter((a: any) => a.enabled).length
    : agents.filter((a: any) => a.enabled).length || 3

  return sseEvents.length > 0 || isGenerating ? (
    <GenerationProgress events={sseEvents} isStreaming={isGenerating} />
  ) : (
    <div className="p-gutter border-b border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">Orchestrateur IA</h3>
        <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">{activeAgentCount} ACTIFS</span>
      </div>
      <div className="text-center py-8 text-on-surface-variant font-label-sm">
        <Icon name="auto_awesome" className="text-[32px] mx-auto mb-2 text-outline" />
        <p>Aucun agent actif.</p>
        <p className="text-[11px] mt-1">Lancez une generation pour voir les agents en action.</p>
      </div>
    </div>
  )
}

export default AgentProgressPanel
