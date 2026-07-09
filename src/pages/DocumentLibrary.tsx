import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import TopBar from '../layout/TopBar'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useDocuments, useExportDocument, useCreateProject, useGenerateDocument } from '@/hooks/useQueries'
import type { Document, DocumentFilters } from '@/schemas'
import { useWorkspaceStore } from '@/stores'

const STATUS_LABELS: Record<Document['status'], string> = {
  draft: 'Brouillon',
  review: 'En revision',
  final: 'Finalise',
  active: 'Actif',
  autonomous: 'Autonome',
  archived: 'Archive',
}

const BADGE_STATUS: Record<Document['status'], 'draft' | 'review' | 'final' | 'active' | 'autonomous'> = {
  draft: 'draft',
  review: 'review',
  final: 'final',
  active: 'active',
  autonomous: 'autonomous',
  archived: 'draft',
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const PAGE_SIZE = 10

export default function DocumentLibrary() {
  const navigate = useNavigate()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const exportMutation = useExportDocument()
  const createProject = useCreateProject()
  const generateDoc = useGenerateDocument()

  const filters: DocumentFilters = {
    ...(status !== 'all' ? { status } : {}),
    ...(search ? { search } : {}),
  }
  const { data: documents = [] } = useDocuments(filters)

  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE))
  const pagedDocs = documents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const isCreatingNew = createProject.isPending || generateDoc.isPending

  async function handleNewDocument() {
    try {
      const project = await createProject.mutateAsync({ name: 'Nouveau document', brief: '' })
      const result = await generateDoc.mutateAsync({ projectId: project.id })
      setActiveView('editor')
      navigate({ to: '/editor', search: { id: result.document_id } })
    } catch {
      /* affiche via les etats pending/error */
    }
  }

  const handleBulkExport = () => {
    const ids = selectedIds.size > 0 ? [...selectedIds] : pagedDocs.map((d) => d.id)
    ids.forEach((id) => exportMutation.mutate({ id, format: 'pdf' }))
  }

  const handleExportSingle = (doc: Document) => {
    exportMutation.mutate({ id: doc.id, format: 'pdf' })
  }

  const handleClearFilters = () => {
    setDepartment('all')
    setStatus('all')
    setOwner('all')
    setSearch('')
    setPage(1)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const activities = Array.isArray(activityData) ? activityData : []

  return (
    <>
      <TopBar title="Espace de travail" tabs={[]} />
      <div className="p-gutter max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 mb-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              <span>Documents</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-ai-vibrant font-bold">Bibliotheque</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg text-primary">Depot d&apos;entreprise</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleBulkExport} disabled={exportMutation.isPending}>
              <Icon name="download" />
              {exportMutation.isPending ? 'Exportation...' : 'Export groupe'}
            </Button>
            <Button
              onClick={handleNewDocument}
              disabled={isCreatingNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              {isCreatingNew ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Creation...
                </>
              ) : (
                <>
                  <Icon name="add" />
                  Creer un document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant">
            <Icon name="filter_list" className="text-on-surface-variant scale-90" />
            <span className="font-label-md text-label-md font-bold">Filtrer par :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={department} onValueChange={(v) => setDepartment(v ?? 'all')}>
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
            <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
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
            <Select value={owner} onValueChange={(v) => setOwner(v ?? 'all')}>
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
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-label-md text-label-md focus:ring-1 focus:ring-ai-vibrant outline-none h-9 w-48"
            />
          </div>
          <div className="h-6 w-px bg-outline-variant mx-2 hidden lg:block" />
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <span>Affichage</span>
              <span className="font-bold text-primary">{ownerFiltered.length}</span>
              <span>Documents</span>
            </div>
            <button className="text-ai-vibrant font-label-md text-label-md hover:underline" onClick={handleClearFilters}>Effacer les filtres</button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <Table className="border-collapse text-left">
            <TableHeader>
              <TableRow className="bg-surface-container-low border-b border-outline-variant">
                <TableHead className="px-4 py-4 w-10 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(pagedDocs.map((d) => d.id)))
                    else setSelectedIds(new Set())
                  }} checked={pagedDocs.length > 0 && pagedDocs.every((d) => selectedIds.has(d.id))} />
                </TableHead>
                {['Nom du document', 'Statut', 'Departement', 'Proprietaire', 'Modifie', 'Actions'].map((h) => (
                  <TableHead key={h} className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-outline-variant">
              {pagedDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-10 text-center font-body-md text-body-md text-on-surface-variant">
                    Aucun document disponible.
                  </TableCell>
                </TableRow>
              ) : (
                pagedDocs.map((r) => (
                  <TableRow key={r.id} className="hover:bg-surface-container-low transition-colors group">
                    <TableCell className="px-4 py-5">
                      <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
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
                        <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Exporter" onClick={() => handleExportSingle(r)}>
                          <Icon name="ios_share" />
                        </button>
                        <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Permissions" onClick={() => navigate({ to: '/sharing', search: { id: r.id } })}>
                          <Icon name="manage_accounts" />
                        </button>
                        <button className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors" title="Journal d'audit" onClick={() => navigate({ to: '/history', search: { id: r.id } })}>
                          <Icon name="history_edu" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
            <div className="font-label-sm text-label-sm text-on-surface-variant">Page {currentPage} sur {totalPages}</div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <Icon name="chevron_left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-label-md text-label-md ${currentPage === pageNum ? 'bg-ai-vibrant text-white' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && <span className="px-1 text-on-surface-variant">...</span>}
              <button className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-30" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        </div>

        {/* Bento widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 bg-surface p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="bolt" className="text-ai-vibrant" fill />
                <h3 className="font-headline-md text-headline-md">Insights et activite IA</h3>
              </div>
              <button className="text-ai-vibrant font-label-sm text-label-sm uppercase font-bold hover:underline" onClick={() => navigate({ to: '/infrastructure' })}>Journal complet</button>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((entry: any, i: number) => (
                  <div key={i} className={`flex items-start gap-4 p-3 rounded-lg ${i === 0 ? 'bg-ai-glow/30 border border-ai-vibrant/10' : 'hover:bg-surface-container-low transition-colors'}`}>
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${i === 0 ? 'bg-ai-vibrant/20 text-ai-vibrant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      <Icon name={i === 0 ? 'auto_awesome' : 'update'} className="scale-75" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-body-sm text-body-sm">{entry.message ?? entry.action ?? entry.description ?? 'Activite recente'}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{entry.timestamp ?? entry.time ?? entry.createdAt ?? ''}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">Aucune activite recente.</p>
              )}
            </div>
          </div>

          <div className="bg-primary text-on-primary p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md opacity-80">Utilisation espace</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black">{metrics?.totalDocuments ?? 0}</span>
                <span className="text-xl opacity-60 pb-1">documents</span>
              </div>
              <div className="mt-4 w-full h-2 bg-on-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-ai-vibrant" style={{ width: `${Math.min(100, (metrics?.aiUtilization ?? 0))}%` }} />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between font-label-sm text-label-sm opacity-60">
                <span>Agents actifs</span>
                <span>{metrics?.activeAgents ?? 0}</span>
              </div>
              <div className="flex justify-between font-label-sm text-label-sm opacity-60">
                <span>Score de collaboration</span>
                <span className="text-green-400">{metrics?.collaborationScore ?? 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
