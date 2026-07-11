import Icon from '../Icon'
import { Button } from '../ui/button'
import SecuritySettings from './SecuritySettings'

interface ExternalAccessPanelProps {
  docId: string | undefined
  generatedLink: string | null
  copied: boolean
  onGenerate: () => void
  generating: boolean
  onCopy: () => void
  securityToggles: { passwordProtect: boolean; expiration: boolean; nda: boolean }
  onSecurityToggle: (key: 'passwordProtect' | 'expiration' | 'nda') => void
}

export default function ExternalAccessPanel({
  docId,
  generatedLink,
  copied,
  onGenerate,
  generating,
  onCopy,
  securityToggles,
  onSecurityToggle,
}: ExternalAccessPanelProps) {
  return (
    <section className="bg-primary-container text-on-primary-container rounded-xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10">
        <h3 className="font-headline-md text-headline-md text-white mb-4 flex items-center gap-2">
          <Icon name="link" className="text-ai-vibrant" />
          Acces externe
        </h3>
        <p className="text-on-primary-container text-body-sm mb-6">Creez une passerelle unique et chiffree pour les utilisateurs hors de votre organisation.</p>
        <Button
          className="w-full py-3 bg-ai-vibrant text-white font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 hover:bg-ai-vibrant/90 transition-all mb-6"
          onClick={onGenerate}
          disabled={generating}
        >
          <Icon name="shield" />
          {generating ? 'Generation...' : 'Generer un lien securise'}
        </Button>
        {generatedLink && (
          <div className="mb-6 space-y-2">
            <div className="p-3 bg-surface-studio rounded-lg border border-outline-variant">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Lien genere :</p>
              <code className="text-body-sm text-secondary break-all block">{generatedLink}</code>
            </div>
            <Button
              variant="outline"
              className={`w-full py-2 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${copied ? 'bg-status-final/10 text-status-final border-status-final' : 'border-outline-variant text-on-surface-variant hover:bg-surface-studio'}`}
              onClick={onCopy}
            >
              <Icon name={copied ? 'check_circle' : 'content_copy'} className="text-[16px]" />
              {copied ? 'Copie !' : 'Copier le lien'}
            </Button>
          </div>
        )}
        <SecuritySettings toggles={securityToggles} onToggle={onSecurityToggle} />
      </div>
    </section>
  )
}
