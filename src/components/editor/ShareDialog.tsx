import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { notify } from '../Toast'
import { useValidationToken } from '../../hooks/useQueries'

interface ShareDialogProps {
  docId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onShareStateChange?: (pending: boolean) => void
}

export function ShareDialog({ docId, open, onOpenChange, onShareStateChange }: ShareDialogProps) {
  const validationToken = useValidationToken(docId)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  async function runShare() {
    if (!docId) return
    onShareStateChange?.(true)
    try {
      const { token } = await validationToken.mutateAsync()
      const base = `${window.location.origin}/validate/${token}`
      setShareUrl(base)
      await navigator.clipboard?.writeText(base)
    } catch {
      notify({ type: 'error', title: 'Erreur', message: 'Echec de la generation du lien de validation.' })
    } finally {
      onShareStateChange?.(false)
    }
  }

  useEffect(() => {
    if (open) {
      runShare()
    }
  }, [open])

  return (
    <>
      {shareUrl && (
        <div className="px-gutter py-2 bg-ai-glow text-ai-vibrant font-label-sm text-label-sm flex items-center gap-2">
          <Icon name="link" className="text-[16px]" />
          Lien de validation copie : {shareUrl}
        </div>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-body-sm text-on-surface-variant">
              Ce lien permet au client de valider le document section par section. Il a ete copie dans le presse-papiers.
            </p>
            {shareUrl ? (
              <div className="flex items-center gap-2 border border-outline-variant rounded p-2 bg-surface-studio">
                <span className="flex-1 font-label-sm truncate">{shareUrl}</span>
                <Button
                  onClick={() => navigator.clipboard?.writeText(shareUrl)}
                  className="bg-ai-vibrant text-white px-3 py-1.5 rounded font-label-sm hover:opacity-90 transition-all"
                >
                  Copier
                </Button>
              </div>
            ) : (
              <p className="font-label-sm text-on-surface-variant">Generation du lien...</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShareDialog
