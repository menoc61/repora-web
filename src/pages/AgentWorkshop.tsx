import { useState, useRef } from 'react'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAgents, usePatchAgent, useTestAgent, useExportAgentConfig, useConnectTool, useEnableAgent } from '../hooks/useQueries'

type AgentState = 'ACTIF' | 'INACTIF' | 'DEPLOIEMENT'

interface Agent {
  name: string
  icon: string
  state: AgentState
  dot: string
  desc: string
  tags: string[]
  border: string
}

interface ChatMessage {
  from: 'agent' | 'user'
  text: string
  thinking?: boolean
}

const AGENT_META: Record<string, { icon: string; desc: string; tags: string[] }> = {
  Planner: { icon: 'architecture', desc: 'Transforme les briefs en plans structures.', tags: ['Local', 'Plan'] },
  Writer: { icon: 'edit_note', desc: 'Redige les sections en prose avec citations.', tags: ['Local', 'Prose'] },
  Reviewer: { icon: 'fact_check', desc: 'Verification de coherence et qualite.', tags: ['BYOK', 'Qualite'] },
  UML: { icon: 'schema', desc: 'Genere des diagrammes PlantUML a partir des exigences.', tags: ['Local', 'Diagrammes'] },
  Tables: { icon: 'table_chart', desc: 'Construit des matrices d\'exigences et des tableaux.', tags: ['Local', 'Tableaux'] },
}

function buildAgents(backend: { name: string; provider: string; enabled: boolean; model_id?: string }[]): Agent[] {
  if (backend.length === 0) {
    return Object.entries(AGENT_META).map(([name, m], i) => ({
      name,
      icon: m.icon,
      state: 'INACTIF',
      dot: 'bg-outline',
      desc: m.desc,
      tags: m.tags,
      border: i === 0 ? 'border-secondary bg-surface-variant/30' : 'border-outline-variant',
    }))
  }
  return backend.map((a, i) => {
    const meta = AGENT_META[a.name] ?? { icon: 'smart_toy', desc: `Agent ${a.name}`, tags: [a.provider] }
    return {
      name: a.name,
      icon: meta.icon,
      state: (a.enabled ? 'ACTIF' : 'INACTIF') as AgentState,
      dot: a.enabled ? 'bg-status-final' : 'bg-outline',
      desc: meta.desc,
      tags: a.model_id ? [...meta.tags, a.model_id] : meta.tags,
      border: i === 0 ? 'border-secondary bg-surface-variant/30' : 'border-outline-variant',
    }
  })
}

const CHAT: ChatMessage[] = [
  { from: 'agent', text: 'Systeme initialise. Je suis pret a traiter vos demandes juridiques. Comment puis-je vous aider dans vos recherches aujourd\'hui ?' },
  { from: 'user', text: 'Comparer les exigences actuelles du RGPD avec le nouveau reglement sur les donnees concernant la portabilite des appareils IoT.' },
  { from: 'agent', thinking: true, text: 'Selon l\'Article 20 du RGPD, la portabilite des donnees se concentre sur les formats "structures, couramment utilises et lisibles par machine"...' },
]

