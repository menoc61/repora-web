import Icon from '../Icon'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface FilterBarProps {
  department: string
  status: string
  owner: string
  search: string
  ownerFilteredCount: number
  onDepartmentChange: (v: string) => void
  onStatusChange: (v: string) => void
  onOwnerChange: (v: string) => void
  onSearchChange: (v: string) => void
  onClearFilters: () => void
}

export default function FilterBar({
  department,
  status,
  owner,
  search,
  ownerFilteredCount,
  onDepartmentChange,
  onStatusChange,
  onOwnerChange,
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant">
        <Icon name="filter_list" className="text-on-surface-variant scale-90" />
        <span className="font-label-md text-label-md font-bold">Filtrer par :</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={department} onValueChange={(v) => onDepartmentChange(v ?? 'all')}>
          <SelectTrigger className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-label-md text-label-md focus:ring-1 focus:ring-ai-vibrant outline-none">
            <SelectValue placeholder="Departement : Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Departement : Tous</SelectItem>
            <SelectItem value="Legal">Juridique</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Engineering">Ingenierie</SelectItem>
            <SelectItem value="Human Resources">Ressources Humaines</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => onStatusChange(v ?? 'all')}>
          <SelectTrigger className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-label-md text-label-md focus:ring-1 focus:ring-ai-vibrant outline-none">
            <SelectValue placeholder="Statut : Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Statut : Tous</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="review">En revision</SelectItem>
            <SelectItem value="final">Finalise</SelectItem>
            <SelectItem value="archived">Archive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={owner} onValueChange={(v) => onOwnerChange(v ?? 'all')}>
          <SelectTrigger className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-label-md text-label-md focus:ring-1 focus:ring-ai-vibrant outline-none">
            <SelectValue placeholder="Proprietaire : Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Proprietaire : Tous</SelectItem>
            <SelectItem value="me">Attribue a moi</SelectItem>
            <SelectItem value="lead">Chef d&apos;equipe</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-label-md text-label-md focus:ring-1 focus:ring-ai-vibrant outline-none h-9 w-48"
        />
      </div>
      <div className="h-6 w-px bg-outline-variant mx-2 hidden lg:block" />
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <span>Affichage</span>
          <span className="font-bold text-primary">{ownerFilteredCount}</span>
          <span>Documents</span>
        </div>
        <button className="text-ai-vibrant font-label-md text-label-md hover:underline" onClick={onClearFilters}>Effacer les filtres</button>
      </div>
    </div>
  )
}
