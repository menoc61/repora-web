import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import { Button } from '../ui/button'
import type { Document } from '../../schemas'

interface EditorHeaderProps {
  title: string
  status: Document['status']
  docId: string | undefined
  onShare: () => void
  onExport: (format: 'pdf' | 'docx') => void
  sharePending: boolean
}

export function EditorHeader({ title, status, docId, onShare, onExport, sharePending }: EditorHeaderProps) {
  const statusLabel = status === 'review' ? 'EN REVISION' : status.toUpperCase()

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-var(--sidebar-width,280px))] h-16 bg-surface-studio border-b border-outline-variant flex justify-between items-center px-gutter z-40">
      <div className="flex items-center gap-6">
        <Link to="/library" className="flex items-center gap-2 text-on-surface-variant hover:text-secondary font-label-sm text-label-sm mr-2" title="Retour a la bibliotheque">
          <Icon name="arrow_back" className="text-[18px]" /> Bibliotheque
        </Link>
        <div className="flex flex-col">
          <span className="font-body-md text-body-md font-bold">{title}</span>
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
        <button onClick={() => onExport('pdf')} className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container transition-colors">
          <Icon name="export_notes" className="text-[18px]" /> Exporter
        </button>
        <Link to="/sharing" search={{ id: docId }} className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container transition-colors">
          <Icon name="group" className="text-[18px]" /> Gerer les acces
        </Link>
        <Button onClick={onShare} disabled={!docId || sharePending} className="flex items-center gap-2 px-4 py-1.5 bg-ai-vibrant text-white rounded font-label-md text-label-md hover:opacity-90 transition-all">
          <Icon name="share" className="text-[18px]" /> Partager
        </Button>
        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-outline-variant">
          <button className="text-on-surface-variant hover:text-primary" onClick={() => alert('Fonctionnalite a venir')}><Icon name="notifications" /></button>
          <Link to="/history" search={{ id: docId }} className="text-on-surface-variant hover:text-primary" title="Historique des versions"><Icon name="history" /></Link>
          <Link to="/settings" className="text-on-surface-variant hover:text-primary" title="Parametres"><Icon name="account_circle" /></Link>
        </div>
      </div>
    </header>
  )
}

export default EditorHeader
