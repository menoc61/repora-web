import Icon from '../Icon'
import { Button } from '../ui/button'
import { Version, ROLE_LABELS, ROLE_COLORS } from './types'

interface AcceptChangesBarProps {
  selectedVersion: Version | null
  acceptPending: boolean
  collaborators: any[]
  collabsLoading: boolean
  retentionDays: number
  onApplySuggestion: () => void
  onManageRetention: () => void
}

export default function AcceptChangesBar({
  selectedVersion,
  acceptPending,
  collaborators,
  collabsLoading,
  retentionDays,
  onApplySuggestion,
  onManageRetention,
}: AcceptChangesBarProps) {
  return (
    <aside className="w-inspector-width h-full bg-white border-l border-outline-variant flex flex-col">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">Orchestrateur IA</h3>
        <Icon name="monitoring" className="text-ai-vibrant animate-pulse" />
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="p-4 rounded-xl border border-ai-vibrant/30 bg-ai-glow/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-ai-vibrant flex items-center justify-center shadow-sm">
              <Icon name="policy" className="text-white text-[18px]" fill />
            </div>
            <div>
              <p className="font-label-md text-label-md font-bold">Legal Scout</p>
              <p className="font-label-sm text-label-sm text-on-tertiary-container">Analyse du diff...</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded border border-outline-variant text-body-sm text-body-sm leading-snug">
              &quot;{selectedVersion ? `Analyse de la version ${selectedVersion.version} en cours...` : 'Selectionnez deux versions pour obtenir une analyse juridique des modifications.'}&quot;
            </div>
            <div className="h-1 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-ai-vibrant w-1/3" />
            </div>
            <Button className="w-full py-1.5 text-ai-vibrant border border-ai-vibrant rounded font-label-md text-label-md hover:bg-ai-vibrant hover:text-white transition-all" onClick={onApplySuggestion} disabled={acceptPending}>Appliquer la suggestion</Button>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-label-md text-label-md text-on-surface-variant font-semibold">Collaborateurs actifs</h4>
          {collabsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Icon name="progress_activity" className="animate-spin text-on-surface-variant" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant py-2">Aucun collaborateur actif.</p>
          ) : (
            collaborators.flatMap((g: any) => g.collaborators ?? []).map((c: any, idx: number) => (
              <div key={`${c.email}-${idx}`} className="flex items-center justify-between p-2 rounded hover:bg-surface-studio cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-surface-container" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${ROLE_COLORS[c.role] ?? 'bg-outline'} border-2 border-white rounded-full`} />
                  </div>
                  <span className="font-body-sm text-body-sm">{c.name}</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{ROLE_LABELS[c.role] ?? c.role}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="p-6 bg-surface-studio border-t border-outline-variant">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="info" className="text-on-surface-variant" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">Les captures sont conservees pendant {retentionDays} jours dans le cadre de votre abonnement Enterprise.</p>
        </div>
        <Button variant="ghost" className="w-full py-2 flex items-center justify-center gap-2 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors" onClick={onManageRetention}>
          <Icon name="settings_backup_restore" /> Gerer la retention
        </Button>
      </div>
    </aside>
  )
}
