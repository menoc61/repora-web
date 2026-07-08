import React from 'react'
import Icon from '../components/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useSettingsStore } from '@/stores'

interface Provider {
  name: string
  icon: string
  connected: boolean
  endpoint?: string
  model?: string
  load?: number
  gpu?: string
  status?: string
}

interface McpSkill {
  name: string
  icon: string
  type: string
  permission: string
  status: string
  color: string
}

interface ToggleProps {
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PROVIDERS: Provider[] = [
  { name: 'Ollama Local', icon: 'terminal', connected: true, endpoint: 'http://localhost:11434', model: 'Llama 3.1 70B', load: 42, gpu: 'M3 Max' },
  { name: 'Anthropic Cloud', icon: 'cloud', connected: false, status: 'STANDBY' },
]

const MCP_SKILLS: McpSkill[] = [
  { name: 'Jira Ticket Fetcher', icon: 'terminal', type: 'REST API', permission: 'Read-Only', status: 'Live', color: 'text-status-final' },
  { name: 'PostgreSQL Analytics', icon: 'dataset', type: 'SQL Proxy', permission: 'Sandboxed', status: 'Indexing', color: 'text-status-review' },
]

const ORCHESTRATION_NAV: [string, string, boolean?][] = [
  ['hub', 'Providers', true],
  ['memory', 'MCP Skills'],
  ['verified_user', 'AI Compliance'],
]

const INFRASTRUCTURE_NAV: [string, string][] = [
  ['lan', 'Collaboration'],
  ['vpn_key', 'SSO & Auth'],
  ['database', 'Storage'],
]

const MCP_HEADERS = ['SKILL NAME', 'SOURCE TYPE', 'PERMISSION', 'STATUS', 'ACTION']

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-16 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant z-40 sticky top-0">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-black text-primary">Settings</span>
          <div className="hidden md:flex items-center gap-6">
            {['Organization', 'Billing', 'Audit Logs'].map((t) => (
              <a key={t} className={`text-sm font-label-md pb-1 transition-all ${t === 'Organization' ? 'text-primary border-b-2 border-ai-vibrant' : 'text-on-surface-variant hover:text-ai-vibrant'}`} href="#">{t}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="p-2 text-on-surface-variant hover:text-ai-vibrant hover:bg-transparent transition-all"><Icon name="notifications" /></Button>
          <Button className="bg-primary text-on-primary px-4 py-1.5 font-label-md text-label-md rounded hover:opacity-90">Share</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-60 border-r border-outline-variant bg-surface py-gutter px-6 flex flex-col gap-8 custom-scrollbar overflow-y-auto">
          <section>
            <h3 className="font-label-sm text-label-sm text-outline mb-4 uppercase tracking-tighter">AI Orchestration</h3>
            <ul className="space-y-3">
              {ORCHESTRATION_NAV.map(([icon, label, active]) => (
                <li key={label}><a className={`flex items-center gap-2 font-body-sm text-body-sm ${active ? 'text-ai-vibrant font-semibold' : 'text-on-surface-variant hover:text-primary transition-colors'}`} href="#"><Icon name={icon} className="text-[18px]" />{label}</a></li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-label-sm text-label-sm text-outline mb-4 uppercase tracking-tighter">Infrastructure</h3>
            <ul className="space-y-3">
              {INFRASTRUCTURE_NAV.map(([icon, label]) => (
                <li key={label}><a className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#"><Icon name={icon} className="text-[18px]" />{label}</a></li>
              ))}
            </ul>
          </section>
        </nav>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-studio p-8">
          <div className="max-w-[1000px] mx-auto space-y-12">
            <section className="space-y-6" id="providers">
              <div className="flex justify-between items-end border-b border-outline-variant pb-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">AI Provider Settings</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Configure models for sovereign intelligence orchestration.</p>
                </div>
                <Button variant="link" className="font-label-md text-label-md text-ai-vibrant flex items-center gap-1 hover:underline p-0 h-auto"><Icon name="add" className="text-[18px]" />Add Provider</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PROVIDERS.map((p) => (
                  <div key={p.name} className={`bg-white border ${p.connected ? 'border-outline-variant' : 'border-outline-variant opacity-80'} p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${p.connected ? 'bg-ai-glow' : 'bg-surface-container-highest'} rounded`}>
                          <Icon name={p.icon} className={`${p.connected ? 'text-ai-vibrant' : 'text-outline'}`} fill />
                        </div>
                        <div>
                          <p className="font-headline-md text-body-lg font-bold">{p.name}</p>
                          <p className={`font-label-sm text-label-sm ${p.connected ? 'text-status-final' : 'text-status-draft'}`}>{p.connected ? 'CONNECTED' : p.status}</p>
                        </div>
                      </div>
                      <Icon name="more_vert" className="text-outline cursor-pointer" />
                    </div>
                    {p.connected ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-body-sm">
                          <span className="text-on-surface-variant">Endpoint:</span>
                          <code className="bg-surface-container-low px-2 py-0.5 rounded font-label-sm">{p.endpoint}</code>
                        </div>
                        <div className="flex justify-between items-center text-body-sm">
                          <span className="text-on-surface-variant">Active Model:</span>
                          <span className="font-medium">{p.model}</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                          <div className="bg-ai-vibrant h-full w-3/4" />
                        </div>
                        <p className="font-label-sm text-label-sm text-outline">System load: {p.load}% ({p.gpu})</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-body-sm text-on-surface-variant italic">Failover provider enabled for complex reasoning tasks.</p>
                        <Button variant="outline" className="w-full border border-outline-variant py-2 font-label-md text-label-md rounded hover:bg-surface-studio transition-colors">Manage API Keys</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6" id="mcp">
              <div className="flex justify-between items-end border-b border-outline-variant pb-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">Model Context Protocol (MCP)</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">Connect AI agents to enterprise internal tools and data siloes.</p>
                </div>
              </div>
              <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
                <Table className="w-full text-left border-collapse">
                  <TableHeader className="bg-surface-studio border-b border-outline-variant">
                    <TableRow>
                      {MCP_HEADERS.map((h) => (
                        <TableHead key={h} className="px-6 py-4 font-label-md text-label-md text-outline">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-outline-variant">
                    {MCP_SKILLS.map((s) => (
                      <TableRow key={s.name} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Icon name={s.icon} className="text-secondary" fill />
                            <span className="font-body-md text-body-md font-medium">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-label-sm text-label-sm">{s.type}</TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded font-label-sm">{s.permission}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span className="font-label-sm text-label-sm">{s.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="link" className="text-ai-vibrant font-label-md text-label-md p-0 h-auto">Configure</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-surface-container-low text-center">
                  <Button variant="link" className="font-label-md text-label-md text-outline hover:text-primary transition-colors p-0 h-auto">+ Discover more MCP skills in the marketplace</Button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-6" id="auth">
                <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-4">SSO & Identity</h2>
                <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-600">O</div>
                      <span className="font-body-md text-body-md font-bold">Okta Enterprise</span>
                    </label>
                    <Toggle checked={settings.autoSave} onChange={(e) => updateSettings({ autoSave: e.target.checked })} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-label-sm text-label-sm text-outline uppercase">OIDC METADATA URL</p>
                    <Input className="w-full bg-surface-studio border border-outline-variant rounded px-3 py-2 font-label-sm text-on-surface-variant focus:outline-none" readOnly value="https://repora.okta.com/.well-known/openid-configuration" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button className="flex-1 bg-surface-container-high py-2 rounded font-label-md text-label-md hover:bg-surface-container-highest transition-colors">Test Connection</Button>
                    <Button variant="outline" className="flex-1 border border-outline-variant py-2 rounded font-label-md text-label-md hover:bg-surface-studio transition-colors">Download SP XML</Button>
                  </div>
                </div>
              </section>

              <section className="space-y-6" id="collaboration">
                <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-4">Communication Architecture</h2>
                <div className="bg-white border border-outline-variant rounded-lg p-6 space-y-6">
                  <div className="space-y-4">
                    <div
                      onClick={() => updateSettings({ syncMode: 'websocket' })}
                      className={`flex items-center justify-between p-3 rounded border-2 ${settings.syncMode === 'websocket' ? 'border-ai-vibrant bg-ai-glow/20' : 'border-outline-variant hover:border-ai-vibrant transition-colors cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="sync_alt" className="text-ai-vibrant" />
                        <div>
                          <p className="font-body-md text-body-md font-bold">Hybrid WebSocket</p>
                          <p className="font-label-sm text-label-sm text-outline">Centralized synchronization (Recommended)</p>
                        </div>
                      </div>
                      <Icon name="check_circle" className="text-ai-vibrant" fill />
                    </div>
                    <div
                      onClick={() => updateSettings({ syncMode: 'p2p' })}
                      className={`flex items-center justify-between p-3 rounded border ${settings.syncMode === 'p2p' ? 'border-ai-vibrant bg-ai-glow/20' : 'border-outline-variant hover:border-ai-vibrant transition-colors cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="share" className="text-on-surface-variant" />
                        <div>
                          <p className="font-body-md text-body-md font-bold">Decentralized P2P</p>
                          <p className="font-label-sm text-label-sm text-outline">End-to-end encrypted (High Security)</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 border-2 rounded-full ${settings.syncMode === 'p2p' ? 'border-ai-vibrant bg-ai-vibrant' : 'border-outline-variant'}`} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-outline-variant">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-label-md text-label-md text-on-surface-variant">Sync Latency (ms)</span>
                      <span className="font-label-md text-label-md font-bold">12ms</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1 rounded-full">
                      <div className="bg-status-final h-full w-[12%]" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="bg-primary text-on-primary rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="z-10 text-center md:text-left">
                <h3 className="font-headline-md text-headline-md font-black">Ready to deploy changes?</h3>
                <p className="font-body-md text-body-md text-surface-variant opacity-80">Updating infrastructure settings may require a system restart (approx. 45 seconds).</p>
              </div>
              <div className="z-10 flex gap-4 w-full md:w-auto">
                <Button className="bg-white text-primary px-8 py-3 rounded-lg font-label-md text-label-md font-bold shadow-lg hover:bg-surface-studio transition-colors w-full md:w-auto">Commit & Restart</Button>
                <Button variant="outline" className="bg-transparent border border-white/30 text-white px-8 py-3 rounded-lg font-label-md text-label-md hover:bg-white/10 transition-colors w-full md:w-auto">Cancel</Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-inspector-width border-l border-outline-variant bg-surface-studio p-gutter space-y-8 hidden xl:block">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-label-md text-label-md text-outline uppercase tracking-widest">Active Agents</h4>
              <span className="bg-status-final/10 text-status-final text-[10px] px-2 py-0.5 rounded-full font-bold">SYNCED</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-outline-variant shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm font-bold bg-surface-container px-2 py-0.5 rounded">MODERATOR-AI</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-status-final animate-pulse" />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Monitoring MCP skills for data leaks and PII compliance.</p>
              </div>
              <div className="bg-white p-4 rounded border border-outline-variant shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm font-bold bg-surface-container px-2 py-0.5 rounded">OIDC-SYNC</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-status-draft" />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant italic">Idle. Next sync scheduled in 14 minutes.</p>
              </div>
            </div>
          </section>
          <section className="p-6 bg-ai-glow/30 rounded-xl border border-ai-vibrant/20">
            <h5 className="font-label-md text-label-md font-bold text-ai-vibrant mb-2">Sovereign Intelligence Tips</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Running <strong>Ollama Local</strong> on high-end silicon reduces inference latency by up to 300% compared to cloud providers for high-frequency editing tasks.</p>
            <Button variant="link" className="mt-4 font-label-md text-label-md text-ai-vibrant hover:underline p-0 h-auto">Read Benchmarks →</Button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Toggle({ defaultChecked, checked, onChange }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-vibrant" />
    </label>
  )
}
