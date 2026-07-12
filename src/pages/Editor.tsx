import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import {
  useDocument,
  useExportDocument,
  useGenerateDocument,
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
import AssistantChat from '../components/editor/AssistantChat'
import EditorFormatToolbar from '../components/editor/EditorFormatToolbar'

type InspectorTab = 'agents' | 'chat' | 'structure'

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
  const { data: document, isLoading, error } = useDocument(docId)
  const { data: agents = [] } = useAgents()
  const exportDoc = useExportDocument()
  const generateDoc = useGenerateDocument()
  const sessions = useGenerationStore((s) => s.sessions)
  const { events: sseEvents } = useDocumentStream(docId)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePending, setSharePending] = useState(false)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [collabProvider, setCollabProvider] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<InspectorTab>('chat')
  const collabStatus = useCollabStatus(collabProvider)
  // Derive isGenerating from store — no activeSession useState to avoid circular dependency
  const isGenerating = sessions.some((s) => s.documentId === docId && s.status === 'generating')

  // Auto-switch to agents tab during generation
  useEffect(() => {
    if (isGenerating && activeTab !== 'agents') {
      setActiveTab('agents')
    }
  }, [isGenerating])

  // Sync store status when isGenerating changes (no sessions dep to avoid loop)
  useEffect(() => {
    if (!docId || !sessions.some((s) => s.documentId === docId)) return
    const { updateSession, completeSession } = useGenerationStore.getState()
    const { sessions: currentSessions } = useGenerationStore.getState()
    const session = currentSessions.find((s) => s.documentId === docId)
    if (session) {
      if (isGenerating && session.status !== 'generating') {
        updateSession(session.sessionId, { status: 'generating' })
      }
      if (!isGenerating && session.status === 'generating') {
        completeSession(session.sessionId)
      }
    }
  }, [isGenerating, docId])

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

  const sectionsTotalCount = document?.sections?.length ?? 0
  const sectionsDoneCount = document?.sections?.filter((s: any) =>
    s.status === 'final' || s.status === 'done' || s.status === 'reviewed' || s.status === 'validated'
  ).length ?? 0

  const aiEfficiencyPercent = useMemo(() => {
    // Calculate from document sections instead of SSE events
    const sections = document?.sections
    if (Array.isArray(sections) && sections.length > 0) {
      const done = sections.filter((s: any) => s.status === 'final' || s.status === 'done' || s.status === 'reviewed' || s.status === 'validated').length
      return Math.round((done / sections.length) * 100)
    }
    return -1
  }, [document])

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
    // Delay revocation to let the download start
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  async function handlePreview() {
    if (!docId) return
    const blob = await exportDoc.mutateAsync({ id: docId, format: 'pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Don't revoke immediately — let the new tab load it
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  async function handleResume() {
    if (!document?.projectId) return
    try {
      // Create a generation session so the UI tracks the generation
      const { startSession } = useGenerationStore.getState()
      startSession({ projectId: document.projectId, documentId: docId, title: document?.title || 'Document' })
      await generateDoc.mutateAsync({ projectId: document.projectId, prompt: '' })
    } catch (err) {
      console.error('Generation failed to start:', err)
    }
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

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        <div className="text-center space-y-4">
          <Icon name="error_outline" className="text-[48px] mx-auto text-status-review" />
          <p className="font-headline-md text-headline-md text-primary">Erreur de chargement</p>
          <p className="font-body-md text-on-surface-variant">Impossible de charger ce document.</p>
          <Link to="/library" className="text-ai-vibrant underline font-label-md">Retour a la bibliotheque</Link>
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
        projectId={document?.projectId}
        onShare={() => setShareOpen(true)}
        onExport={handleExport}
        onPreview={handlePreview}
        onResume={handleResume}
        sharePending={sharePending}
        collabStatus={collabStatus}
      />

      <ShareDialog docId={docId} open={shareOpen} onOpenChange={setShareOpen} onShareStateChange={setSharePending} />

      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <section className="flex-1 bg-surface-studio overflow-y-auto hide-scrollbar relative" id="editor-canvas">
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
          {/* Tab bar */}
          <div className="flex border-b border-outline-variant shrink-0">
            {([
              { id: 'agents' as const, icon: 'smart_toy', label: 'Agents', badge: isGenerating ? 'active' : undefined },
              { id: 'chat' as const, icon: 'auto_awesome', label: 'Chat' },
              { id: 'structure' as const, icon: 'account_tree', label: 'Structure' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-label-sm font-label-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-ai-vibrant after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-ai-vibrant after:rounded-full'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon name={tab.icon} className="text-[15px]" />
                <span className="hidden xl:inline">{tab.label}</span>
                {tab.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-ai-vibrant animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'agents' && (
              <div className="h-full flex flex-col">
                <AgentProgressPanel isGenerating={isGenerating} agents={agents} sseEvents={sseEvents} />
              </div>
            )}

            {activeTab === 'chat' && (
              <AssistantChat
                projectId={document?.projectId}
                documentContext={document?.sections?.map((s: any) => `${s.title}: ${s.content || ''}`).join('\n\n')}
              />
            )}

            {activeTab === 'structure' && (
              <div className="h-full overflow-y-auto p-gutter space-y-4">
                <DiagramPanel projectId={document?.projectId} title={title} />
                <OutlineTree sections={outlineSections} />
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="p-3 border-t border-outline-variant bg-surface-container-lowest shrink-0">
            <div className="flex justify-between items-center text-label-sm text-on-surface-variant mb-1">
              <span>{wordCount.toLocaleString()} MOTS</span>
              <span>
                {isGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ai-vibrant animate-pulse" />
                    EN GENERATION
                  </span>
                ) : aiEfficiencyPercent >= 0 ? (
                  `${sectionsDoneCount}/${sectionsTotalCount} sections`
                ) : (
                  'PRET'
                )}
              </span>
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
