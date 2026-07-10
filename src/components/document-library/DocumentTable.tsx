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

interface DocumentTableProps {
  docs: Document[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onExportSingle: (doc: Document) => void
  onOpenSharing: (doc: Document) => void
  onOpenHistory: (doc: Document) => void
}

export default function DocumentTable({
  docs,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onExportSingle,
  onOpenSharing,
  onOpenHistory,
}: DocumentTableProps) {
  return (
    <Table className="border-collapse text-left">
        <TableHeader>
          <TableRow className="bg-surface-container-low border-b border-outline-variant">
            <TableHead className="px-4 py-4 w-10 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              <input type="checkbox" onChange={(e) => onToggleAll(e.target.checked)} checked={docs.length > 0 && docs.every((d) => selectedIds.has(d.id))} />
            </TableHead>
            {['Nom du document', 'Statut', 'Departement', 'Proprietaire', 'Modifie', 'Actions'].map((h) => (
              <TableHead key={h} className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                {h}
              </TableHead>
            ))}
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
                  <Link to="/editor" search={{ id: r.id }} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <Icon name="description" />
                    </div>
                    <div>
                      <div className="font-body-md text-body-md font-bold text-primary">{r.title}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{r.version}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <StatusBadge status={BADGE_STATUS[r.status]}>{STATUS_LABELS[r.status]}</StatusBadge>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="font-label-md text-label-md text-on-surface">{r.department}</div>
                </TableCell>
                <TableCell className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-ai-vibrant text-white text-[10px] font-bold">
                      {initials(r.author.name)}
                    </div>
                    <span className="font-body-sm text-body-sm">{r.author.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-5 text-right font-label-sm text-label-sm text-on-surface-variant">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="px-6 py-5 text-right">
                  <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Exporter" onClick={() => onExportSingle(r)}>
                      <Icon name="ios_share" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Permissions" onClick={() => onOpenSharing(r)}>
                      <Icon name="manage_accounts" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Journal d'audit" onClick={() => onOpenHistory(r)}>
                      <Icon name="history_edu" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
  )
}
