import { Link } from '@tanstack/react-router'
import ProjectCard from './ProjectCard'

interface ProjectGridProps {
  projects: any[]
  loading: boolean
  onOpen: (id: string) => void
}

export default function ProjectGrid({ projects, loading, onOpen }: ProjectGridProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-md text-headline-md font-bold text-primary">Projets actifs</h3>
        <Link to="/workspace" className="font-label-sm text-label-sm text-ai-vibrant hover:underline">Tout voir</Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-studio rounded-xl animate-pulse border border-outline-variant" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant italic">Aucun projet pour le moment. Creez un document pour demarrer.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}
