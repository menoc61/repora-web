import { useState } from 'react'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAgents, usePatchAgent } from '../hooks/useQueries'

type AgentState = 'ACTIVE' | 'IDLE' | 'DEPLOYING'

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
  Planner: { icon: 'architecture', desc: 'Turns briefs into structured outlines.', tags: ['Local', 'Outline'] },
  Writer: { icon: 'edit_note', desc: 'Drafts prose sections with citations.', tags: ['Local', 'Prose'] },
  Reviewer: { icon: 'fact_check', desc: 'Consistency + quality review pass.', tags: ['BYOK', 'Quality'] },
  UML: { icon: 'schema', desc: 'Generates PlantUML diagrams from requirements.', tags: ['Local', 'Diagrams'] },
  Tables: { icon: 'table_chart', desc: 'Builds requirement matrices and tables.', tags: ['Local', 'Tables'] },
}

function buildAgents(backend: { name: string; provider: string; enabled: boolean; model_id?: string }[]): Agent[] {
  if (backend.length === 0) {
    return Object.entries(AGENT_META).map(([name, m], i) => ({
      name,
      icon: m.icon,
      state: 'IDLE',
      dot: 'bg-outline',
      desc: m.desc,
      tags: m.tags,
      border: i === 0 ? 'border-secondary bg-surface-variant/30' : 'border-outline-variant',
    }))
  }
  return backend.map((a, i) => {
    const meta = AGENT_META[a.name] ?? { icon: 'smart_toy', desc: `${a.name} agent`, tags: [a.provider] }
    return {
      name: a.name,
      icon: meta.icon,
      state: (a.enabled ? 'ACTIVE' : 'IDLE') as AgentState,
      dot: a.enabled ? 'bg-status-final' : 'bg-outline',
      desc: meta.desc,
      tags: a.model_id ? [...meta.tags, a.model_id] : meta.tags,
      border: i === 0 ? 'border-secondary bg-surface-variant/30' : 'border-outline-variant',
    }
  })
}

const CHAT: ChatMessage[] = [
  { from: 'agent', text: 'System initialized. I am ready to process your legal inquiries. How can I assist with your research today?' },
  { from: 'user', text: 'Compare current GDPR requirements with the new proposed Data Act regarding IoT device portability.' },
  { from: 'agent', thinking: true, text: 'Under GDPR Article 20, data portability focuses on "structured, commonly used, and machine-readable" formats...' },
]

