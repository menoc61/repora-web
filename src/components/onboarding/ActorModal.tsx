import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'

interface ActorModalProps {
  open: boolean
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function ActorModal({ open, value, onChange, onConfirm, onCancel }: ActorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un acteur</DialogTitle>
        </DialogHeader>
        <Input
          className="w-full bg-surface-studio border border-outline-variant rounded-lg px-4 py-2 font-body-sm"
          placeholder="Nom de l'acteur..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button className="bg-secondary text-white" onClick={onConfirm} disabled={!value.trim()}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
