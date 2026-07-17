import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import TopBar from '@/layout/TopBar'
import Icon from '../Icon'
import { Button } from '@/components/ui/button'
import { notify } from '../Toast'
import {
  useDocuments,
  useExportDocument,
  useCreateProject,
  useGenerateDocument,
  useAnalytics,
  useActivity,
  useDeleteDocument,
  useSaveDocument,
} from '@/hooks/useQueries'
import type { Document, DocumentFilters } from '@/schemas'
import { useWorkspaceStore } from '@/stores'
import { PAGE_SIZE } from './types'
import FilterBar from './FilterBar'
import DocumentTable from './DocumentTable'
import type { SortField, SortDirection } from './DocumentTable'
import Pagination from './Pagination'
import ActivityFeed from './ActivityFeed'
import MetricsPanel from './MetricsPanel'
import ConfirmDialog from '@/components/ui/confirm-dialog'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "a l'instant"
  if (diffMins < 60) return `il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `il y a ${diffDays}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function DocumentLibraryView() {
  const navigate = useNavigate()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; title: string } | null>(null)
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({ field: 'updatedAt', direction: 'desc' })
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const exportMutation = useExportDocument()
  const createProject = useCreateProject()
  const generateDoc = useGenerateDocument()
  const deleteDoc = useDeleteDocument()
  const saveDoc = useSaveDocument()

  const filters: DocumentFilters = {
    ...(status !== 'all' ? { status } : {}),
    ...(search ? { search } : {}),
    ...(tag ? { tag } : {}),
  }
  const { data: documents = [], isLoading: docsLoading } = useDocuments(filters)
  const { data: metrics } = useAnalytics()
  const { data: activitiesData } = useActivity()
  const activities = (activitiesData as any[]) ?? []

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const doc of documents) {
      for (const t of doc.tags ?? []) tagSet.add(t)
    }
    return Array.from(tagSet).sort()
  }, [documents])

  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const sortedDocs = useMemo(() => {
    const arr = [...documents]
    const { field, direction } = sortConfig
    arr.sort((a, b) => {
      let cmp = 0
      if (field === 'title') cmp = a.title.localeCompare(b.title)
      else if (field === 'status') cmp = a.status.localeCompare(b.status)
      else if (field === 'department') cmp = (a.department || '').localeCompare(b.department || '')
      else if (field === 'author') cmp = (a.author?.name || '').localeCompare(b.author?.name || '')
      else if (field === 'updatedAt') cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '')
      return direction === 'asc' ? cmp : -cmp
    })
    return arr
  }, [documents, sortConfig])

  const pagedDocs = sortedDocs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const currentPage = totalPages > 0 ? safePage : 1
  const isCreatingNew = createProject.isPending || generateDoc.isPending

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

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

  const handleRename = (doc: Document, newTitle: string) => {
    saveDoc.mutate({ id: doc.id, title: newTitle })
  }

  const handleDelete = (doc: Document) => {
    setPendingDelete({ ids: [doc.id], title: doc.title })
  }

  const handleBulkDelete = () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setPendingDelete({ ids, title: `${ids.length} document(s) selectionne(s)` })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    pendingDelete.ids.forEach((id) => deleteDoc.mutate(id))
    setSelectedIds(new Set())
    setPendingDelete(null)
  }

  const handleClearFilters = () => {
    setStatus('all')
    setSearch('')
    setTag('')
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

  const handleToggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(pagedDocs.map((d) => d.id)))
    else setSelectedIds(new Set())
  }

  const handleDepartmentChange = (v: string) => { /* reserved for future use */ }
  const handleStatusChange = (v: string) => setStatus(v)
  const handleOwnerChange = (v: string) => { /* reserved for future use */ }
  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleTagChange = (v: string) => {
    setTag(v)
    setPage(1)
  }

  const handleOpenSharing = (doc: Document) => navigate({ to: '/sharing', search: { id: doc.id } })
  const handleOpenHistory = (doc: Document) => navigate({ to: '/history', search: { id: doc.id } })

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
          <div className="flex gap-2 items-center">
            {selectedIds.size > 0 && (
              <Button variant="outline" className="flex items-center gap-2 text-danger border-danger/30 hover:bg-danger/10" onClick={handleBulkDelete} disabled={deleteDoc.isPending}>
                <Icon name="delete" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
            <div className="flex border border-outline-variant rounded-lg overflow-hidden mr-2">
              <button
                className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-ai-vibrant text-white' : 'bg-surface hover:bg-surface-container-low text-on-surface-variant'}`}
                onClick={() => setViewMode('table')}
                title="Vue tableau"
              >
                <Icon name="view_list" className="text-[18px]" />
              </button>
              <button
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-ai-vibrant text-white' : 'bg-surface hover:bg-surface-container-low text-on-surface-variant'}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                <Icon name="grid_view" className="text-[18px]" />
              </button>
            </div>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleBulkExport} disabled={exportMutation.isPending}>
              <Icon name="download" />
              {exportMutation.isPending ? 'Exportation...' : 'Export groupe'}
            </Button>
            <Button
              onClick={handleNewDocument}
              disabled={isCreatingNew}
              className="flex items-center gap-2 px-4 py-2 bg-ai-vibrant text-white rounded-lg font-label-md text-label-md hover:bg-ai-vibrant/90 transition-all"
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

        <FilterBar
          department="all"
          status={status}
          owner="all"
          search={search}
          tag={tag}
          availableTags={allTags}
          ownerFilteredCount={documents.length}
          onDepartmentChange={handleDepartmentChange}
          onStatusChange={handleStatusChange}
          onOwnerChange={handleOwnerChange}
          onSearchChange={handleSearchChange}
          onTagChange={handleTagChange}
          onClearFilters={handleClearFilters}
        />

        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          {viewMode === 'table' ? (
            <DocumentTable
              docs={pagedDocs}
              selectedIds={selectedIds}
              sortConfig={sortConfig}
              onSort={handleSort}
              onToggleSelect={toggleSelect}
              onToggleAll={handleToggleAll}
              onExportSingle={handleExportSingle}
              onOpenSharing={handleOpenSharing}
              onOpenHistory={handleOpenHistory}
              onRename={handleRename}
              onDelete={handleDelete}
              onDuplicate={(doc) => notify({ type: 'info', title: 'Duplication', message: `Duplication de "${doc.title}"...` })}
              onArchive={(doc) => notify({ type: 'info', title: 'Archivage', message: `Document "${doc.title}" archive.` })}
              isLoading={docsLoading}
            />
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pagedDocs.length === 0 && !docsLoading ? (
                <div className="col-span-full py-10 text-center font-body-md text-body-md text-on-surface-variant">
                  Aucun document disponible.
                </div>
              ) : (
                pagedDocs.map((doc) => (
                  <div key={doc.id} className="relative group bg-surface rounded-xl border border-outline-variant hover:border-ai-vibrant/40 hover:shadow-elevation-1 transition-all cursor-pointer p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <Icon name="description" />
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-body-md text-body-md font-bold text-primary truncate">{doc.title}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 truncate">{doc.department}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[10px] ${
                        doc.status === 'validated' ? 'bg-success/10 text-success' :
                        doc.status === 'in_review' ? 'bg-warning/10 text-warning' :
                        doc.status === 'rejected' ? 'bg-danger/10 text-danger' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {doc.status === 'validated' ? 'Valide' : doc.status === 'in_review' ? 'En revue' : doc.status === 'rejected' ? 'Rejete' : 'Brouillon'}
                      </span>
                      <span className="font-label-sm text-[10px] text-on-surface-variant">
                        {doc.updatedAt ? timeAgo(doc.updatedAt) : '—'}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-ai-vibrant transition-colors"
                        title="Exporter"
                        onClick={() => handleExportSingle(doc)}
                      >
                        <Icon name="ios_share" className="text-[14px]" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-danger transition-colors"
                        title="Supprimer"
                        onClick={() => handleDelete(doc)}
                      >
                        <Icon name="delete" className="text-[14px]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Bento widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActivityFeed activities={activities} onViewAll={() => navigate({ to: '/infrastructure' })} />
          <MetricsPanel metrics={metrics} />
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete && pendingDelete.ids.length > 1 ? 'Supprimer les documents' : 'Supprimer le document'}
        description={pendingDelete ? `Supprimer « ${pendingDelete.title} » ? Cette action est irreversible et supprime aussi le projet et toutes les sections associees.` : ''}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
