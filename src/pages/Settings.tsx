import React, { useState } from 'react'
import Icon from '../components/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useMe, useApiKeys, useCreateApiKey, useDeleteApiKey, useAgents, usePatchAgent, useHealth, useModels, useDetailedModels, useSetActiveModel } from '@/hooks/useQueries'
import { useSettingsStore } from '../stores'
import { useGenerationStore } from '../stores/generationStore'
import { RequireRole } from '../components/RequireRole'
import { api } from '../api/client'
import { notify } from '../components/Toast'

interface ToggleProps {
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Settings() {
  const { data: me } = useMe()
  const isAdmin = me?.role === 'admin' || me?.role === 'super_admin'
  const { data: agents = [] } = useAgents(isAdmin)
  const patchAgent = usePatchAgent(isAdmin)
  const { data: apiKeys = [] } = useApiKeys(isAdmin)
  const createApiKey = useCreateApiKey(isAdmin)
  const deleteApiKey = useDeleteApiKey(isAdmin)
  const { data: health } = useHealth()
  const { settings, updateSettings } = useSettingsStore()
  const { sessions, removeSession } = useGenerationStore()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newProvider, setNewProvider] = useState('')
  const [newKey, setNewKey] = useState('')
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [editProvider, setEditProvider] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [profilePassword, setProfilePassword] = useState('')
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: detailedModels = [] } = useDetailedModels()
  const setActiveModel = useSetActiveModel()

  React.useEffect(() => {
    if (me) setProfileName(me.name)
  }, [me])

  const handleSaveProfile = async () => {
    if (profilePassword && profilePassword !== profilePasswordConfirm) {
      notify({ type: 'error', title: 'Erreur', message: 'Les mots de passe ne correspondent pas.' })
      return
    }
    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (profileName && profileName !== me?.name) body.name = profileName
      if (profilePassword) body.password = profilePassword
      if (Object.keys(body).length === 0) return
      await api.patch('/auth/me', body)
      notify({ type: 'success', title: 'Profil mis a jour', message: 'Vos informations ont ete enregistrees.' })
      setProfilePassword('')
      setProfilePasswordConfirm('')
    } catch (err: any) {
      notify({ type: 'error', title: 'Erreur', message: err?.message ?? 'Echec de la mise a jour.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveKey = () => {
    if (!newProvider.trim() || !newKey.trim()) return
    createApiKey.mutate(
      { provider: newProvider.trim(), apiKey: newKey.trim() },
      {
        onSuccess: () => {
          setShowKeyModal(false)
          setNewProvider('')
          setNewKey('')
        },
      },
    )
  }

  const startEdit = (agent: { name: string; provider: string; enabled: boolean; modelId?: string }) => {
    setEditingAgent(agent.name)
    setEditProvider(agent.provider)
    setEditModel(agent.modelId ?? '')
    setEditEnabled(agent.enabled)
  }

  const cancelEdit = () => {
    setEditingAgent(null)
  }

  const saveAgent = () => {
    if (!editingAgent) return
    patchAgent.mutate(
      { name: editingAgent, patch: { provider: editProvider, modelId: editModel || undefined, enabled: editEnabled } },
      { onSuccess: () => setEditingAgent(null) },
    )
  }

  return (
    <div className="min-h-screen bg-surface-studio">
      <header className="h-14 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant sticky top-0 z-40">
        <span className="font-headline-md text-headline-md font-black text-primary">Parametres</span>
        <div className="flex items-center gap-4">
          {me && (
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-label-md text-primary leading-tight">{me.name}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{me.role}</p>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-surface-studio p-8">
        <div className="max-w-[960px] mx-auto space-y-12">

          <RequireRole role={['admin', 'super_admin']}>
          <section className="space-y-6">
            <div className="border-b border-outline-variant pb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Configurations des agents</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Gerer les agents de l&apos;orchestrateur Hermes.</p>
            </div>
            {agents.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">Aucun agent configure.</p>
            ) : (
              <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
                <Table className="w-full text-left border-collapse">
                  <TableHeader className="bg-surface-studio border-b border-outline-variant">
                    <TableRow>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">AGENT</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">FOURNISSEUR</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">MODELE</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">ACTIF</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-outline-variant">
                    {(agents || []).map((agent) => {
                      const isEditing = editingAgent === agent.name
                      return (
                        <TableRow key={agent.name} className="hover:bg-surface-container-low transition-colors">
                          <TableCell className="px-6 py-4">
                            <span className="font-body-md text-body-md font-medium">{agent.name}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {isEditing ? (
                              <Input
                                className="w-full bg-surface-studio border border-outline-variant rounded px-2 py-1 font-label-sm"
                                value={editProvider}
                                onChange={(e) => setEditProvider((e.target as HTMLInputElement).value)}
                              />
                            ) : (
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{agent.provider}</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {isEditing ? (
                              <Input
                                className="w-full bg-surface-studio border border-outline-variant rounded px-2 py-1 font-label-sm"
                                value={editModel}
                                onChange={(e) => setEditModel((e.target as HTMLInputElement).value)}
                                placeholder="model id"
                              />
                            ) : (
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                {agent.modelId ?? '—'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {isEditing ? (
                              <Toggle checked={editEnabled} onChange={(e) => setEditEnabled(e.target.checked)} />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-status-final' : 'bg-status-draft'}`} />
                                <span className="font-label-sm text-label-sm">{agent.enabled ? 'Actif' : 'Inactif'}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="link" className="text-on-surface-variant font-label-md text-label-md p-0 h-auto" onClick={cancelEdit}>
                                  Annuler
                                </Button>
                                <Button className="bg-ai-vibrant text-white font-label-md text-label-md px-3 py-1 rounded" onClick={saveAgent} disabled={patchAgent.isPending}>
                                  {patchAgent.isPending ? '...' : 'Enregistrer'}
                                </Button>
                              </div>
                            ) : (
                              <Button variant="link" className="text-ai-vibrant font-label-md text-label-md p-0 h-auto" onClick={() => startEdit(agent)}>
                                Modifier
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
          </RequireRole>

          <RequireRole role={['admin', 'super_admin']}>
          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant pb-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">Cles API</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Gerer les cles pour les fournisseurs cloud (BYOK).</p>
              </div>
              <Button
                variant="link"
                className="font-label-md text-label-md text-ai-vibrant flex items-center gap-1 hover:underline p-0 h-auto"
                onClick={() => setShowKeyModal(true)}
              >
                <Icon name="add" className="text-[18px]" />Ajouter une cle
              </Button>
            </div>
            {apiKeys.length === 0 ? (
              <div className="bg-white border border-outline-variant rounded-lg p-6 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">Aucune cle API configuree. Ajoutez une cle pour utiliser des fournisseurs cloud.</p>
              </div>
            ) : (
              <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
                <Table className="w-full text-left border-collapse">
                  <TableHeader className="bg-surface-studio border-b border-outline-variant">
                    <TableRow>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">FOURNISSEUR</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">AJOUTEE LE</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-outline-variant">
                    {(apiKeys || []).map((k: any) => (
                      <TableRow key={k.id} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="px-6 py-4">
                          <span className="font-body-md text-body-md font-medium">{k.provider}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button
                            variant="link"
                            className="text-error font-label-md text-label-md p-0 h-auto"
                            onClick={() => {
                              if (confirm('Supprimer cette cle API ?')) deleteApiKey.mutate(k.id)
                            }}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
          </RequireRole>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-6">
              <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-4">Profil utilisateur</h2>
              {me ? (
                <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Nom</label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName((e.target as HTMLInputElement).value)}
                      className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-body-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Email</label>
                    <Input
                      value={me.email}
                      readOnly
                      className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface-variant cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Role</label>
                    <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-label-sm w-fit">{me.role}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Nouveau mot de passe</label>
                    <Input
                      type="password"
                      placeholder="Laisser vide pour ne pas changer"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword((e.target as HTMLInputElement).value)}
                      className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-body-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-outline uppercase">Confirmer le mot de passe</label>
                    <Input
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={profilePasswordConfirm}
                      onChange={(e) => setProfilePasswordConfirm((e.target as HTMLInputElement).value)}
                      className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-body-md"
                    />
                  </div>
                  <Button
                    className="bg-ai-vibrant text-white font-label-md text-label-md px-4 py-2 rounded"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">Chargement...</p>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-4">Information application</h2>
              <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Statut</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-status-final' : 'bg-status-draft'}`} />
                    <span className="font-label-sm text-label-sm">{health?.status === 'ok' ? 'Operationnel' : 'Indisponible'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Agents configures</span>
                  <span className="font-body-md text-body-md">{agents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Cles API</span>
                  <span className="font-body-md text-body-md">{apiKeys.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Version</span>
                  <span className="font-body-md text-body-md">{(import.meta as any).env?.VITE_APP_VERSION ?? '1.0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">Environnement</span>
                  <span className="font-body-md text-body-md">{(import.meta as any).env?.MODE ?? 'development'}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-6">
            <div className="border-b border-outline-variant pb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Preferences IA</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Configurer les parametres par defaut pour les modeles d&apos;IA.</p>
            </div>
            <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase">Modele actif</label>
                <Select
                  value={settings.selectedModel ?? ''}
                  onValueChange={(v) => {
                    updateSettings({ selectedModel: v ?? undefined })
                    if (v) setActiveModel.mutate(v)
                  }}
                >
                  <SelectTrigger className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-label-sm focus:ring-1 focus:ring-ai-vibrant outline-none">
                    <SelectValue placeholder="Selectionner un modele..." />
                  </SelectTrigger>
                  <SelectContent>
                    {detailedModels.length === 0 ? (
                      <SelectItem value="loading" disabled>Aucun modele detecte</SelectItem>
                    ) : (
                      detailedModels.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          <div className="flex items-center gap-2">
                            <span>{m.name}</span>
                            {m.isCloud && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai-vibrant/10 text-ai-vibrant font-label-sm">cloud</span>
                            )}
                            {m.supportsTools && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-final/10 text-status-final font-label-sm">tools</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {settings.selectedModel && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {settings.selectedModel}
                    {settings.selectedModel.includes(':cloud') ? ' — mode cloud, necessite connexion internet' : ' — mode local, hors ligne'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase">Fournisseur par defaut</label>
                <Select value={settings.aiProvider} onValueChange={(v) => updateSettings({ aiProvider: v as typeof settings.aiProvider })}>
                  <SelectTrigger className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-label-sm focus:ring-1 focus:ring-ai-vibrant outline-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama (local)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="custom">Personnalise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase">URL du serveur local</label>
                <Input
                  className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-label-sm focus:ring-1 focus:ring-ai-vibrant outline-none"
                  placeholder="http://localhost:11434"
                  value={settings.ollamaUrl ?? ''}
                  onChange={(e) => updateSettings({ ollamaUrl: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase">Temperature par defaut</label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-label-sm focus:ring-1 focus:ring-ai-vibrant outline-none"
                  value={settings.temperature ?? 0.7}
                  onChange={(e) => updateSettings({ temperature: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-outline uppercase">Tokens max par section</label>
                <Input
                  type="number"
                  className="bg-surface-studio border border-outline-variant rounded-lg px-3 py-2 font-label-sm focus:ring-1 focus:ring-ai-vibrant outline-none"
                  value={settings.maxTokens ?? 4096}
                  onChange={(e) => updateSettings({ maxTokens: parseInt((e.target as HTMLInputElement).value, 10) || 0 })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="border-b border-outline-variant pb-4">
              <h2 className="font-headline-md text-headline-md text-primary">Sessions de generation</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Gerer les sessions de generation de documents en cours et terminees.</p>
            </div>
            {sessions.length === 0 ? (
              <div className="bg-white border border-outline-variant rounded-lg p-6 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">Aucune generation en cours.</p>
              </div>
            ) : (
              <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
                <Table className="w-full text-left border-collapse">
                  <TableHeader className="bg-surface-studio border-b border-outline-variant">
                    <TableRow>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">DOCUMENT</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">STATUT</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline">DEMARRE LE</TableHead>
                      <TableHead className="px-6 py-4 font-label-md text-label-md text-outline text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-outline-variant">
                    {sessions.map((session) => (
                      <TableRow key={session.sessionId} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="px-6 py-4">
                          <span className="font-body-md text-body-md font-medium">{session.title}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${session.status === 'generating' ? 'bg-status-draft' : session.status === 'completed' ? 'bg-status-final' : 'bg-error'}`} />
                            <span className="font-label-sm text-label-sm">
                              {session.status === 'generating' ? 'En cours' : session.status === 'completed' ? 'Termine' : 'Echoue'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {new Date(session.startedAt).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          {session.status === 'generating' ? (
                            <Button
                              variant="link"
                              className="text-ai-vibrant font-label-md text-label-md p-0 h-auto"
                              onClick={() => window.location.href = `/editor?id=${session.documentId}`}
                            >
                              Reprendre
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              className="text-error font-label-md text-label-md p-0 h-auto"
                              onClick={() => removeSession(session.sessionId)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

        </div>
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowKeyModal(false)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-4">Nouvelle cle API</h3>
            <label className="block font-body-sm font-semibold mb-1">Fournisseur</label>
            <Input
              className="w-full bg-surface-studio border border-outline-variant rounded-lg px-4 py-2 font-body-sm mb-4"
              placeholder="Ex: anthropic, openai..."
              value={newProvider}
              onChange={(e) => setNewProvider((e.target as HTMLInputElement).value)}
            />
            <label className="block font-body-sm font-semibold mb-1">Cle API</label>
            <Input
              className="w-full bg-surface-studio border border-outline-variant rounded-lg px-4 py-2 font-body-sm mb-6"
              placeholder="sk-..."
              type="password"
              value={newKey}
              onChange={(e) => setNewKey((e.target as HTMLInputElement).value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="px-4 py-2" onClick={() => setShowKeyModal(false)}>
                Annuler
              </Button>
              <Button className="px-4 py-2 bg-secondary text-white" onClick={handleSaveKey} disabled={createApiKey.isPending}>
                {createApiKey.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-vibrant" />
    </label>
  )
}
