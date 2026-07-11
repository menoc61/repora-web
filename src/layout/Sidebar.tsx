import { Link, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { useCreateProject } from '../hooks/useQueries'

const NAV = [
  { to: '/workspace', label: 'Tableau de bord', icon: 'dashboard' },
  { to: '/library', label: 'Bibliotheque', icon: 'library_books' },
  { to: '/templates', label: 'Modeles', icon: 'description' },
  { to: '/infrastructure', label: 'Infrastructure', icon: 'dns' },
  { to: '/history', label: 'Historique', icon: 'history' },
  { to: '/sharing', label: 'Partage', icon: 'share' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const createProject = useCreateProject()

  async function handleNewDocument() {
    try {
      // Create project and redirect to onboarding wizard
      const project = await createProject.mutateAsync({ name: 'Nouveau projet' })
      navigate({ to: '/onboarding/$id', params: { id: project.id } })
    } catch {
      /* handled by mutation states */
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-surface border-r border-outline-variant flex flex-col py-gutter px-4 z-50">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center">
          <Icon name="workspaces" className="text-inverse-primary" fill />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Repora</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">Documents techniques</p>
        </div>
      </div>

      <Button
        onClick={handleNewDocument}
        disabled={createProject.isPending}
        className="mb-8 w-full bg-ai-vibrant text-white hover:bg-secondary transition-colors active:scale-95 flex items-center justify-center gap-2"
      >
        <Icon name="add" />
        Nouveau document
      </Button>

      <nav className="flex-1 space-y-2">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 py-2 pl-2 transition-colors text-on-surface-variant hover:bg-surface-container-high"
            activeProps={{ className: 'text-ai-vibrant font-bold border-l-2 border-ai-vibrant' }}
          >
            <Icon name={item.icon} />
            <span className="font-body-md">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-outline-variant space-y-1">
        <Link
          to="/settings"
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 py-2 pl-2 transition-colors text-on-surface-variant hover:bg-surface-container-high"
          activeProps={{ className: 'text-ai-vibrant font-bold border-l-2 border-ai-vibrant' }}
        >
          <Icon name="settings" />
          <span className="font-body-md">Parametres</span>
        </Link>
      </div>
    </aside>
  )
}
