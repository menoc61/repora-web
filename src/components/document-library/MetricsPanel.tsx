interface MetricsPanelProps {
  metrics: any
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="bg-primary text-on-primary p-6 rounded-xl shadow-lg flex flex-col justify-between">
      <div>
        <h3 className="font-headline-md text-headline-md opacity-80">Utilisation espace</h3>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-4xl font-black">{metrics?.totalDocuments ?? 0}</span>
          <span className="text-xl opacity-60 pb-1">documents</span>
        </div>
        <div className="mt-4 w-full h-2 bg-on-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-ai-vibrant" style={{ width: `${Math.min(100, (metrics?.aiUtilization ?? 0))}%` }} />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex justify-between font-label-sm text-label-sm opacity-60">
          <span>Agents actifs</span>
          <span>{metrics?.activeAgents ?? 0}</span>
        </div>
        <div className="flex justify-between font-label-sm text-label-sm opacity-60">
          <span>Score de collaboration</span>
          <span className="text-status-final">{metrics?.collaborationScore ?? 0}%</span>
        </div>
      </div>
    </div>
  )
}
