import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { BlockNoteViewRaw as BlockNoteView, useCreateBlockNote } from '@blocknote/react'
import '@blocknote/mantine/style.css'
import {
  useDocument,
  useSaveDocument,
  useExportDocument,
  useValidationToken,
  useAgents,
  useDocumentStream,
} from '../hooks/useQueries'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import Icon from '../components/Icon'
import { AgentStatus } from '../components/AgentStatus'
import { GenerationProgress } from '../components/GenerationProgress'
import { Button } from '../components/ui/button'

const COLLAB_WS_BASE = 'ws://localhost:8000/collab'

// ── Types ──

interface OutlineSection {
  title: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

interface OutlineItemProps {
  label: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

// ── Block ↔ Section conversion ──

function sectionsToBlocks(sections: Array<{ id: string; title: string; content: string; status: string }>) {
  const blocks: any[] = []
  for (const section of sections) {
    blocks.push({
      type: 'heading' as const,
      props: { level: 2 },
      content: [{ type: 'text' as const, text: section.title, styles: {} }],
    })
    if (section.content) {
      const paragraphs = section.content.split('\n').filter(Boolean)
      for (const para of paragraphs) {
        blocks.push({
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: para, styles: {} }],
        })
      }
    }
  }
  return blocks
}

function blocksToSections(blocks: any[], sectionIds: Map<string, string>): Array<{ id?: string; title: string; content: string; status: string }> {
  const sections: Array<{ id?: string; title: string; content: string; status: string }> = []
  let current: { id?: string; title: string; content: string; status: string } | null = null

  for (const block of blocks) {
    const text = block.content?.map((c: any) => c.text).join('') ?? ''
    if (block.type === 'heading') {
      if (current) sections.push(current)
      current = { id: sectionIds.get(text) ?? undefined, title: text, content: '', status: 'draft' }
    } else if (current) {
      if (current.content) current.content += '\n'
      current.content += text
    }
  }
  if (current) sections.push(current)
  return sections
}

function extractOutlineFromBlocks(blocks: any[]): OutlineSection[] {
  return blocks
    .filter((b: any) => b.type === 'heading')
    .map((b: any) => ({
      title: b.content?.map((c: any) => c.text).join('') ?? '',
    }))
}

function wordCountFromBlocks(blocks: any[]): number {
  let count = 0
  for (const block of blocks) {
    const text = block.content?.map((c: any) => c.text ?? '').join(' ') ?? ''
    count += text.split(/\s+/).filter(Boolean).length
  }
  return count
}

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

// ── Editor Content (BlockNote + Yjs) ──

interface EditorContentProps {
  docId: string
  document: any
  isLoading: boolean
  onWordCountChange: (n: number) => void
  onOutlineChange: (sections: OutlineSection[]) => void
}

function EditorContent({ docId, document, isLoading, onWordCountChange, onOutlineChange }: EditorContentProps) {
  const saveDocument = useSaveDocument()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Yjs + WebSocket provider — stable across renders via useState lazy init
  const [yDoc] = useState(() => new Y.Doc())
  const [provider] = useState(() => new WebsocketProvider(`${COLLAB_WS_BASE}/${docId}`, docId, yDoc))

  useEffect(() => {
    return () => {
      provider.disconnect()
      provider.destroy()
    }
  }, [provider])

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: yDoc.getXmlFragment('repora-document'),
      user: { name: 'Repora AI', color: '#2563EB' },
    },
  })

  // Populate editor from loaded document sections (once)
  useEffect(() => {
    if (!editor || isLoading || !document?.sections?.length || initializedRef.current) return
    const fragment = yDoc.getXmlFragment('repora-document')
    if (fragment.length > 0) {
      initializedRef.current = true
      return
    }
    const blocks = sectionsToBlocks(document.sections)
    if (blocks.length > 0) {
      editor.replaceBlocks(editor.document, blocks)
    }
    initializedRef.current = true
  }, [editor, document, isLoading, yDoc])

  // Debounced auto-save on content change
  const handleChange = useCallback(() => {
    if (!docId || !document) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const blocks = editor.document
      const sectionIds = new Map<string, string>()
      if (document.sections) {
        for (const s of document.sections) {
          sectionIds.set(s.title, s.id)
        }
      }
      const sections = blocksToSections(blocks, sectionIds)
      saveDocument.mutate({
        id: docId,
        sections,
        content: JSON.stringify(blocks),
      })
    }, 2000)
  }, [docId, editor, saveDocument, document])

  useEffect(() => {
    if (!editor) return
    const tip = (editor as any)._tiptapEditor
    if (!tip) return
    tip.on('update', handleChange)
    return () => {
      tip.off('update', handleChange)
    }
  }, [editor, handleChange])

  // Update word count and outline from editor state
  useEffect(() => {
    if (!editor) return
    const blocks = editor.document
    onWordCountChange(wordCountFromBlocks(blocks))
    onOutlineChange(extractOutlineFromBlocks(blocks))
  }, [editor, onWordCountChange, onOutlineChange])

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md">
        Chargement du document...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      <div className="max-w-[800px] mx-auto py-20 px-12 min-h-full">
        <BlockNoteView editor={editor} theme="light" className="min-h-[60vh]" />
      </div>
    </div>
  )
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
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [liveWordCount, setLiveWordCount] = useState(0)
  const [liveOutline, setLiveOutline] = useState<OutlineSection[]>([])

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
        <EditorContent
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
