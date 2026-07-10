import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import { Input } from '../ui/input'

interface SearchNavProps {
  searchQuery: string
  onSearchChange: (v: string) => void
}

export default function SearchNav({ searchQuery, onSearchChange }: SearchNavProps) {
  return (
    <div className="h-16 flex items-center justify-between px-gutter bg-surface-studio border-b border-outline-variant">
      <div className="relative w-full max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <Input className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-ai-vibrant outline-none" placeholder="Rechercher modeles, agents ou tags..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
      </div>
      <nav className="hidden md:flex gap-6">
        <Link to="/workspace" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">Espace de travail</Link>
        <Link to="/library" className="font-label-md text-label-md text-primary border-b-2 border-secondary pb-1">Bibliotheque</Link>
        <Link to="/agents" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">Agents</Link>
      </nav>
    </div>
  )
}
