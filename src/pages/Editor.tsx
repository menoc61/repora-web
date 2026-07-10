import { useState, useCallback, useMemo } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import '@blocknote/mantine/style.css'
import {
  useDocument,
  useExportDocument,
  useAgents,
  useDocumentStream,
  useCreateDiagram,
} from '../hooks/useQueries'
import Icon from '../components/Icon'
import { AgentStatus } from '../components/AgentStatus'
import { Button } from '../components/ui/button'
import { EditorCanvas, type OutlineSection } from '../components/editor/EditorCanvas'
import { EditorHeader } from '../components/editor/EditorHeader'
import { InspectorPanel } from '../components/editor/InspectorPanel'
import { AgentProgressPanel } from '../components/editor/AgentProgressPanel'
import { OutlineTree } from '../components/editor/OutlineTree'
import { ShareDialog } from '../components/editor/ShareDialog'

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

  return <EditorPage key={docId} docId={docId} />
}

function EditorPage({ docId }: { docId: string }) {
  const { data: document, isLoading } = useDocument(docId)
  const { data: agents = [] } = useAgents()
  const { events: sseEvents, isStreaming: isGenerating } = useDocumentStream(docId)
  const exportDoc = useExportDocument()
  const createDiagram = useCreateDiagram()
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePending, setSharePending] = useState(false)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])
  const [diagramType, setDiagramType] = useState<string>('use_case')
  const [diagrams, setDiagrams] = useState<Array<{ id: string; type: string; rendered_url: string }>>([])
  const [diagramError, setDiagramError] = useState<string | null>(null)

  const title = document?.title ?? 'Document sans titre'
  const status = document?.status ?? 'draft'

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
      <EditorHeader
        title={isLoading ? 'Chargement...' : title}
        status={status}
        docId={docId}
        onShare={() => setShareOpen(true)}
        onExport={handleExport}
        sharePending={sharePending}
      />

      <ShareDialog docId={docId} open={shareOpen} onOpenChange={setShareOpen} onShareStateChange={setSharePending} />

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
      <InspectorPanel>
        <AgentProgressPanel sseEvents={sseEvents} isGenerating={isGenerating} agents={agents} />

        <div className="flex-1 overflow-y-auto p-gutter bg-surface-studio">
          {/* UML Diagram generation (still inline — extracted in Task 3) */}
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

          <OutlineTree sections={outlineSections} />
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-label-sm text-on-surface-variant">
          <span>{wordCount.toLocaleString()} MOTS</span>
          <span>EFFICACITE IA : {aiEfficiency}</span>
        </div>
      </InspectorPanel>
    </div>
  )
}
