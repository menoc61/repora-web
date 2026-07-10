import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import TopBar from '../../layout/TopBar'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useDocuments, useActivity, useCreateProject, useAgents, useProjects } from '../../hooks/useQueries'
import { useWorkspaceStore } from '../../stores'
import { useGenerationStore } from '../../stores/generationStore'
import { mapActivityItem } from './activity'
import PromptHero from './PromptHero'
import ProjectGrid from './ProjectGrid'
import NewDocumentCard from './NewDocumentCard'
import DocumentCard from './DocumentCard'
import ActivityFeed from './ActivityFeed'
import AgentStatusPanel from './AgentStatusPanel'

export default function WorkspaceDashboardView() {
  const navigate = useNavigate()
  const { data: documents = [] } = useDocuments()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: activity = [], isLoading: activityLoading } = useActivity()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  const activeSessions = useGenerationStore((s) =>
    s.sessions.filter((sess) => sess.status !== 'completed' && sess.status !== 'failed'),
  )
  const createProject = useCreateProject()
  const { data: agents = [] } = useAgents()
  const [prompt, setPrompt] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const activityItems = Array.isArray(activity) ? activity.map(mapActivityItem) : []
  const isCreatingNew = createProject.isPending

  // Check if a document is likely being generated (draft + updated in last 5 min)
  function isDocumentGenerating(doc: typeof documents[number]): boolean {
    if (doc.status !== 'draft') return false
    if (!doc.updatedAt) return false
    try {
      const updated = new Date(doc.updatedAt).getTime()
      return (Date.now() - updated) < 5 * 60 * 1000
    } catch {
      return false
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    try {
      const project = await createProject.mutateAsync({ name: prompt.slice(0, 80), brief: prompt })
      navigate({ to: '/onboarding/$id', params: { id: project.id } })
    } catch {
      /* affiche via les etats pending/error */
    }
  }

  async function handleNewDocument() {
    try {
      const project = await createProject.mutateAsync({ name: 'Nouveau document', brief: '' })
      navigate({ to: '/onboarding/$id', params: { id: project.id } })
    } catch {
      /* affiche via les etats pending/error */
    }
  }

  function onOpenProject(id: string) {
    setActiveView('editor')
    navigate({ to: '/onboarding/$id', params: { id } })
  }

  function onOpenDocument(id: string) {
    setActiveView('editor')
    navigate({ to: '/editor', search: { id } })
  }

  const docsWithGenerating = documents.map((d) => ({ ...d, __generating: isDocumentGenerating(d) }))

  return (
    <>
      <TopBar
        title="Espace"
        tabs={[
          { label: 'Espace', to: '/workspace', active: true },
          { label: 'Bibliotheque', to: '/library' },
          { label: 'Agents', to: '/agents' },
          { label: 'Analyses', to: '/analytics' },
        ]}
      />
      <div className="p-8 max-w-[1200px] mx-auto">
        <PromptHero prompt={prompt} onPromptChange={setPrompt} onGenerate={handleGenerate} generating={createProject.isPending} />

        <ProjectGrid projects={projects} loading={projectsLoading} onOpen={onOpenProject} />

        {activeSessions.length > 0 && (
          <section className="mb-8">
            <h3 className="font-headline-md text-headline-md font-bold text-primary-container mb-4">
              Generations en cours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="bg-white border border-outline-variant rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        s.status === 'generating'
                          ? 'bg-ai-vibrant animate-pulse'
                          : 'bg-status-review'
                      }`}
                    />
                    <span className="font-label-md font-mono text-primary-container truncate">
                      {s.title}
                    </span>
                  </div>
                  <span className="font-label-sm font-mono text-secondary">
                    Demarree {new Date(s.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    to="/editor"
                    search={{ id: s.documentId }}
                    className="mt-auto inline-flex items-center gap-1.5 font-label-sm font-mono text-ai-vibrant hover:underline"
                  >
                    <Icon name="arrow_forward" className="text-base" />
                    Reprendre
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">
              Documents recents
            </h3>
            <div className="flex gap-2 items-center">
              <Button
                onClick={handleNewDocument}
                disabled={isCreatingNew}
                className="bg-ai-vibrant hover:bg-secondary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all mr-3"
              >
                {isCreatingNew ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin text-[18px]" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Icon name="add" className="text-[20px]" />
                    Nouveau document
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'text-ai-vibrant' : ''}>
                <Icon name="grid_view" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'text-ai-vibrant' : ''}>
                <Icon name="list" />
              </Button>
            </div>
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-12 gap-6' : 'flex flex-col gap-4'}>
            {viewMode === 'grid' && (
              <NewDocumentCard onClick={handleNewDocument} generating={isCreatingNew} />
            )}

            {docsWithGenerating.map((d) => (
              <DocumentCard key={d.id} doc={d} viewMode={viewMode} onOpen={onOpenDocument} />
            ))}

            <ActivityFeed activityItems={activityItems} loading={activityLoading} />

            <AgentStatusPanel agents={agents} />
          </div>
        </section>
      </div>
    </>
  )
}
