import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import TopBar from '../layout/TopBar'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useDocuments, useAnalytics, useCreateProject, useAgents, useActivity } from '../hooks/useQueries'
import { useWorkspaceStore } from '../stores'
import type { HermesGenerationError } from '../hooks/useQueries'

interface BackendActivityItem {
  user?: string
  action?: string
  document?: string
  comment?: string
  timestamp?: string
  type?: string
  message?: string
  [k: string]: unknown
}

interface UIActivityItem {
  icon: string
  bg: string
  c: string
  t: React.ReactNode
  sub?: string
  time: string
}

function getTimeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Actif'
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}j`
  } catch {
    return ''
  }
}

function mapActivityItem(item: BackendActivityItem): UIActivityItem {
  const user = item.user ?? 'Utilisateur'
  const document = item.document ?? item.message ?? 'un document'
  const action = item.action ?? item.type ?? 'edit'
  const rawTime = item.timestamp ?? ''

  if (action === 'comment' || action === 'comment_added') {
    return {
      icon: 'person',
      bg: 'bg-ai-glow',
      c: 'text-ai-vibrant',
      t: <><span className="font-bold">{user}</span> a laisse des commentaires sur <span className="text-ai-vibrant font-semibold">{document}</span></>,
      sub: item.comment ? `"${item.comment}"` : undefined,
      time: getTimeAgo(rawTime),
    }
  }
  if (action === 'validate' || action === 'validation') {
    return {
      icon: 'check_circle',
      bg: 'bg-status-final/10',
      c: 'text-status-final',
      t: <><span className="font-bold">{user}</span> a valide dans <span className="text-ai-vibrant font-semibold">{document}</span></>,
      time: getTimeAgo(rawTime),
    }
  }
  return {
    icon: 'edit',
    bg: 'bg-status-review/10',
    c: 'text-status-review',
    t: <><span className="font-bold">{user}</span> modifie actuellement <span className="text-ai-vibrant font-semibold">{document}</span></>,
    time: rawTime ? getTimeAgo(rawTime) : 'Actif',
  }
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate()
  const { data: documents = [] } = useDocuments()
  const { data: analytics } = useAnalytics()
  const { data: agents = [] } = useAgents()
  const { data: activity = [], isLoading: activityLoading } = useActivity()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  const createProject = useCreateProject()
  const [prompt, setPrompt] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const activityItems: UIActivityItem[] = Array.isArray(activity) ? activity.map(mapActivityItem) : []
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
        <section className="mb-12 relative overflow-hidden rounded-xl bg-primary-container p-8 text-white min-h-[220px] flex flex-col justify-center">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-headline-md text-headline-md font-black mb-2">Generer avec l&apos;Orchestrateur IA</h2>
            <p className="font-body-md opacity-80 mb-6">
              Decrivez vos besoins documentaires, et notre systeme multi-agents redige, verifie et formate votre cahier des charges automatiquement.
            </p>
            <div className="relative flex items-center">
              <Input
                className="w-full bg-white/10 border border-white/20 rounded-lg py-4 pl-5 pr-32 text-body-md placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-ai-vibrant/50 backdrop-blur-md"
                placeholder="Ex. : Rediger un cahier des charges pour une application de gestion de stock..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
              />
              <Button
                onClick={handleGenerate}
                disabled={createProject.isPending || !prompt.trim()}
                className="absolute right-2 bg-ai-vibrant hover:bg-secondary text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all"
              >
                {createProject.isPending ? 'Creation...' : 'Generer'}
                <Icon name="bolt" className="text-[18px]" />
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">
              Documents recents
              {analytics && <span className="text-body-sm text-on-surface-variant font-normal ml-2">({analytics.totalDocuments} au total)</span>}
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
              <button
                onClick={handleNewDocument}
                disabled={isCreatingNew}
                className="col-span-12 md:col-span-4 border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-ai-vibrant hover:bg-surface-container-low transition-all cursor-pointer min-h-[200px] group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 rounded-full bg-ai-glow flex items-center justify-center mb-4 group-hover:bg-ai-vibrant/20 transition-colors">
                  {isCreatingNew ? (
                    <Icon name="progress_activity" className="text-[28px] text-ai-vibrant animate-spin" />
                  ) : (
                    <Icon name="add" className="text-[32px] text-ai-vibrant" />
                  )}
                </div>
                <h4 className="font-headline-md text-[18px] font-bold text-primary mb-1">
                  {isCreatingNew ? 'Creation en cours...' : 'Nouveau document'}
                </h4>
                <p className="text-body-sm text-on-surface-variant">
                  Creer un document vierge avec l&apos;assistant IA
                </p>
              </button>
            )}

            {documents.map((d) => (
              <Link
                key={d.id}
                to="/editor"
                search={{ id: d.id }}
                onClick={() => setActiveView('editor')}
                className={viewMode === 'grid' ? 'col-span-12 md:col-span-4' : 'w-full'}
              >
                <Card className="p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={d.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
                    <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-headline-md text-[18px] font-bold text-primary mb-2">{d.title}</h4>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-6">{d.content || 'Aucune description'}</p>
                  {isDocumentGenerating(d) && (
                    <div className="flex items-center gap-1.5 mb-3 text-ai-vibrant">
                      <div className="w-1.5 h-1.5 rounded-full bg-ai-vibrant animate-pulse" />
                      <span className="font-label-sm text-[10px]">Generation en cours...</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-300" />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
                      {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}

            <div className="col-span-12 md:col-span-8 bg-white border border-outline-variant rounded-lg p-6">
              <h4 className="font-label-md text-label-md font-bold mb-6 flex items-center gap-2">
                <Icon name="analytics" className="text-ai-vibrant" />
                ACTIVITE DE COLLABORATION
              </h4>
              <div className="space-y-6">
                {activityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4 items-start animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                        <div className="w-10 h-3 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : activityItems.length === 0 ? (
                  <p className="text-label-sm text-on-surface-variant opacity-50">Aucune activite recente.</p>
                ) : (
                  activityItems.map((a, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full ${a.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon name={a.icon} className={a.c} />
                      </div>
                      <div className="flex-1">
                        <p className="text-body-sm">{a.t}</p>
                        {a.sub && <p className="text-label-sm text-on-surface-variant opacity-60 mt-1 italic">{a.sub}</p>}
                      </div>
                      <span className="text-label-sm text-on-surface-variant opacity-40">{a.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 bg-primary-container text-white rounded-lg p-6 flex flex-col">
              <h4 className="font-label-md text-label-md font-bold mb-4 flex items-center gap-2">
                <Icon name="robot_2" className="text-ai-vibrant" />
                ORCHESTRATEUR IA
              </h4>
              <div className="space-y-4 flex-1">
                {agents.length === 0 && (
                  <p className="text-label-sm opacity-50">Aucun agent configure.</p>
                )}
                {agents.map((a) => (
                  <div key={a.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-label-sm text-label-sm">{a.name}</span>
                      <span className={`text-[10px] ${a.enabled ? 'bg-status-final' : 'bg-white/5'} text-white px-1.5 rounded`}>
                        {a.enabled ? 'ACTIF' : 'OFF'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full">
                      <div className={`h-full ${a.enabled ? 'bg-status-final' : 'bg-white/10'} rounded-full`} style={{ width: a.enabled ? '100%' : '0%' }} />
                    </div>
                  </div>
                ))}
                <p className="text-label-sm text-[10px] opacity-40 mt-2">
                  Demarrez une generation dans l&apos;editeur pour voir les agents en direct.
                </p>
              </div>
              <Link to="/agents" onClick={() => setActiveView('agents')}>
                <Button variant="outline" className="mt-6 w-full border-white/20 text-white hover:bg-white/10">
                  Gerer les agents
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
