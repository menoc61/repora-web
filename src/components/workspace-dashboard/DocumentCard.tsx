import { useNavigate } from '@tanstack/react-router'
import { Card } from '../../components/ui/card'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'

interface DocumentCardProps {
  doc: any
  viewMode: 'grid' | 'list'
  onOpen: (id: string) => void
}

export default function DocumentCard({ doc, viewMode, onOpen }: DocumentCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(doc.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(doc.id) } }}
      className={viewMode === 'grid' ? 'col-span-12 md:col-span-4' : 'w-full'}
    >
      <Card className="p-5 hover:shadow-xl hover:shadow-surface-container/50 transition-all group cursor-pointer h-full border-outline-variant">
        <div className="flex justify-between items-start mb-4">
          <StatusBadge status={doc.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
          <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h4 className="font-headline-md text-[18px] font-bold text-primary mb-2 line-clamp-2">{doc.title}</h4>
        <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-6">{doc.content || 'Aucune description'}</p>
        {doc.__generating && (
          <div className="flex items-center gap-1.5 mb-3 text-ai-vibrant">
            <div className="w-1.5 h-1.5 rounded-full bg-ai-vibrant animate-pulse" />
            <span className="font-label-sm text-[10px]">Generation en cours...</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-white bg-surface-container" />
            <div className="w-6 h-6 rounded-full border-2 border-white bg-outline-variant" />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
            {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : ''}
          </span>
        </div>
      </Card>
    </div>
  )
}
