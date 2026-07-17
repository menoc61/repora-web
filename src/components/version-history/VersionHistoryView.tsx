import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import VersionCard from './VersionCard'
import DiffViewer from './DiffViewer'
import AcceptChangesBar from './AcceptChangesBar'
import { Version, VERSIONS } from './types'
import { useVersions, useRestoreVersion, useCollaborators, useSaveDocument, useAcceptChanges, useDocument } from '../../hooks/useQueries'

interface VersionHistoryViewProps {
  docId: string | undefined
}

export default function VersionHistoryView({ docId }: VersionHistoryViewProps) {
  const [showRetention, setShowRetention] = useState(false)
  const [retentionDays, setRetentionDays] = useState(365)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [restoreSuccess, setRestoreSuccess] = useState(false)
  const { data: versionsData, isLoading: versionsLoading } = useVersions(docId)
  const { data: collaboratorsData = [], isLoading: collabsLoading } = useCollaborators()
  const { data: document } = useDocument(docId)
  const restoreVersion = useRestoreVersion()
  const saveDocument = useSaveDocument()
  const acceptChanges = useAcceptChanges()

  const allVersions: Version[] = versionsData?.versions
    ? (versionsData.versions as any[]).map((v: any) => ({
        version: v.version ?? v.label ?? '',
        time: v.timestamp ?? v.time ?? '',
        user: v.author ?? v.user ?? '',
        desc: v.description ?? v.desc ?? '',
        isAI: v.isAI ?? false,
        isAuto: v.isAuto ?? false,
        additions: v.additions,
        removals: v.removals,
      }))
    : VERSIONS

  const handleSelectVersion = (v: Version) => {
    if (v.version === 'ACTUEL') return
    setSelectedVersion(v)
    setRestoreSuccess(false)
  }
  const handleRestore = () => {
    if (docId && selectedVersion?.version) {
      restoreVersion.mutate(
        { documentId: docId, version: selectedVersion.version },
        { onSuccess: () => setRestoreSuccess(true) },
      )
    }
  }
  const handleAcceptChanges = () => {
    if (docId) {
      acceptChanges.mutate(docId, {
        onSuccess: () => setRestoreSuccess(true),
        onError: () => setRestoreSuccess(false),
      })
    }
  }
  const handleApplySuggestion = () => {
    if (docId) {
      acceptChanges.mutate(docId, {
        onSuccess: () => setRestoreSuccess(true),
        onError: () => setRestoreSuccess(false),
      })
    }
  }
  const handleManageRetention = () => setShowRetention(true)
  const handleSaveRetention = () => {
    if (docId) {
      saveDocument.mutate({ id: docId, retentionDays })
    }
    setShowRetention(false)
  }
  const handleCloseComparison = () => {
    setSelectedVersion(null)
    setRestoreSuccess(false)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-[280px] h-full bg-surface-studio border-r border-outline-variant flex flex-col shrink-0">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-md text-body-lg font-bold">Historique</h2>
            {docId && (
              <Link to="/editor" search={{ id: docId }} className="flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" title="Retour au document">
                <Icon name="arrow_back" className="text-[16px]" />
              </Link>
            )}
          </div>
          <p className="text-on-surface-variant font-body-sm text-body-sm mt-1 truncate">{document?.title || 'Document'}</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {versionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="progress_activity" className="text-2xl animate-spin text-on-surface-variant" />
            </div>
          ) : (
            allVersions.map((v) => (
              <VersionCard
                key={v.version}
                version={v}
                active={!!v.active}
                selected={selectedVersion?.version === v.version}
                onSelect={() => handleSelectVersion(v)}
              />
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-studio relative">
        {selectedVersion ? (
          <DiffViewer
            version={selectedVersion}
            versionsData={versionsData}
            restoreSuccess={restoreSuccess}
            restorePending={restoreVersion.isPending}
            acceptPending={acceptChanges.isPending}
            onRestore={handleRestore}
            onAccept={handleAcceptChanges}
            onClose={handleCloseComparison}
          />
        ) : (
          <div className="max-w-[800px] mx-auto py-12 px-8 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            {versionsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Icon name="progress_activity" className="text-3xl animate-spin text-on-surface-variant" />
              </div>
            ) : !docId ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Icon name="history" className="text-5xl text-outline mb-4" />
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Aucun document selectionne</h3>
                <p className="text-on-surface-variant">Accedez a l&apos;historique depuis un document pour comparer les versions.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Icon name="compare_arrows" className="text-5xl text-outline mb-4" />
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Selectionnez une version a comparer</h3>
                <p className="text-on-surface-variant">Cliquez sur une version dans le panneau lateral pour afficher les differences.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AcceptChangesBar
        selectedVersion={selectedVersion}
        acceptPending={acceptChanges.isPending}
        collaborators={collaboratorsData as any[]}
        collabsLoading={collabsLoading}
        retentionDays={retentionDays}
        onApplySuggestion={handleApplySuggestion}
        onManageRetention={handleManageRetention}
      />
      <Dialog open={showRetention} onOpenChange={setShowRetention}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerer la retention</DialogTitle>
          </DialogHeader>
          <p className="text-body-sm text-on-surface-variant">Definissez la duree de conservation des versions pour vos documents.</p>
          <div className="space-y-3">
            {[30, 90, 180, 365].map((days) => (
              <label key={days} className="flex items-center gap-3 p-3 bg-surface-studio rounded border border-outline-variant cursor-pointer hover:border-secondary">
                <input type="radio" name="retention" checked={days === retentionDays} className="text-secondary" onChange={() => setRetentionDays(days)} />
                <span className="font-body-sm">{days} jours</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetention(false)}>Annuler</Button>
            <Button className="bg-secondary text-white" onClick={handleSaveRetention} disabled={saveDocument.isPending}>{saveDocument.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
