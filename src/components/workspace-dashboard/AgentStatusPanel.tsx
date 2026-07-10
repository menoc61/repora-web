import { Link } from '@tanstack/react-router'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useWorkspaceStore } from '../../stores'

interface AgentStatusPanelProps {
  agents: any[]
}

export default function AgentStatusPanel({ agents }: AgentStatusPanelProps) {
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  return (
    <div className="col-span-12 md:col-span-4 bg-primary-container text-white rounded-lg p-6 flex flex-col">
      <h4 className="font-label-md text-label-md font-bold mb-4 flex items-center gap-2">
        <Icon name="robot_2" className="text-ai-vibrant" />
        ORCHESTRATEUR IA
      </h4>
      <div className="space-y-4 flex-1">
        {agents.length === 0 && (
          <p className="text-label-sm opacity-50">Aucun agent configure.</p>
        )}
        {agents.map((a) => (
          <div key={a.name}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-sm text-label-sm">{a.name}</span>
              <span className={`text-[10px] ${a.enabled ? 'bg-status-final' : 'bg-white/5'} text-white px-1.5 rounded`}>
                {a.enabled ? 'ACTIF' : 'OFF'}
              </span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full">
              <div className={`h-full ${a.enabled ? 'bg-status-final' : 'bg-white/10'} rounded-full`} style={{ width: a.enabled ? '100%' : '0%' }} />
            </div>
          </div>
        ))}
        <p className="text-label-sm text-[10px] opacity-40 mt-2">
          Demarrez une generation dans l&apos;editeur pour voir les agents en direct.
        </p>
      </div>
      <Link to="/agents" onClick={() => setActiveView('agents')}>
        <Button variant="outline" className="mt-6 w-full border-white/20 text-white hover:bg-white/10">
          Gerer les agents
        </Button>
      </Link>
    </div>
  )
}
