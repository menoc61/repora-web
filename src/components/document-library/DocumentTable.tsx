import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import StatusBadge from '../StatusBadge'
import type { Document } from '@/schemas'
import { BADGE_STATUS, STATUS_LABELS, initials } from './types'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export type SortField = 'title' | 'status' | 'department' | 'author' | 'updatedAt'
export type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface DocumentTableProps {
  docs: Document[]
  selectedIds: Set<string>
  sortConfig?: SortConfig
  onSort?: (field: SortField) => void
  onToggleSelect: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onExportSingle: (doc: Document) => void
  onOpenSharing: (doc: Document) => void
  onOpenHistory: (doc: Document) => void
  onRename: (doc: Document, newTitle: string) => void
  onDelete: (doc: Document) => void
  onDuplicate?: (doc: Document) => void
  onArchive?: (doc: Document) => void
  isLoading?: boolean
}

function SkeletonRow() {
  return (
    <TableRow className="border-b border-outline-variant">
      <TableCell className="px-4 py-5">
        <div className="w-4 h-4 rounded animate-shimmer" />
      </TableCell>
      <TableCell className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded animate-shimmer" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-48 rounded animate-shimmer" />
            <div className="h-3 w-20 rounded animate-shimmer" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-5 hidden md:table-cell">
        <div className="h-5 w-20 rounded animate-shimmer" />
      </TableCell>
      <TableCell className="px-6 py-5 hidden lg:table-cell">
        <div className="h-4 w-24 rounded animate-shimmer" />
      </TableCell>
      <TableCell className="px-6 py-5 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full animate-shimmer" />
          <div className="h-4 w-16 rounded animate-shimmer" />
        </div>
      </TableCell>
      <TableCell className="px-6 py-5 hidden sm:table-cell">
        <div className="h-4 w-16 rounded animate-shimmer ml-auto" />
      </TableCell>
      <TableCell className="px-6 py-5">
        <div className="h-5 w-20 rounded animate-shimmer ml-auto" />
      </TableCell>
    </TableRow>
  )
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'a l\'instant'
  if (diffMins < 60) return `il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `il y a ${diffDays}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function DocumentTable({
  docs,
  selectedIds,
  sortConfig,
  onSort,
  onToggleSelect,
  onToggleAll,
  onExportSingle,
  onOpenSharing,
  onOpenHistory,
  onRename,
  onDelete,
  onDuplicate,
  onArchive,
  isLoading,
}: DocumentTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')

  function startRename(doc: Document) {
    setEditingId(doc.id)
    setDraftTitle(doc.title)
  }

  function commitRename(doc: Document) {
    const next = draftTitle.trim()
    setEditingId(null)
    if (next && next !== doc.title) onRename(doc, next)
  }

  function SortableHead({ field, children }: { field: SortField; children: React.ReactNode }) {
    const active = sortConfig?.field === field
    const dir = active ? sortConfig.direction : 'asc'
    return (
      <TableHead
        className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest cursor-pointer select-none hover:text-ai-vibrant transition-colors"
        onClick={() => onSort?.(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active ? (
            <Icon name={dir === 'asc' ? 'arrow_upward' : 'arrow_downward'} className="text-[12px] text-ai-vibrant" />
          ) : (
            <Icon name="unfold_more" className="text-[12px] opacity-40" />
          )}
        </span>
      </TableHead>
    )
  }

  if (isLoading) {
    return (
      <Table className="border-collapse text-left">
        <TableHeader>
          <TableRow className="bg-surface-container-low border-b border-outline-variant">
            <TableHead className="px-4 py-4 w-10 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              <div className="w-4 h-4 rounded animate-shimmer" />
            </TableHead>
            {['Nom du document', 'Statut', 'Departement', 'Proprietaire', 'Modifie', 'Actions'].map((h) => (
              <TableHead key={h} className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="block lg:hidden divide-y divide-outline-variant">
        {docs.length === 0 ? (
          <div className="px-6 py-10 text-center font-body-md text-body-md text-on-surface-variant">
            Aucun document disponible.
          </div>
        ) : (
          docs.map((r) => (
            <div key={r.id} className="px-4 py-4 hover:bg-surface-container-low transition-colors group">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => onToggleSelect(r.id)} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === r.id ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onBlur={() => commitRename(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(r)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="font-body-md text-body-md font-bold text-primary bg-surface-container-high border border-ai-vibrant rounded px-2 py-1 outline-none w-full"
                    />
                  ) : (
                    <Link to="/editor" search={{ id: r.id }} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                        <Icon name="description" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-body-md text-body-md font-bold text-primary truncate">{r.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={BADGE_STATUS[r.status]} className="text-[9px] px-1.5">
                            {STATUS_LABELS[r.status]}
                          </StatusBadge>
                          <span className="font-label-sm text-[10px] text-on-surface-variant">{r.version}</span>
                        </div>
                      </div>
                    </Link>
                  )}
                  <div className="flex items-center justify-between mt-2 pl-12">
                    <div className="flex items-center gap-2 text-label-sm text-[10px] text-on-surface-variant">
                      <span>{r.department}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span>{r.author.name}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span>{r.updatedAt ? timeAgo(r.updatedAt) : '—'}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-ai-vibrant" title="Exporter" onClick={() => onExportSingle(r)}>
                        <Icon name="ios_share" className="text-[14px]" />
                      </button>
                      <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-ai-vibrant" title="Dupliquer" onClick={() => onDuplicate?.(r)}>
                        <Icon name="content_copy" className="text-[14px]" />
                      </button>
                      <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-danger" title="Supprimer" onClick={() => onDelete(r)}>
                        <Icon name="delete" className="text-[14px]" />
                      </button>
                    </div>
                  </div>
                  {(r.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pl-12">
                      {r.tags.map((t) => (
                        <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded-full font-label-sm text-[9px] bg-ai-vibrant/10 text-ai-vibrant">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Table className="border-collapse text-left hidden lg:table">
        <TableHeader>
          <TableRow className="bg-surface-container-low border-b border-outline-variant">
            <TableHead className="px-4 py-4 w-10 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              <input type="checkbox" onChange={(e) => onToggleAll(e.target.checked)} checked={docs.length > 0 && docs.every((d) => selectedIds.has(d.id))} />
            </TableHead>
            <SortableHead field="title">Nom du document</SortableHead>
            <SortableHead field="status">Statut</SortableHead>
            <SortableHead field="department">Departement</SortableHead>
            <SortableHead field="author">Proprietaire</SortableHead>
            <SortableHead field="updatedAt">Derniere visite</SortableHead>
            <TableHead className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Etiquettes</TableHead>
            <TableHead className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-outline-variant">
          {docs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="px-6 py-10 text-center font-body-md text-body-md text-on-surface-variant">
                Aucun document disponible.
              </TableCell>
            </TableRow>
          ) : (
            docs.map((r) => (
              <TableRow key={r.id} className="hover:bg-surface-container-low transition-colors group">
                <TableCell className="px-4 py-5">
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => onToggleSelect(r.id)} />
                </TableCell>
                <TableCell className="px-6 py-5">
                  {editingId === r.id ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onBlur={() => commitRename(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(r)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="font-body-md text-body-md font-bold text-primary bg-surface-container-high border border-ai-vibrant rounded px-2 py-1 outline-none w-full max-w-xs"
                    />
                  ) : (
                    <Link to="/editor" search={{ id: r.id }} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <Icon name="description" />
                      </div>
                      <div>
                        <div className="font-body-md text-body-md font-bold text-primary">{r.title}</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">{r.version}</div>
                      </div>
                    </Link>
                  )}
                </TableCell>
                <TableCell className="px-6 py-5">
                  <StatusBadge status={BADGE_STATUS[r.status]} className="text-[10px]">
                    {STATUS_LABELS[r.status]}
                  </StatusBadge>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="font-label-md text-label-md text-on-surface">{r.department}</div>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-ai-vibrant text-white text-[10px] font-bold shrink-0">
                      {initials(r.author.name)}
                    </div>
                    <span className="font-body-sm text-body-sm truncate max-w-[120px]">{r.author.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 font-label-sm text-label-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5" title={r.updatedAt ? new Date(r.updatedAt).toLocaleString('fr-FR') : undefined}>
                    <Icon name="schedule" className="text-[12px] opacity-50" />
                    <span>{r.updatedAt ? timeAgo(r.updatedAt) : '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {(r.tags ?? []).slice(0, 2).map((t) => (
                      <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded-full font-label-sm text-[9px] bg-ai-vibrant/10 text-ai-vibrant">
                        {t}
                      </span>
                    ))}
                    {(r.tags ?? []).length > 2 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-label-sm text-[9px] bg-surface-container-high text-on-surface-variant">
                        +{(r.tags ?? []).length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 text-right">
                  <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Exporter" onClick={() => onExportSingle(r)}>
                      <Icon name="ios_share" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Dupliquer" onClick={() => onDuplicate?.(r)}>
                      <Icon name="content_copy" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Archiver" onClick={() => onArchive?.(r)}>
                      <Icon name="archive" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Renommer" onClick={() => startRename(r)}>
                      <Icon name="edit" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-danger transition-colors" title="Supprimer" onClick={() => onDelete(r)}>
                      <Icon name="delete" />
                    </button>
                    <div className="w-px h-5 bg-outline-variant mx-1" />
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Permissions" onClick={() => onOpenSharing(r)}>
                      <Icon name="manage_accounts" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Historique" onClick={() => onOpenHistory(r)}>
                      <Icon name="history_edu" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  )
}
