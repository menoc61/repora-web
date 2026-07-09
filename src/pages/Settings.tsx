import React, { useState } from 'react'
import Icon from '../components/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useMe, useApiKeys, useCreateApiKey, useDeleteApiKey, useAgents, usePatchAgent, useHealth } from '@/hooks/useQueries'

interface ToggleProps {
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Settings() {
  const { data: me } = useMe()
  const { data: agents = [] } = useAgents()
  const patchAgent = usePatchAgent()
  const { data: apiKeys = [] } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const deleteApiKey = useDeleteApiKey()
  const { data: health } = useHealth()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newProvider, setNewProvider] = useState('')
  const [newKey, setNewKey] = useState('')
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [editProvider, setEditProvider] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)

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
    <div className="flex-1 min-h-screen">
      <header className="h-16 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant z-40 sticky top-0">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-6">
              <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-4">Profil utilisateur</h2>
              {me ? (
                <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Nom</span>
                    <span className="font-body-md text-body-md">{me.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Email</span>
                    <span className="font-body-md text-body-md">{me.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Role</span>
                    <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-label-sm">{me.role}</span>
                  </div>
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
              </div>
            </section>
          </div>

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
