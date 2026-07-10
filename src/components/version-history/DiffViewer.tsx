import Icon from '../Icon'
import { Button } from '../ui/button'
import RestoreButton from './RestoreButton'
import { Version } from './types'

interface DiffViewerProps {
  version: Version
  versionsData: any
  restoreSuccess: boolean
  restorePending: boolean
  acceptPending: boolean
  onRestore: () => void
  onAccept: () => void
  onClose: () => void
}

export default function DiffViewer({
  version,
  versionsData,
  restoreSuccess,
  restorePending,
  acceptPending,
  onRestore,
  onAccept,
  onClose,
}: DiffViewerProps) {
  return (
    <>
      <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-outline-variant px-margin-desktop py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-studio px-3 py-1.5 rounded border border-outline-variant">
            <span className="font-label-md text-label-md">Comparaison :</span>
            <span className="font-label-md text-label-md font-bold text-primary">{version.version}</span>
            <Icon name="compare_arrows" className="text-[16px]" />
            <span className="font-label-md text-label-md font-bold text-primary">Actuel</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RestoreButton pending={restorePending} disabled={restorePending || !version} onRestore={onRestore} />
          <Button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all" onClick={onAccept} disabled={acceptPending}>
            <Icon name="done_all" /> {acceptPending ? 'Application...' : 'Accepter les modifications'}
          </Button>
          <Button variant="ghost" size="icon" className="p-2 hover:bg-surface-studio rounded-lg text-on-surface-variant" onClick={onClose} title="Fermer la comparaison">
            <Icon name="close" />
          </Button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto py-12 px-8 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
        {restoreSuccess ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-status-final/20 flex items-center justify-center mb-4">
              <Icon name="check_circle" className="text-4xl text-status-final" fill />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Version restauree</h3>
            <p className="text-on-surface-variant mb-6">La version <strong>{version.version}</strong> a ete restauree avec succes.</p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 bg-surface-studio rounded-xl border border-outline-variant">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Differences entre {version.version} et la version actuelle</h4>
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded border border-outline-variant">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-status-final/20 text-status-final">+{version.additions ?? 0}</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-error/20 text-error">-{version.removals ?? 0}</span>
                  </div>
                  <p className="text-body-sm">{version.desc}</p>
                  <p className="font-label-sm text-label-sm text-outline mt-2">Auteur : {version.user} &middot; {version.time}</p>
                </div>

                {versionsData?.versions ? (
                  <div className="p-4 bg-surface rounded border border-outline-variant">
                    <h5 className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase tracking-wider">Contenu du diff (API)</h5>
                    <pre className="text-label-sm whitespace-pre-wrap text-on-surface-variant bg-surface-studio p-3 rounded overflow-x-auto max-h-64">
                      {JSON.stringify(versionsData, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 bg-surface rounded border border-outline-variant">
                    <p className="text-body-sm text-on-surface-variant italic">
                      Les donnees de comparaison detaillees seront affichees ici lorsque le backend de diff sera disponible.
                      Les modifications incluent {version.additions ?? 0} ajouts et {version.removals ?? 0} suppressions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
