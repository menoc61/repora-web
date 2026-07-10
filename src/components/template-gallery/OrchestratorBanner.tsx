import Icon from '../Icon'

export default function OrchestratorBanner() {
  return (
    <div className="mt-12 p-6 bg-primary-container rounded-xl border border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            <Icon name="auto_awesome" className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-status-final rounded-full border-2 border-primary-container" />
        </div>
        <div>
          <h4 className="text-white font-label-md text-label-md font-bold mb-1">Orchestrateur global actif</h4>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-status-final animate-pulse" /><span className="font-label-sm text-[10px] text-on-primary-container uppercase">3 agents inactifs</span></div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-status-review animate-bounce" /><span className="font-label-sm text-[10px] text-on-primary-container uppercase">1 agent en synthese</span></div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="flex justify-between mb-2">
          <span className="font-label-sm text-[10px] text-on-primary-container uppercase">Preparation contextuelle</span>
          <span className="font-label-sm text-[10px] text-white">94%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-ai-vibrant" style={{ width: '94%' }} />
        </div>
      </div>
    </div>
  )
}
