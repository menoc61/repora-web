import { Link } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'

const NAV = [
  { to: '/workspace', label: 'Espace', icon: 'workspaces' },
  { to: '/library', label: 'Bibliotheque', icon: 'inventory_2' },
  { to: '/templates', label: 'Modeles', icon: 'style' },
  { to: '/analytics', label: 'Analyses', icon: 'insights' },
  { to: '/collaboration', label: 'Collaboration', icon: 'groups' },
  { to: '/infrastructure', label: 'Infrastructure', icon: 'dns' },
  { to: '/sharing', label: 'Partage', icon: 'settings' },
]

export default function Sidebar() {
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

      <Link to="/workspace" className="mb-8 w-full">
        <Button className="w-full bg-ai-vibrant text-white hover:bg-secondary transition-colors active:scale-95 flex items-center justify-center gap-2">
          <Icon name="add" />
          Nouveau document
        </Button>
      </Link>

      <nav className="flex-1 space-y-1">
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
          className="flex items-center gap-3 py-2 pl-2 transition-colors text-on-surface-variant hover:bg-surface-container-high"
          activeProps={{ className: 'text-ai-vibrant font-bold border-l-2 border-ai-vibrant' }}
        >
          <Icon name="settings" />
          <span className="font-body-md">Parametres</span>
        </Link>
        <a className="flex items-center gap-3 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors pl-2" href="#">
          <Icon name="help_outline" />
          <span className="font-body-md">Assistance</span>
        </a>
      </div>
    </aside>
  )
}