export default function AgentWorkshop() {
  const [selected, setSelected] = useState<number>(0)
  const { data: backendAgents = [] } = useAgents()
  const patchAgent = usePatchAgent()
  const AGENTS = buildAgents(backendAgents)

  const handleSelect = (i: number) => setSelected(i)

  return (
    <>
      <div className="h-16 flex items-center justify-between px-margin-desktop bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 border border-outline-variant rounded-full px-3 py-1.5 bg-surface-container-low w-64">
            <Icon name="search" className="text-outline" />
            <Input className="bg-transparent border-none focus-visible:ring-0 text-body-sm w-full p-0" placeholder="Search templates..." />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">History</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">Analytics</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="px-4 py-1.5 border border-outline-variant text-body-sm font-medium rounded-lg hover:bg-surface-variant transition-all">Export</Button>
          <Button variant="ghost" className="px-4 py-1.5 bg-primary text-on-primary text-body-sm font-medium rounded-lg hover:opacity-90 transition-all">Share</Button>
          <Icon name="notifications" className="ml-2" />
          <div className="w-8 h-8 rounded-full border border-outline-variant bg-secondary-container flex items-center justify-center text-white text-[10px] font-bold">AC</div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left: Agent Gallery */}
        <div className="w-[380px] border-r border-outline-variant bg-surface flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-md text-headline-md">Agent Gallery</h2>
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm">8 TOTAL</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-1 px-3 bg-surface-variant/50 text-body-sm rounded border border-outline-variant">All Agents</button>
              <button className="flex-1 py-1 px-3 text-body-sm text-on-surface-variant hover:bg-surface-variant/30 rounded">By Department</button>
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
                    className={`font-label-sm text-label-sm flex items-center gap-1 ${a.state === 'ACTIVE' ? 'text-status-final' : a.state === 'DEPLOYING' ? 'text-status-review' : 'text-on-surface-variant'}`}
                    title="Toggle agent"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot} ${a.state === 'DEPLOYING' ? 'animate-pulse' : ''}`} />
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
                <span>Workshop</span><span>/</span><span className="text-secondary">{AGENTS[selected].name}</span>
              </nav>
              <h2 className="font-headline-lg text-headline-lg mb-2">Agent Configuration</h2>
              <p className="text-body-md text-on-surface-variant">Define the core cognitive parameters and tool access for the {AGENTS[selected].name} template.</p>
            </div>
            <div className="space-y-8">
              <section>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-4">Core Identity</h3>
                <div className="bg-surface p-6 border border-outline-variant rounded-xl space-y-6">
                  <div>
                    <label className="block font-body-md font-semibold mb-2">System Instructions</label>
                    <textarea className="w-full bg-surface-studio border border-outline-variant rounded-lg p-4 font-body-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none" rows={6}>
                      You are a high-fidelity Legal Research assistant for a multinational enterprise. Your primary task is to synthesize case law, identify regulatory risks, and draft summary memos.
                    </textarea>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-4">Intelligence Orchestration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-surface p-6 border border-outline-variant rounded-xl">
                    <label className="block font-body-md font-semibold mb-4">LLM Provider</label>
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
                    <label className="block font-body-md font-semibold mb-4">MCP Skills & Tools</label>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-lg text-body-sm flex items-center gap-2">
                        <Icon name="menu_book" className="text-[16px]" /> Westlaw API <Icon name="close" className="text-[14px] hover:text-error" />
                      </div>
                      <div className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-lg text-body-sm flex items-center gap-2">
                        <Icon name="folder_zip" className="text-[16px]" /> Internal PDF RAG <Icon name="close" className="text-[14px] hover:text-error" />
                      </div>
                      <Button variant="ghost" className="px-3 py-1.5 border border-dashed border-outline-variant rounded-lg text-body-sm text-outline flex items-center gap-2 hover:bg-surface-variant transition-all">
                        <Icon name="add" className="text-[16px]" /> Connect Tool
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
              <h2 className="font-headline-md text-[18px]">Test Sandbox</h2>
            </div>
            <p className="text-[12px] text-on-surface-variant font-body-sm">Simulate behavior before deployment.</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
            {CHAT.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.from === 'user' ? 'bg-surface-container-high border border-outline-variant' : 'bg-secondary'}`}>
                  <Icon name={m.from === 'user' ? 'person' : 'gavel'} className={m.from === 'user' ? 'text-on-surface-variant' : 'text-on-secondary'} fill={m.from === 'agent'} />
                </div>
                <div className={`p-3 rounded-lg text-body-sm ${m.from === 'user' ? 'bg-primary text-on-primary max-w-[80%]' : 'bg-surface-variant/50'}`}>
                  {m.thinking && (
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-label-sm text-secondary animate-pulse">
                      <Icon name="search" className="text-[12px]" /> QUERYING WESTLAW...
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-outline-variant">
            <div className="relative">
              <Input className="w-full bg-surface-studio border border-outline-variant rounded-full py-3 pl-5 pr-12 text-body-sm focus-visible:ring-2 focus-visible:ring-secondary/20 focus-visible:border-secondary outline-none transition-all" placeholder="Type a message..." />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-secondary text-on-secondary rounded-full flex items-center justify-center hover:opacity-90">
                <Icon name="arrow_upward" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <Button variant="ghost" className="flex items-center gap-3 px-8 py-4 bg-secondary text-on-secondary rounded-full shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group">
            <Icon name="rocket_launch" className="group-hover:rotate-12 transition-transform" />
            <span className="font-headline-md text-[18px] font-bold">Deploy to Workspace</span>
          </Button>
        </div>
      </div>
    </>
  )
}
