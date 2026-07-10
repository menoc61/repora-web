import Icon from '../Icon'
import { Button } from '../ui/button'

interface AuditPanelProps {
  onViewLogs: () => void
}

export default function AuditPanel({ onViewLogs }: AuditPanelProps) {
  return (
    <section className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="auto_awesome" className="text-secondary" fill />
        <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest">Audit souverain</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-body-sm text-on-surface-variant p-2 bg-surface-studio rounded">
          <Icon name="check_circle" className="text-status-final text-lg" />
          <span>Aucune tentative d&apos;acces non autorisee au cours des dernieres 24h.</span>
        </div>
        <div className="flex items-center gap-3 text-body-sm text-on-surface-variant p-2 bg-surface-studio rounded">
          <Icon name="info" className="text-status-review text-lg" />
          <span>1 lien externe actuellement actif.</span>
        </div>
      </div>
      <Button variant="link" className="mt-4 w-full text-center text-secondary font-label-md text-label-md hover:underline p-0 h-auto" onClick={onViewLogs}>Voir les journaux d&apos;acces</Button>
    </section>
  )
}
