import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import { Button } from '../ui/button'
import type { Document } from '../../schemas'

interface EditorHeaderProps {
  title: string
  status: Document['status']
  docId: string | undefined
  projectId?: string
  onShare: () => void
  onExport: (format: 'pdf' | 'docx') => void
  onPreview: () => void
  onResume?: () => void
  sharePending: boolean
  collabStatus?: 'connecting' | 'connected' | 'disconnected'
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'BROUILLON',
  review: 'EN REVISION',
  in_review: 'EN REVISION',
  final: 'VALIDE',
  validated: 'VALIDE',
  active: 'EDITION ACTIVE',
  rejected: 'REJETE',
  reviewed: 'EXAMINE',
}

const STATUS_COLORS: Record<string, string> = {
  review: 'bg-status-review',
  in_review: 'bg-status-review',
  reviewed: 'bg-status-review',
  final: 'bg-status-final',
  validated: 'bg-status-final',
  active: 'bg-status-final',
  rejected: 'bg-error',
}

export function EditorHeader({ title, status, docId, projectId, onShare, onExport, onPreview, onResume, sharePending, collabStatus }: EditorHeaderProps) {
  const statusLabel = STATUS_LABELS[status as string] || (status as string).toUpperCase()
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 h-14 bg-surface-studio border-b border-outline-variant flex justify-between items-center px-6 z-40">
      <div className="flex items-center gap-4 min-w-0">
        <Link
          to="/library"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors shrink-0"
          title="Retour a la bibliotheque"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span className="font-label-md text-label-md hidden sm:inline">Bibliotheque</span>
        </Link>
        <div className="h-5 w-px bg-outline-variant shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-body-md text-body-md font-bold truncate">{title}</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[status as string] || 'bg-status-draft'}`} />
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">{statusLabel}</span>
            {collabStatus && (
              <span className={`flex items-center gap-1 ml-2 ${
                collabStatus === 'connected' ? 'text-status-final' :
                collabStatus === 'connecting' ? 'text-status-review' :
                'text-on-surface-variant/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  collabStatus === 'connected' ? 'bg-status-final' :
                  collabStatus === 'connecting' ? 'bg-status-review animate-pulse' :
                  'bg-on-surface-variant/40'
                }`} />
                <span className="font-label-sm text-[10px]">
                  {collabStatus === 'connected' ? 'Synchro' : collabStatus === 'connecting' ? 'Connexion...' : 'Hors ligne'}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(status === 'draft' || status === 'in_review') && onResume && (
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ai-vibrant/10 text-ai-vibrant border border-ai-vibrant/30 rounded-lg font-label-md text-label-md hover:bg-ai-vibrant/20 transition-colors"
            title="Reprendre la generation"
          >
            <Icon name="play_arrow" className="text-[16px]" />
            <span className="hidden md:inline">Reprendre</span>
          </button>
        )}
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
          title="Apercu du document"
        >
          <Icon name="visibility" className="text-[16px]" />
          <span className="hidden md:inline">Apercu</span>
        </button>
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            <Icon name="export_notes" className="text-[16px]" />
            <span className="hidden md:inline">Exporter</span>
            <Icon name={exportOpen ? 'expand_less' : 'expand_more'} className="text-[14px]" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-surface-studio border border-outline-variant rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => { onExport('pdf'); setExportOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Icon name="picture_as_pdf" className="text-[16px] text-red-500" />
                PDF
              </button>
              <button
                onClick={() => { onExport('docx'); setExportOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Icon name="description" className="text-[16px] text-blue-500" />
                Word (DOCX)
              </button>
            </div>
          )}
        </div>
        <Button
          onClick={onShare}
          disabled={!docId || sharePending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ai-vibrant text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
        >
          <Icon name="share" className="text-[16px]" />
          <span className="hidden md:inline">Partager</span>
        </Button>
        <div className="h-5 w-px bg-outline-variant ml-1" />
        <Link to="/history" search={{ id: docId }} className="text-on-surface-variant hover:text-primary transition-colors" title="Historique des versions">
          <Icon name="history" />
        </Link>
        <Link to="/settings" className="text-on-surface-variant hover:text-primary transition-colors" title="Parametres">
          <Icon name="account_circle" />
        </Link>
      </div>
    </header>
  )
}

export default EditorHeader
