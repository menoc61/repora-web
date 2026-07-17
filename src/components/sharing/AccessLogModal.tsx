import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'

interface AccessLogModalProps {
  open: boolean
  logs: any
  onClose: () => void
}

export default function AccessLogModal({ open, logs, onClose }: AccessLogModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journaux d&apos;acces</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
