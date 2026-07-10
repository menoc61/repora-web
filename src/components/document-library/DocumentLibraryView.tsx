import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import TopBar from '@/layout/TopBar'
import Icon from '../Icon'
import { Button } from '@/components/ui/button'
import {
  useDocuments,
  useExportDocument,
  useCreateProject,
  useGenerateDocument,
  useAnalytics,
  useActivity,
} from '@/hooks/useQueries'
import type { Document, DocumentFilters } from '@/schemas'
import { useWorkspaceStore } from '@/stores'
import { PAGE_SIZE } from './types'
import FilterBar from './FilterBar'
import DocumentTable from './DocumentTable'
import Pagination from './Pagination'
import ActivityFeed from './ActivityFeed'
import MetricsPanel from './MetricsPanel'

export default function DocumentLibraryView() {
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
  const { data: metrics } = useAnalytics()
  const { data: activitiesData } = useActivity()
  const activities = (activitiesData as any[]) ?? []

  const [department, setDepartment] = useState('all')
  const [owner, setOwner] = useState('all')
  const ownerFiltered = documents.filter((d) => owner === 'all' || owner === 'me' || d.author.name.includes(owner))

  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedDocs = documents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const currentPage = totalPages > 0 ? safePage : 1
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

  const handleToggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(pagedDocs.map((d) => d.id)))
    else setSelectedIds(new Set())
  }

  const handleDepartmentChange = (v: string) => setDepartment(v)
  const handleStatusChange = (v: string) => {
    setStatus(v)
    setPage(1)
  }
  const handleOwnerChange = (v: string) => setOwner(v)
  const handleSearchChange = (v: string) => {
    setSearch(v)
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

        <FilterBar
          department={department}
          status={status}
          owner={owner}
          search={search}
          ownerFilteredCount={ownerFiltered.length}
          onDepartmentChange={handleDepartmentChange}
          onStatusChange={handleStatusChange}
          onOwnerChange={handleOwnerChange}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />

        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <DocumentTable
            docs={pagedDocs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={handleToggleAll}
            onExportSingle={handleExportSingle}
            onOpenSharing={handleOpenSharing}
            onOpenHistory={handleOpenHistory}
          />

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Bento widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActivityFeed activities={activities} onViewAll={() => navigate({ to: '/infrastructure' })} />
          <MetricsPanel metrics={metrics} />
        </div>
      </div>
    </>
  )
}
