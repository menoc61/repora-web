import { useState } from 'react'
import { Link, useSearch, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { useVersions, useRestoreVersion, useCollaborators, useSaveDocument, useApplyPatch } from '../hooks/useQueries'

interface Version {
  version: string
  label?: string
  time: string
  user: string
  avatar?: null
  desc: string
  active?: boolean
  isAI?: boolean
  isAuto?: boolean
  additions?: number
  removals?: number
  older?: boolean
}

const VERSIONS: Version[] = [
  { version: 'ACTUEL', label: 'v2.1.2', time: "A l'instant", user: 'Sarah Jenkins', avatar: null, desc: "Ajout des clauses d'arbitrage et affinement des limites de responsabilite.", active: true },
  { version: 'v2.1.0', time: 'Il y a 2h', user: 'Repora AI Agent', avatar: null, isAI: true, desc: 'Optimisation du ton pour la conformite corporate et verification grammaticale.' },
  { version: 'v2.0.4', time: '12 Oct, 14:20', user: 'Marcus Thorne', avatar: null, desc: 'Redaction initiale de la Section 4 : Accords de traitement des donnees.', additions: 142, removals: 28 },
  { version: 'v2.0.1', time: '11 Oct, 09:15', user: 'Auto-Backup', avatar: null, isAuto: true, desc: 'Capture systeme avant fusion collaborative.', older: true },
]

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietaire',
  admin: 'Admin',
  editor: 'Edition',
  reviewer: 'Revision',
  viewer: 'Lecture',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-status-final',
  admin: 'bg-primary',
  editor: 'bg-ai-vibrant',
  reviewer: 'bg-status-review',
  viewer: 'bg-on-surface-variant',
}

