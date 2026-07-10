import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import '@blocknote/mantine/style.css'
import {
  useDocument,
  useExportDocument,
  useAgents,
  useDocumentStream,
} from '../hooks/useQueries'
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
  const sessions = useGenerationStore((s) => s.sessions)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePending, setSharePending] = useState(false)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])

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
          <DiagramPanel projectId={document?.projectId} title={title} />

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
