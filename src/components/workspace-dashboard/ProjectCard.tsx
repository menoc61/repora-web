import { Link } from '@tanstack/react-router'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'

interface ProjectCardProps {
  project: any
  onOpen: (id: string) => void
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const projectId = project.projectId ?? project.id
  const projectName = project.name || project.title || 'Sans titre'
  const brief = project.brief || ''
  const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null

  return (
    <Link
      to="/onboarding/$id"
      params={{ id: projectId }}
      onClick={() => onOpen(projectId)}
      className="group relative bg-white rounded-xl border border-outline-variant p-5 hover:border-ai-vibrant hover:shadow-lg hover:shadow-ai-vibrant/5 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ai-vibrant to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-3">
        <StatusBadge status={project.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="arrow_forward" className="text-ai-vibrant text-lg" />
        </div>
      </div>

      <h4 className="font-headline-sm font-bold text-primary-container mb-2 line-clamp-2">{projectName}</h4>

      {brief && (
        <p className="font-body-sm text-secondary line-clamp-2 mb-4">{brief}</p>
      )}

      <div className="mt-auto pt-3 border-t border-outline-variant/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-secondary">
          <Icon name="folder" className="text-sm" />
          <span className="font-label-sm">Projet</span>
        </div>
        {updatedAt && (
          <span className="font-label-sm text-secondary">
            {updatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </Link>
  )
}
