import { Button } from '../ui/button'
import Icon from '../Icon'

interface RestoreButtonProps {
  pending: boolean
  disabled: boolean
  onRestore: () => void
}

export default function RestoreButton({ pending, disabled, onRestore }: RestoreButtonProps) {
  return (
    <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-studio transition-all" onClick={onRestore} disabled={disabled}>
      <Icon name="restore" /> {pending ? 'Restauration...' : 'Restaurer cette version'}
    </Button>
  )
}