export default function VersionHistory() {
  const search = useSearch({ from: '/history' })
  const docId = search.id
  const [showMore, setShowMore] = useState(false)
  const [showRetention, setShowRetention] = useState(false)
  const [retentionDays, setRetentionDays] = useState(365)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [restoreSuccess, setRestoreSuccess] = useState(false)
  const { data: versionsData, isLoading: versionsLoading } = useVersions(docId)
  const { data: collaboratorsData = [], isLoading: collabsLoading } = useCollaborators()
  const restoreVersion = useRestoreVersion()
  const saveDocument = useSaveDocument()
  const applyPatch = useApplyPatch()
  const navigate = useNavigate()

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

  const handleLoadMore = () => setShowMore(true)
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
      applyPatch.mutate({ id: docId, action: 'accept' })
    }
  }
  const handleApplySuggestion = () => {
    if (docId) {
      applyPatch.mutate({ id: docId, action: 'apply' })
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
    <div className="pl-sidebar-width pt-16 h-screen flex overflow-hidden">
      <aside className="w-80 h-full bg-white border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-md text-body-lg font-bold">Historique des versions</h2>
            {docId && (
              <Link to="/editor" search={{ id: docId }} className="flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" title="Retour au document">
                <Icon name="arrow_back" className="text-[16px]" /> Retour au document
              </Link>
            )}
          </div>
          <p className="text-on-surface-variant font-body-sm text-body-sm mt-1">Suivi des captures pour legal_framework_v4.docx</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {versionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="progress_activity" className="text-2xl animate-spin text-on-surface-variant" />
            </div>
          ) : (
            allVersions.map((v) => (
              <div key={v.version} onClick={() => handleSelectVersion(v)}>
                {v.older && (
                  <div className="flex items-center gap-2 py-4">
                    <div className="h-[1px] bg-outline-variant flex-1" />
                    <span className="font-label-sm text-label-sm text-outline">Hier</span>
                    <div className="h-[1px] bg-outline-variant flex-1" />
                  </div>
                )}
                <div className={`p-4 rounded-lg cursor-pointer transition-all ${
                  v.active
                    ? 'bg-primary-container text-on-primary-container border-2 border-primary ring-2 ring-primary/10'
                    : selectedVersion?.version === v.version
                      ? 'bg-secondary-container/30 border-2 border-secondary ring-2 ring-secondary/10'
                      : 'bg-surface hover:bg-surface-variant/30 border border-outline-variant'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${v.active ? 'bg-primary text-on-primary' : selectedVersion?.version === v.version ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant'}`}>{v.version}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{v.time}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {v.isAI ? (
                      <div className="w-5 h-5 rounded-full bg-ai-vibrant flex items-center justify-center">
                        <Icon name="auto_awesome" className="text-[12px] text-white" fill />
                      </div>
                    ) : v.isAuto ? (
                      <div className="w-5 h-5 rounded-full bg-on-tertiary-container flex items-center justify-center">
                        <Icon name="person" className="text-[12px] text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200" />
                    )}
                    <span className="font-label-md text-label-md">{v.user}</span>
                  </div>
                  <p className={`font-body-sm text-body-sm leading-snug ${v.active ? 'opacity-90' : 'text-on-surface-variant'}`}>{v.desc}</p>
                  {v.additions ? (
                    <div className="mt-3 flex gap-2">
                      <span className="flex items-center gap-1 font-label-sm text-label-sm text-status-final">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-final" /> +{v.additions}
                      </span>
                      <span className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                        <span className="w-1.5 h-1.5 rounded-full bg-error" /> -{v.removals}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-outline-variant">
          <Button className="w-full py-2 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg font-label-md text-label-md transition-colors" onClick={handleLoadMore}>Charger plus d&apos;historique</Button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        {selectedVersion ? (
          <>
            <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-outline-variant px-margin-desktop py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-surface-studio px-3 py-1.5 rounded border border-outline-variant">
                  <span className="font-label-md text-label-md">Comparaison :</span>
                  <span className="font-label-md text-label-md font-bold text-primary">{selectedVersion.version}</span>
                  <Icon name="compare_arrows" className="text-[16px]" />
                  <span className="font-label-md text-label-md font-bold text-primary">Actuel</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-studio transition-all" onClick={handleRestore} disabled={restoreVersion.isPending || !selectedVersion}>
                  <Icon name="restore" /> {restoreVersion.isPending ? 'Restauration...' : 'Restaurer cette version'}
                </Button>
                <Button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all" onClick={handleAcceptChanges} disabled={applyPatch.isPending}>
                  <Icon name="done_all" /> {applyPatch.isPending ? 'Application...' : 'Accepter les modifications'}
                </Button>
                <Button variant="ghost" size="icon" className="p-2 hover:bg-surface-studio rounded-lg text-on-surface-variant" onClick={handleCloseComparison} title="Fermer la comparaison">
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
                  <p className="text-on-surface-variant mb-6">La version <strong>{selectedVersion.version}</strong> a ete restauree avec succes.</p>
                  <Button onClick={handleCloseComparison}>Fermer</Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 bg-surface-studio rounded-xl border border-outline-variant">
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Differences entre {selectedVersion.version} et la version actuelle</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-surface rounded border border-outline-variant">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-status-final/20 text-status-final">+{selectedVersion.additions ?? 0}</span>
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-error/20 text-error">-{selectedVersion.removals ?? 0}</span>
                        </div>
                        <p className="text-body-sm">{selectedVersion.desc}</p>
                        <p className="font-label-sm text-label-sm text-outline mt-2">Auteur : {selectedVersion.user} &middot; {selectedVersion.time}</p>
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
                            Les modifications incluent {selectedVersion.additions ?? 0} ajouts et {selectedVersion.removals ?? 0} suppressions.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
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
              <Button className="w-full py-1.5 text-ai-vibrant border border-ai-vibrant rounded font-label-md text-label-md hover:bg-ai-vibrant hover:text-white transition-all" onClick={handleApplySuggestion} disabled={applyPatch.isPending}>Appliquer la suggestion</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-label-md text-label-md text-on-surface-variant font-semibold">Collaborateurs actifs</h4>
            {collabsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="progress_activity" className="animate-spin text-on-surface-variant" />
              </div>
            ) : collaboratorsData.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-2">Aucun collaborateur actif.</p>
            ) : (
              collaboratorsData.flatMap((g: any) => g.collaborators ?? []).map((c: any) => (
                <div key={c.email} className="flex items-center justify-between p-2 rounded hover:bg-surface-studio cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
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
          <Button variant="ghost" className="w-full py-2 flex items-center justify-center gap-2 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors" onClick={handleManageRetention}>
            <Icon name="settings_backup_restore" /> Gerer la retention
          </Button>
        </div>
      </aside>
      {showRetention && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowRetention(false)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-4">Gerer la retention</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Definissez la duree de conservation des versions pour vos documents.</p>
            <div className="space-y-3 mb-6">
              {[30, 90, 180, 365].map((days) => (
                <label key={days} className="flex items-center gap-3 p-3 bg-surface-studio rounded border border-outline-variant cursor-pointer hover:border-secondary">
                  <input type="radio" name="retention" checked={days === retentionDays} className="text-secondary" onChange={() => setRetentionDays(days)} />
                  <span className="font-body-sm">{days} jours</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="px-4 py-2" onClick={() => setShowRetention(false)}>Annuler</Button>
              <Button className="px-4 py-2 bg-secondary text-white" onClick={handleSaveRetention} disabled={saveDocument.isPending}>{saveDocument.isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
