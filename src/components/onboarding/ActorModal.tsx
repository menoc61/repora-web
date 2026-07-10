import Icon from '../Icon'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ActorModalProps {
  open: boolean
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function ActorModal({ open, value, onChange, onConfirm, onCancel }: ActorModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-headline-md text-headline-md mb-4">Ajouter un acteur</h3>
        <Input
          className="w-full bg-surface-studio border border-outline-variant rounded-lg px-4 py-2 font-body-sm mb-4"
          placeholder="Nom de l'acteur..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" className="px-4 py-2" onClick={onCancel}>Annuler</Button>
          <Button className="px-4 py-2 bg-secondary text-white" onClick={onConfirm} disabled={!value.trim()}>Ajouter</Button>
        </div>
      </div>
    </div>
  )
}
