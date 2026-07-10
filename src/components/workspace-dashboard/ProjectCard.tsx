import { Link } from '@tanstack/react-router'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'

interface ProjectCardProps {
  project: any
  onOpen: (id: string) => void
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <Link
      key={project.id}
      to="/onboarding/$id"
      params={{ id: project.projectId ?? project.id }}
      onClick={() => onOpen(project.projectId ?? project.id)}
      className="group bg-white border border-outline-variant rounded-xl p-5 hover:border-ai-vibrant hover:shadow-lg transition-all flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <StatusBadge status={project.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
        <Icon name="arrow_forward" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h4 className="font-headline-md text-[18px] font-bold text-primary mb-1 line-clamp-2">{project.title}</h4>
      <p className="text-body-sm text-on-surface-variant mt-auto pt-3">Reprendre le cahier des charges</p>
    </Link>
  )
}
