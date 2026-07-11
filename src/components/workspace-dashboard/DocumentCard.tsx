import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'

interface DocumentCardProps {
  doc: any
  viewMode: 'grid' | 'list'
  onOpen: (id: string) => void
}

export default function DocumentCard({ doc, viewMode, onOpen }: DocumentCardProps) {
  const title = doc.title || doc.projectName || 'Sans titre'
  const content = doc.content || doc.brief || ''
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : null
  const sectionCount = doc.sectionCount || 0

  if (viewMode === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(doc.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(doc.id) } }}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-outline-variant hover:border-ai-vibrant hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
          <Icon name="description" className="text-ai-vibrant" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-label-md font-bold text-primary-container truncate">{title}</h4>
          <p className="font-body-sm text-secondary truncate">{content || 'Aucune description'}</p>
        </div>
        <StatusBadge status={doc.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
        {sectionCount > 0 && (
          <span className="font-label-sm text-secondary shrink-0">{sectionCount} sections</span>
        )}
        {updatedAt && (
          <span className="font-label-sm text-secondary shrink-0">
            {updatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        )}
        <Icon name="chevron_right" className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(doc.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(doc.id) } }}
      className="col-span-12 md:col-span-4 group"
    >
      <div className="relative bg-white rounded-xl border border-outline-variant p-5 hover:border-ai-vibrant hover:shadow-lg hover:shadow-ai-vibrant/5 transition-all duration-200 cursor-pointer h-full flex flex-col overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ai-vibrant to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex justify-between items-start mb-4">
          <StatusBadge status={doc.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
          {doc.__generating && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ai-vibrant/10">
              <div className="w-1.5 h-1.5 rounded-full bg-ai-vibrant animate-pulse" />
              <span className="font-label-sm text-ai-vibrant">En cours</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Icon name="description" className="text-ai-vibrant shrink-0" />
          <h4 className="font-label-md font-bold text-primary-container line-clamp-2">{title}</h4>
        </div>

        <p className="font-body-sm text-secondary line-clamp-2 mb-4 flex-1">{content || 'Aucune description'}</p>

        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/50">
          <div className="flex items-center gap-1.5 text-secondary">
            <Icon name="article" className="text-sm" />
            <span className="font-label-sm">Document</span>
          </div>
          {updatedAt && (
            <span className="font-label-sm text-secondary">
              {updatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
