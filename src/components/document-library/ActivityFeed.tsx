import Icon from '../Icon'

interface ActivityFeedProps {
  activities: any[]
  onViewAll: () => void
}

export default function ActivityFeed({ activities, onViewAll }: ActivityFeedProps) {
  return (
    <div className="col-span-1 md:col-span-2 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="bolt" className="text-ai-vibrant" fill />
          <h3 className="font-headline-md text-headline-md">Insights et activite IA</h3>
        </div>
        <button className="text-ai-vibrant font-label-sm text-label-sm uppercase font-bold hover:underline" onClick={onViewAll}>Journal complet</button>
      </div>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.slice(0, 5).map((entry: any, i: number) => (
            <div key={i} className={`flex items-start gap-4 p-3 rounded-lg ${i === 0 ? 'bg-ai-glow/30 border border-ai-vibrant/10' : 'hover:bg-surface-container-low transition-colors'}`}>
              <div className={`w-8 h-8 rounded flex items-center justify-center ${i === 0 ? 'bg-ai-vibrant/20 text-ai-vibrant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <Icon name={i === 0 ? 'auto_awesome' : 'update'} className="scale-75" />
              </div>
              <div className="flex-grow">
                <p className="font-body-sm text-body-sm">{entry.message ?? entry.action ?? entry.description ?? 'Activite recente'}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{entry.timestamp ?? entry.time ?? entry.createdAt ?? ''}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant italic">Aucune activite recente.</p>
        )}
      </div>
    </div>
  )
}
