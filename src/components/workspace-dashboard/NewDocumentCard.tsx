import Icon from '../../components/Icon'

interface NewDocumentCardProps {
  onClick: () => void
  generating: boolean
}

export default function NewDocumentCard({ onClick, generating }: NewDocumentCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={generating}
      className="col-span-12 md:col-span-4 border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-ai-vibrant hover:bg-surface-container-low transition-all cursor-pointer min-h-[200px] group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-14 h-14 rounded-full bg-ai-glow flex items-center justify-center mb-4 group-hover:bg-ai-vibrant/20 transition-colors">
        {generating ? (
          <Icon name="progress_activity" className="text-[28px] text-ai-vibrant animate-spin" />
        ) : (
          <Icon name="add" className="text-[32px] text-ai-vibrant" />
        )}
      </div>
      <h4 className="font-headline-md text-[18px] font-bold text-primary mb-1">
        {generating ? 'Creation en cours...' : 'Nouveau document'}
      </h4>
      <p className="text-body-sm text-on-surface-variant">
        Creer un document vierge avec l&apos;assistant IA
      </p>
    </button>
  )
}
