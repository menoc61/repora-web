import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { AgentStatus } from '../components/AgentStatus'
import { Button } from '../components/ui/button'
import { useDocument, useAgents, useExportDocument, useValidationToken } from '../hooks/useQueries'

interface OutlineItemProps {
  label: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

export default function Editor() {
  const search = useSearch({ from: '/editor' })
  const docId = search.id
  const { data: document, isLoading } = useDocument(docId)
  const { data: agents = [] } = useAgents()
  const exportDoc = useExportDocument()
  const validationToken = useValidationToken(docId)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const title = document?.title ?? 'Untitled Document'
  const status = document?.status ?? 'draft'
  const statusLabel = status === 'review' ? 'UNDER REVIEW' : status.toUpperCase()

  async function handleExport(format: 'pdf' | 'docx') {
    if (!docId) return
    const blob = await exportDoc.mutateAsync({ id: docId, format })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
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
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-bold">{isLoading ? 'Loading…' : title}</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status === 'review' ? 'bg-status-review' : status === 'final' ? 'bg-status-final' : 'bg-status-draft'}`} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">{statusLabel} • SAVED TO CLOUD</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-4 ml-4">
            {['File', 'Edit', 'View', 'Insert', 'Tools'].map((t) => (
              <button key={t} className="font-label-md text-label-md text-on-surface-variant hover:text-ai-vibrant transition-all">{t}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-4">
            <div className="w-8 h-8 rounded-full border-2 border-surface-studio bg-ai-vibrant flex items-center justify-center text-white font-label-sm">+3</div>
          </div>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!docId || exportDoc.isPending} className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container transition-colors">
            <Icon name="export_notes" className="text-[18px]" /> Export
          </Button>
          <Button onClick={handleShare} disabled={!docId || validationToken.isPending} className="flex items-center gap-2 px-4 py-1.5 bg-ai-vibrant text-white rounded font-label-md text-label-md hover:opacity-90 transition-all">
            <Icon name="share" className="text-[18px]" /> Share
          </Button>
          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-outline-variant">
            <button className="text-on-surface-variant hover:text-primary"><Icon name="notifications" /></button>
            <Link to="/history" className="text-on-surface-variant hover:text-primary" title="Version History"><Icon name="history" /></Link>
            <button className="text-on-surface-variant hover:text-primary"><Icon name="account_circle" /></button>
          </div>
        </div>
      </header>

      {shareUrl && (
        <div className="px-gutter py-2 bg-ai-glow text-ai-vibrant font-label-sm text-label-sm flex items-center gap-2">
          <Icon name="link" className="text-[16px]" />
          Validation link copied: {shareUrl}
        </div>
      )}

      {/* Editor canvas */}
      <section className="flex-1 bg-white overflow-y-auto hide-scrollbar relative">
        <div className="max-w-[800px] mx-auto py-20 px-12 min-h-full">
          <div className="mb-12">
            <h1 className="font-headline-lg text-headline-lg text-primary leading-tight mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <span className="font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded">INTERNAL ONLY</span>
              <span className="font-label-sm text-label-sm">Modified 4 minutes ago by AI Orchestrator</span>
            </div>
          </div>

          <div className="space-y-6 font-body-md text-on-surface leading-relaxed">
            {isLoading && <p className="text-on-surface-variant">Loading document…</p>}
            {!isLoading && document && (
              document.content ? (
                <div className="p-2 rounded group relative hover:bg-[#F1F5F9] whitespace-pre-wrap">{document.content}</div>
              ) : (
                <div className="p-8 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant">
                  <Icon name="auto_awesome" className="text-[32px] mb-2 text-ai-vibrant" />
                  <span className="font-label-md text-label-md">No content yet. Generate this document from the workspace to draft it with the AI Orchestrator.</span>
                </div>
              )
            )}
            <div className="mt-12 p-8 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant hover:border-ai-vibrant hover:bg-ai-glow/10 transition-all cursor-pointer group">
              <Icon name="add_circle" className="text-[32px] mb-2 group-hover:text-ai-vibrant" />
              <span className="font-label-md text-label-md">Click or drag to insert new block</span>
            </div>
          </div>
        </div>

        {/* Inline AI assistant toolbar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-outline-variant rounded-full px-4 py-2 flex items-center gap-4 z-30">
          <Button variant="ghost" className="flex items-center gap-2 text-ai-vibrant font-bold text-label-md border-r border-outline-variant pr-4">
            <Icon name="auto_awesome" className="text-[18px]" /> Ask AI
          </Button>
          <div className="flex items-center gap-3">
            <button className="text-on-surface-variant hover:text-primary"><Icon name="format_bold" /></button>
            <button className="text-on-surface-variant hover:text-primary"><Icon name="format_italic" /></button>
            <button className="text-on-surface-variant hover:text-primary"><Icon name="link" /></button>
            <button className="text-on-surface-variant hover:text-primary"><Icon name="list" /></button>
          </div>
        </div>
      </section>

      {/* Right Inspector */}
      <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-inspector-width bg-surface border-l border-outline-variant flex flex-col z-40 overflow-hidden">
        <div className="p-gutter border-b border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">AI Orchestrator</h3>
            <span className="bg-ai-glow text-ai-vibrant font-label-sm text-label-sm px-2 py-0.5 rounded">3 ACTIVE</span>
          </div>
          <div className="space-y-4">
            <AgentStatus name="ARCHITECT" state="idle"><p className="text-[12px] text-on-surface-variant">Document structure optimized for executive readability.</p></AgentStatus>
            <div className="bg-white p-3 rounded border-2 border-ai-vibrant shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ai-vibrant animate-pulse" />
                  <span className="font-label-sm text-label-sm font-bold text-ai-vibrant">GENERATOR</span>
                </div>
                <span className="font-label-sm text-[10px] text-ai-vibrant">WRITING...</span>
              </div>
              <div className="space-y-1">
                <div className="h-1 bg-ai-glow rounded overflow-hidden">
                  <div className="h-full bg-ai-vibrant animate-wave-active" style={{ width: '65%' }} />
                </div>
                <p className="text-[12px] text-on-surface">Expanding section: APAC Regional Analysis...</p>
              </div>
            </div>
            <AgentStatus name="CRITIC" state="review"><p className="text-[12px] text-on-surface-variant">Queued: Fact-checking and citation audit.</p></AgentStatus>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-gutter bg-surface-studio">
          <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-4">Document Outline</h3>
          <nav className="space-y-3">
            <OutlineItem label="Executive Summary" done />
            <OutlineItem label="Core Market Drivers" active sub={['Regional Dynamics', 'Regulatory Landscape', 'Technological Shifts']} />
            <OutlineItem label="Fiscal Projections" />
            <OutlineItem label="Risk Mitigation" />
          </nav>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-label-sm text-on-surface-variant">
          <span>1,248 WORDS</span>
          <span>AI EFFICIENCY: 82%</span>
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