export default function AgentWorkshop() {
  const [selected, setSelected] = useState<number>(0)
  const [testInput, setTestInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(CHAT)
  const [showToolModal, setShowToolModal] = useState(false)
  const [toolName, setToolName] = useState('')
  const { data: backendAgents = [] } = useAgents()
  const patchAgent = usePatchAgent()
  const testAgent = useTestAgent()
  const exportConfig = useExportAgentConfig()
  const connectTool = useConnectTool()
  const enableAgent = useEnableAgent()
  const AGENTS = buildAgents(backendAgents)

  const handleSelect = (i: number) => setSelected(i)

  const handleExport = () => {
    const agent = AGENTS[selected]
    if (agent) exportConfig.mutate(agent.name, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${agent.name}-config.json`; a.click()
        URL.revokeObjectURL(url)
      },
    })
  }

  const handleShare = () => {
    const agent = AGENTS[selected]
    const config = { agentName: agent.name, agents: backendAgents }
    const shareUrl = `${window.location.origin}/agents?share=${encodeURIComponent(JSON.stringify(config))}`
    navigator.clipboard?.writeText(shareUrl)
  }

  const handleConnectTool = () => {
    if (!toolName.trim()) return
    const agent = AGENTS[selected]
    if (agent) {
      connectTool.mutate({ agentName: agent.name, toolName: toolName.trim(), config: {} }, {
        onSuccess: () => { setShowToolModal(false); setToolName('') },
      })
    }
  }

  const handleDeploy = () => {
    const agent = AGENTS[selected]
    if (agent) enableAgent.mutate(agent.name)
  }

  const handleTestSend = () => {
    if (!testInput.trim()) return
    const message = testInput.trim()
    setTestInput('')
    setChatMessages((prev) => [...prev, { from: 'user', text: message }])
    const agent = AGENTS[selected]
    if (agent) {
      testAgent.mutate({ name: agent.name, message }, {
        onSuccess: (data) => {
          setChatMessages((prev) => [...prev, { from: 'agent', text: (data as any)?.reply ?? 'Reponse recue.' }])
        },
        onError: () => {
          setChatMessages((prev) => [...prev, { from: 'agent', text: 'Erreur lors du test. Verifiez que l\'agent est actif.' }])
        },
      })
    }
  }

  return (
    <>
      <div className="h-16 flex items-center justify-between px-margin-desktop bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 border border-outline-variant rounded-full px-3 py-1.5 bg-surface-container-low w-64">
            <Icon name="search" className="text-outline" />
            <Input className="bg-transparent border-none focus-visible:ring-0 text-body-sm w-full p-0" placeholder="Rechercher des modeles..." />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">Historique</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">Analyses</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="px-4 py-1.5 border border-outline-variant text-body-sm font-medium rounded-lg hover:bg-surface-variant transition-all" onClick={handleExport} disabled={exportConfig.isPending}>{exportConfig.isPending ? 'Export...' : 'Exporter'}</Button>
          <Button variant="ghost" className="px-4 py-1.5 bg-primary text-on-primary text-body-sm font-medium rounded-lg hover:opacity-90 transition-all" onClick={handleShare}>Partager</Button>
          <Icon name="notifications" className="ml-2" />
          <div className="w-8 h-8 rounded-full border border-outline-variant bg-secondary-container flex items-center justify-center text-white text-[10px] font-bold">AC</div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left: Agent Gallery */}
        <div className="w-[380px] border-r border-outline-variant bg-surface flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md">Galerie d&apos;agents</h2>
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm">8 TOTAL</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-1 px-3 bg-surface-variant/50 text-body-sm rounded border border-outline-variant">Tous les agents</button>
              <button className="flex-1 py-1 px-3 text-body-sm text-on-surface-variant hover:bg-surface-variant/30 rounded">Par departement</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {AGENTS.map((a, i) => (
              <div
                key={a.name}
                onClick={() => handleSelect(i)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === i ? 'border-secondary bg-surface-variant/30' : 'border-outline-variant bg-surface-studio hover:border-outline'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Icon name={a.icon} className="text-secondary" fill={selected === i} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const backend = backendAgents[i]
                      if (backend) patchAgent.mutate({ name: backend.name, patch: { enabled: !backend.enabled } })
                    }}
                    className={`font-label-sm text-label-sm flex items-center gap-1 ${a.state === 'ACTIF' ? 'text-status-final' : a.state === 'DEPLOIEMENT' ? 'text-status-review' : 'text-on-surface-variant'}`}
                    title="Basculer l'agent"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot} ${a.state === 'DEPLOIEMENT' ? 'animate-pulse' : ''}`} />
                    {a.state}
                  </button>
                </div>
                <h3 className="font-headline-md text-[18px] mb-1">{a.name}</h3>
                <p className="text-body-sm text-on-surface-variant line-clamp-2">{a.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-label-sm uppercase tracking-wider">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Configuration */}
        <div className="flex-1 overflow-y-auto bg-surface-studio hide-scrollbar">
          <div className="max-w-[800px] mx-auto py-10 px-8">
            <div className="mb-8">
              <nav className="flex gap-2 text-label-sm font-label-sm text-on-surface-variant mb-4 uppercase tracking-widest">
                <span>Atelier</span><span>/</span><span className="text-secondary">{AGENTS[selected].name}</span>
              </nav>
              <h2 className="font-headline-lg text-headline-lg mb-2">Configuration de l&apos;agent</h2>
              <p className="text-body-md text-on-surface-variant">Definissez les parametres cognitifs fondamentaux et l&apos;acces aux outils pour le modele {AGENTS[selected].name}.</p>
            </div>
            <div className="space-y-8">
              <section>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-4">Identite fondamentale</h3>
                <div className="bg-surface p-6 border border-outline-variant rounded-xl space-y-6">
                  <div>
                    <label className="block font-body-md font-semibold mb-2">Instructions systeme</label>
                    <textarea className="w-full bg-surface-studio border border-outline-variant rounded-lg p-4 font-body-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none" rows={6}>
                      Vous etes un assistant de recherche juridique haute fidelite pour une entreprise multinationale. Votre tache principale est de synthetiser la jurisprudence, d&apos;identifier les risques reglementaires et de rediger des memos de synthese.
                    </textarea>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-4">Orchestration de l&apos;intelligence</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-surface p-6 border border-outline-variant rounded-xl">
                    <label className="block font-body-md font-semibold mb-4">Fournisseur LLM</label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border-2 border-secondary bg-secondary/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon name="cloud" className="text-secondary" />
                          <div><p className="font-body-sm font-semibold">Anthropic Cloud</p><p className="text-[10px] text-on-surface-variant">Claude 3.5 Sonnet</p></div>
                        </div>
                        <Icon name="check_circle" className="text-secondary" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-outline cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <Icon name="dns" className="text-outline" />
                          <div><p className="font-body-sm font-semibold">Ollama Local</p><p className="text-[10px] text-on-surface-variant">Llama-3-70B-Instruct</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface p-6 border border-outline-variant rounded-xl">
                    <label className="block font-body-md font-semibold mb-4">Competences et outils MCP</label>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-lg text-body-sm flex items-center gap-2">
                        <Icon name="menu_book" className="text-[16px]" /> API Westlaw <Icon name="close" className="text-[14px] hover:text-error" />
                      </div>
                      <div className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-lg text-body-sm flex items-center gap-2">
                        <Icon name="folder_zip" className="text-[16px]" /> RAG PDF interne <Icon name="close" className="text-[14px] hover:text-error" />
                      </div>
                      <Button variant="ghost" className="px-3 py-1.5 border border-dashed border-outline-variant rounded-lg text-body-sm text-outline flex items-center gap-2 hover:bg-surface-variant transition-all" onClick={() => setShowToolModal(true)}>
                        <Icon name="add" className="text-[16px]" /> Connecter un outil
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Right: Test Sandbox */}
        <div className="w-inspector-width border-l border-outline-variant bg-surface flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-status-final animate-pulse" />
              <h2 className="font-headline-md text-[18px]">Bac a sable de test</h2>
            </div>
            <p className="text-[12px] text-on-surface-variant font-body-sm">Simuler le comportement avant le deploiement.</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.from === 'user' ? 'bg-surface-container-high border border-outline-variant' : 'bg-secondary'}`}>
                  <Icon name={m.from === 'user' ? 'person' : 'gavel'} className={m.from === 'user' ? 'text-on-surface-variant' : 'text-on-secondary'} fill={m.from === 'agent'} />
                </div>
                <div className={`p-3 rounded-lg text-body-sm ${m.from === 'user' ? 'bg-primary text-on-primary max-w-[80%]' : 'bg-surface-variant/50'}`}>
                  {m.thinking && (
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-label-sm text-secondary animate-pulse">
                      <Icon name="search" className="text-[12px]" /> RECHERCHE WESTLAW...
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-outline-variant">
            <div className="relative">
              <Input
                className="w-full bg-surface-studio border border-outline-variant rounded-full py-3 pl-5 pr-12 text-body-sm focus-visible:ring-2 focus-visible:ring-secondary/20 focus-visible:border-secondary outline-none transition-all"
                placeholder="Saisir un message..."
                value={testInput}
                onChange={(e) => setTestInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestSend() }}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-secondary text-on-secondary rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                onClick={handleTestSend}
                disabled={testAgent.isPending || !testInput.trim()}
              >
                <Icon name={testAgent.isPending ? 'hourglass_top' : 'arrow_upward'} className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <Button variant="ghost" className="flex items-center gap-3 px-8 py-4 bg-secondary text-on-secondary rounded-full shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group" onClick={handleDeploy} disabled={enableAgent.isPending}>
            <Icon name="rocket_launch" className="group-hover:rotate-12 transition-transform" />
            <span className="font-headline-md text-[18px] font-bold">{enableAgent.isPending ? 'Deploiement...' : 'Deployer vers l\'espace de travail'}</span>
          </Button>
        </div>
        {showToolModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => { setShowToolModal(false); setToolName('') }}>
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-headline-md text-headline-md mb-4">Connecter un outil</h3>
              <Input
                className="w-full bg-surface-studio border border-outline-variant rounded-lg px-4 py-2 font-body-sm mb-4"
                placeholder="Nom de l'outil (ex: API Westlaw)..."
                value={toolName}
                onChange={(e) => setToolName((e.target as HTMLInputElement).value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="px-4 py-2" onClick={() => { setShowToolModal(false); setToolName('') }}>Annuler</Button>
                <Button className="px-4 py-2 bg-secondary text-white" onClick={handleConnectTool} disabled={connectTool.isPending || !toolName.trim()}>
                  {connectTool.isPending ? 'Connexion...' : 'Connecter'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
