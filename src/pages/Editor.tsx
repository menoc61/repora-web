import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import {
  useDocument,
  useExportDocument,
  useAgents,
  useDocumentStream,
} from '../hooks/useQueries'
import { useCollabStatus } from '../hooks/useCollabStatus'
import Icon from '../components/Icon'
import { useGenerationStore } from '../stores/generationStore'
import {
  EditorCanvas,
  type OutlineSection,
  EditorHeader,
  InspectorPanel,
  AgentProgressPanel,
  OutlineTree,
  ShareDialog,
  DiagramPanel,
} from '../components/editor'
import EditorFormatToolbar from '../components/editor/EditorFormatToolbar'

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
      <div className="h-screen flex items-center justify-center text-on-surface-variant font-label-md">
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
  const sessions = useGenerationStore((s) => s.sessions)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePending, setSharePending] = useState(false)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [collabProvider, setCollabProvider] = useState<any>(null)
  const collabStatus = useCollabStatus(collabProvider)

  useEffect(() => {
    if (!docId) return
    const { updateSession, completeSession } = useGenerationStore.getState()
    const session = sessions.find((s) => s.documentId === docId)
    if (session) {
      if (isGenerating && session.status !== 'generating') {
        updateSession(session.sessionId, { status: 'generating' })
      }
      if (!isGenerating && session.status === 'generating') {
        completeSession(session.sessionId)
      }
    }
  }, [isGenerating, docId, sessions])

  const title = document?.title ?? 'Document sans titre'
  const status = document?.status ?? 'draft'

  const outlineSections: OutlineSection[] = useMemo(() => {
    if (liveOutline.length > 0) return liveOutline
    const sections = document?.sections
    if (Array.isArray(sections) && sections.length > 0) {
      let firstIncomplete = false
      return sections.map((s: any): OutlineSection => {
        const done = s.status === 'final' || s.status === 'done' || s.status === 'reviewed' || s.status === 'validated'
        const isActive = !firstIncomplete && !done
        if (isActive) firstIncomplete = true
        return { title: s.title, done, active: isActive }
      })
    }
    return FALLBACK_OUTLINE
  }, [document, liveOutline])

  const wordCount = liveWordCount > 0 ? liveWordCount : 0

  const aiEfficiencyPercent = useMemo(() => {
    if (sseEvents.length > 0) {
      const statusEvents = sseEvents.filter((e) => e.type === 'agent_status')
      const doneCount = statusEvents.filter((e) => (e as any).status === 'done').length
      const agentNames = new Set(statusEvents.map((e) => (e as any).agent)).size
      if (agentNames > 0) {
        return Math.round((doneCount / agentNames) * 100)
      }
    }
    const sections = document?.sections
    if (Array.isArray(sections) && sections.length > 0) {
      const done = sections.filter((s: any) => s.status === 'final' || s.status === 'done' || s.status === 'reviewed' || s.status === 'validated').length
      return Math.round((done / sections.length) * 100)
    }
    return -1
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-ai-vibrant/30 border-t-ai-vibrant rounded-full animate-spin" />
          <span className="font-label-md text-label-md">Chargement du document...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <EditorHeader
        title={title}
        status={status}
        docId={docId}
        onShare={() => setShareOpen(true)}
        onExport={handleExport}
        sharePending={sharePending}
        collabStatus={collabStatus}
      />

      <ShareDialog docId={docId} open={shareOpen} onOpenChange={setShareOpen} onShareStateChange={setSharePending} />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <section className="flex-1 bg-white overflow-y-auto hide-scrollbar relative" id="editor-canvas">
          <EditorCanvas
            docId={docId}
            document={document}
            isLoading={isLoading}
            onWordCountChange={handleWordCountChange}
            onOutlineChange={handleOutlineChange}
            onEditorReady={setEditorInstance}
            onProviderReady={setCollabProvider}
          />
        </section>

        {/* Floating format toolbar */}
        <EditorFormatToolbar editor={editorInstance} locked={isGenerating} />

        {/* Right Inspector */}
        <aside className="w-[320px] border-l border-outline-variant bg-surface-studio flex flex-col shrink-0 overflow-hidden">
          <AgentProgressPanel sseEvents={sseEvents} isGenerating={isGenerating} agents={agents} />

          <div className="flex-1 overflow-y-auto p-gutter">
            <DiagramPanel projectId={document?.projectId} title={title} />
            <OutlineTree sections={outlineSections} />
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
            <div className="flex justify-between items-center text-label-sm text-on-surface-variant mb-1">
              <span>{wordCount.toLocaleString()} MOTS</span>
              <span>EFFICACITE IA : {aiEfficiencyPercent >= 0 ? `${aiEfficiencyPercent}%` : '—'}</span>
            </div>
            {aiEfficiencyPercent >= 0 && (
              <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-ai-vibrant transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${aiEfficiencyPercent}%` }}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
