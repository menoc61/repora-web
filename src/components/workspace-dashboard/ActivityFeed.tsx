import Icon from '../../components/Icon'
import type { UIActivityItem } from './activity'

interface ActivityFeedProps {
  activityItems: UIActivityItem[]
  loading: boolean
}

export default function ActivityFeed({ activityItems, loading }: ActivityFeedProps) {
  return (
    <div className="col-span-12 md:col-span-8 bg-white border border-outline-variant rounded-lg p-6">
      <h4 className="font-label-md text-label-md font-bold mb-6 flex items-center gap-2">
        <Icon name="analytics" className="text-ai-vibrant" />
        ACTIVITE DE COLLABORATION
      </h4>
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-start animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="w-10 h-3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : activityItems.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant opacity-50">Aucune activite recente.</p>
        ) : (
          activityItems.map((a, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className={`w-10 h-10 rounded-full ${a.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon name={a.icon} className={a.c} />
              </div>
              <div className="flex-1">
                <p className="text-body-sm">{a.t}</p>
                {a.sub && <p className="text-label-sm text-on-surface-variant opacity-60 mt-1 italic">{a.sub}</p>}
              </div>
              <span className="text-label-sm text-on-surface-variant opacity-40">{a.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
