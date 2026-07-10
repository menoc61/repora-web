import { useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import '@blocknote/mantine/style.css'
import {
  useDocument,
  useExportDocument,
  useValidationToken,
  useAgents,
  useDocumentStream,
  useCreateDiagram,
} from '../hooks/useQueries'
import Icon from '../components/Icon'
import { AgentStatus } from '../components/AgentStatus'
import { GenerationProgress } from '../components/GenerationProgress'
import { Button } from '../components/ui/button'
import { EditorCanvas, type OutlineSection } from '../components/editor/EditorCanvas'

interface OutlineItemProps {
  label: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

// ── Block ↔ Section conversion ──

function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'recemment'
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return 'recemment'
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 0) return "a l'instant"
  if (diffSec < 60) return `il y a ${diffSec} secondes`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `il y a ${diffHr} heure${diffHr > 1 ? 's' : ''}`
  const diffDay = Math.floor(diffHr / 24)
  return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`
}

// ── Main Editor Page ──

const FALLBACK_OUTLINE: OutlineSection[] = [
  { title: 'Resume executif', done: true },
  { title: 'Facteurs cles du marche', active: true, sub: ['Dynamiques regionales', 'Cadre reglementaire', 'Evolutions technologiques'] },
  { title: 'Projections fiscales' },
  { title: 'Attenuation des risques' },
]

export default function Editor() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/editor' })
  const docId = search.id

  if (!docId) {
    return (
      <div className="pt-16 pl-sidebar-width h-screen flex items-center justify-center text-on-surface-variant font-label-md">
        <div className="text-center space-y-4">
          <Icon name="auto_awesome" className="text-[48px] mx-auto text-ai-vibrant" />
          <p>Aucun document selectionne.</p>
          <Link to="/library" className="text-ai-vibrant underline">Retour a la bibliotheque</Link>
        </div>
      </div>
    )
  }

  return <EditorPage key={docId} docId={docId} navigate={navigate} />
}

function EditorPage({ docId, navigate }: { docId: string; navigate: ReturnType<typeof useNavigate> }) {
  const { data: document, isLoading } = useDocument(docId)
  const { data: agents = [] } = useAgents()
  const { events: sseEvents, isStreaming: isGenerating } = useDocumentStream(docId)
  const exportDoc = useExportDocument()
  const validationToken = useValidationToken(docId)
  const createDiagram = useCreateDiagram()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])
  const [diagramType, setDiagramType] = useState<string>('use_case')
  const [diagrams, setDiagrams] = useState<Array<{ id: string; type: string; rendered_url: string }>>([])
  const [diagramError, setDiagramError] = useState<string | null>(null)

  const title = document?.title ?? 'Document sans titre'
  const status = document?.status ?? 'draft'
  const statusLabel = status === 'review' ? 'EN REVISION' : status.toUpperCase()

  // Live agent count from SSE events (only agents that aren't done)
  const activeAgentCount = sseEvents.length > 0
    ? new Set(
        sseEvents
          .filter((e) => e.type === 'agent_status' && (e as any).status !== 'done')
          .map((e) => (e as any).agent),
      ).size || agents.filter((a: any) => a.enabled).length
    : agents.filter((a: any) => a.enabled).length || 3

  const outlineSections: OutlineSection[] = useMemo(() => {
    if (liveOutline.length > 0) return liveOutline
    const sections = document?.sections
    if (Array.isArray(sections) && sections.length > 0) {
      let firstIncomplete = false
      return sections.map((s: any): OutlineSection => {
        const done = s.status === 'final' || s.status === 'done'
        const isActive = !firstIncomplete && !done
        if (isActive) firstIncomplete = true
        return { title: s.title, done, active: isActive }
      })
    }
    return FALLBACK_OUTLINE
  }, [document, liveOutline])

  const wordCount = liveWordCount > 0 ? liveWordCount : 1248

  const aiEfficiency = useMemo(() => {
    // Use live SSE data when available
    if (sseEvents.length > 0) {
      const statusEvents = sseEvents.filter((e) => e.type === 'agent_status')
      const doneCount = statusEvents.filter((e) => (e as any).status === 'done').length
      const agentNames = new Set(statusEvents.map((e) => (e as any).agent)).size
      if (agentNames > 0) {
        return `${Math.round((doneCount / agentNames) * 100)}%`
      }
    }
    const sections = document?.sections
    if (Array.isArray(sections) && sections.length > 0) {
      const done = sections.filter((s: any) => s.status === 'final' || s.status === 'done').length
      return `${Math.round((done / sections.length) * 100)}%`
    }
    return '—'
  }, [document, sseEvents])

  const handleWordCountChange = useCallback((n: number) => {
    setLiveWordCount(n)
  }, [])

  const handleOutlineChange = useCallback((sections: OutlineSection[]) => {
    setLiveOutline(sections)
  }, [])

  async function handleExport(format: 'pdf' | 'docx') {
    if (!docId) return
    const blob = await exportDoc.mutateAsync({ id: docId, format })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${title}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    if (!docId) return
    const { token } = await validationToken.mutateAsync()
    const base = `${window.location.origin}/validate/${token}`
    setShareUrl(base)
    await navigator.clipboard?.writeText(base)
  }

  async function handleGenerateDiagram() {
    if (!document?.projectId) return
    setDiagramError(null)
    try {
      const result = await createDiagram.mutateAsync({
        projectId: document.projectId,
        type: diagramType,
        source: title,
      })
      setDiagrams((prev) => [...prev, { ...result, type: diagramType }])
    } catch {
      setDiagramError('Echec de la generation du diagramme.')
    }
  }

  return (
    <div className="pt-16 pl-sidebar-width pr-inspector-width h-screen flex flex-col">
      {/* Top nav */}
      <header className="fixed top-0 right-0 w-[calc(100%-var(--sidebar-width,280px))] h-16 bg-surface-studio border-b border-outline-variant flex justify-between items-center px-gutter z-40">
        <div className="flex items-center gap-6">
          <Link to="/library" className="flex items-center gap-2 text-on-surface-variant hover:text-secondary font-label-sm text-label-sm mr-2" title="Retour a la bibliotheque">
            <Icon name="arrow_back" className="text-[18px]" /> Bibliotheque
          </Link>
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-bold">{isLoading ? 'Chargement...' : title}</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status === 'review' ? 'bg-status-review' : status === 'final' ? 'bg-status-final' : 'bg-status-draft'}`} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">{statusLabel} • SAUVEGARDE CLOUD</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-4 ml-4">
            {['Fichier', 'Edition', 'Affichage', 'Insertion', 'Outils'].map((t) => (
              <button key={t} className="font-label-md text-label-md text-on-surface-variant hover:text-ai-vibrant transition-all" onClick={() => {}} title="Fonctionnalite a venir">{t}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-4">
            <div className="w-8 h-8 rounded-full border-2 border-surface-studio bg-ai-vibrant flex items-center justify-center text-white font-label-sm">+3</div>
          </div>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container transition-colors">
            <Icon name="export_notes" className="text-[18px]" /> Exporter
          </button>
          <Link to="/sharing" search={{ id: docId }} className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container transition-colors">
            <Icon name="group" className="text-[18px]" /> Gerer les acces
          </Link>
          <Button onClick={handleShare} disabled={!docId || validationToken.isPending} className="flex items-center gap-2 px-4 py-1.5 bg-ai-vibrant text-white rounded font-label-md text-label-md hover:opacity-90 transition-all">
            <Icon name="share" className="text-[18px]" /> Partager
          </Button>
          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-outline-variant">
            <button className="text-on-surface-variant hover:text-primary" onClick={() => alert('Fonctionnalite a venir')}><Icon name="notifications" /></button>
            <Link to="/history" search={{ id: docId }} className="text-on-surface-variant hover:text-primary" title="Historique des versions"><Icon name="history" /></Link>
            <button className="text-on-surface-variant hover:text-primary" onClick={() => navigate({ to: '/settings' })}><Icon name="account_circle" /></button>
          </div>
        </div>
      </header>

      {shareUrl && (
        <div className="px-gutter py-2 bg-ai-glow text-ai-vibrant font-label-sm text-label-sm flex items-center gap-2">
          <Icon name="link" className="text-[16px]" />
          Lien de validation copie : {shareUrl}
        </div>
      )}

      {/* Editor canvas */}
      <section className="flex-1 bg-white overflow-y-auto hide-scrollbar relative" id="editor-canvas">
        <EditorCanvas
          docId={docId}
          document={document}
          isLoading={isLoading}
          onWordCountChange={handleWordCountChange}
          onOutlineChange={handleOutlineChange}
        />
      </section>

      {/* Right Inspector */}
      <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-inspector-width bg-surface border-l border-outline-variant flex flex-col z-40 overflow-hidden">
        {/* Agent progress — SSE-driven or placeholder */}
        {sseEvents.length > 0 || isGenerating ? (
          <GenerationProgress events={sseEvents} isStreaming={isGenerating} />
        ) : (
          <div className="p-gutter border-b border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">Orchestrateur IA</h3>
              <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">{activeAgentCount} ACTIFS</span>
            </div>
            <div className="text-center py-8 text-on-surface-variant font-label-sm">
              <Icon name="auto_awesome" className="text-[32px] mx-auto mb-2 text-outline" />
              <p>Aucun agent actif.</p>
              <p className="text-[11px] mt-1">Lancez une generation pour voir les agents en action.</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-gutter bg-surface-studio">
          {/* UML Diagram generation */}
          <div className="mb-6 border-b border-outline-variant pb-6">
            <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Icon name="account_tree" className="text-ai-vibrant" />
              Diagrammes UML
            </h3>
            {!document?.projectId ? (
              <p className="text-label-sm text-on-surface-variant italic">
                Liez ce document a un projet pour generer des diagrammes.
              </p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <select
                    className="flex-1 p-2 border border-outline-variant rounded bg-white font-body-sm text-secondary focus:outline-none focus:border-ai-vibrant"
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value)}
                  >
                    <option value="use_case">Cas d'utilisation</option>
                    <option value="sequence">Sequence</option>
                    <option value="activity">Activite</option>
                    <option value="class">Classe</option>
                    <option value="deployment">Deploiement</option>
                  </select>
                  <Button
                    onClick={handleGenerateDiagram}
                    disabled={createDiagram.isPending}
                    className="bg-ai-vibrant text-white px-3 py-2 rounded font-label-sm hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    {createDiagram.isPending ? <Icon name="progress_activity" className="animate-spin text-[16px]" /> : <Icon name="auto_awesome" className="text-[16px]" />}
                    Generer
                  </Button>
                </div>
                {diagramError && (
                  <p className="text-label-sm text-error mb-2">{diagramError}</p>
                )}
                {diagrams.length > 0 && (
                  <div className="space-y-3">
                    {diagrams.map((d) => (
                      <div key={d.id} className="border border-outline-variant rounded-lg overflow-hidden bg-white">
                        <div className="flex items-center justify-between px-3 py-2 bg-surface-studio border-b border-outline-variant">
                          <span className="font-label-sm text-label-sm uppercase">{d.type}</span>
                          <a
                            href={d.rendered_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ai-vibrant hover:underline font-label-sm"
                          >
                            Ouvrir
                          </a>
                        </div>
                        {d.rendered_url ? (
                          <img src={d.rendered_url} alt={d.type} className="w-full p-2" />
                        ) : (
                          <p className="text-label-sm text-on-surface-variant p-3 italic">Rendu en cours...</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-4">Plan du document</h3>
          <nav className="space-y-3">
            {outlineSections.map((section) => (
              <OutlineItem
                key={section.title}
                label={section.title}
                done={section.done}
                active={section.active}
                sub={section.sub}
              />
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-label-sm text-on-surface-variant">
          <span>{wordCount.toLocaleString()} MOTS</span>
          <span>EFFICACITE IA : {aiEfficiency}</span>
        </div>
      </aside>
    </div>
  )
}

function OutlineItem({ label, done, active, sub }: OutlineItemProps) {
  return (
    <div>
      <div className="flex items-start gap-3 group cursor-pointer">
        <div className={`w-4 h-4 border mt-1 rounded-sm flex items-center justify-center ${done ? 'bg-status-final border-none' : active ? 'border-ai-vibrant' : 'border-outline-variant'}`}>
          {done && <Icon name="check" className="text-white" style={{ fontSize: 12 }} />}
          {active && <div className="w-1.5 h-1.5 bg-ai-vibrant rounded-full animate-pulse" />}
        </div>
        <span className={`text-body-sm font-medium ${active ? 'text-ai-vibrant' : done ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
      </div>
      {sub && (
        <div className="ml-7 space-y-2 border-l border-outline-variant pl-4 py-1">
          {sub.map((s) => (
            <div key={s} className="text-body-sm text-on-surface-variant hover:text-primary">{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}
