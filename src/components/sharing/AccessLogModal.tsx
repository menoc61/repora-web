import Icon from '../Icon'
import { Button } from '../ui/button'

interface AccessLogModalProps {
  open: boolean
  logs: any
  onClose: () => void
}

export default function AccessLogModal({ open, logs, onClose }: AccessLogModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-headline-md text-headline-md mb-4">Journaux d&apos;acces</h3>
        {logs && Array.isArray(logs) ? (
          <div className="space-y-3">
            {(logs as any[]).map((log: any, i: number) => (
              <div key={i} className="p-3 bg-surface-studio rounded border border-outline-variant">
                <div className="flex justify-between text-body-sm">
                  <span className="font-semibold">{log.user ?? log.email ?? 'Inconnu'}</span>
                  <span className="text-label-sm text-on-surface-variant">{log.timestamp ?? log.time ?? ''}</span>
                </div>
                <p className="text-label-sm text-on-surface-variant">{log.action ?? log.event ?? 'Acces'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant">Aucune tentative d&apos;acces non autorisee au cours des dernieres 24h.</p>
        )}
        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  )
}
