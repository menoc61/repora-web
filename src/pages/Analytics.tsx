import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { useAnalytics } from '../hooks/useQueries'

interface Metric {
  label: string
  icon: string
  value: string
  trend?: string
  trendText?: string
  good?: boolean
  bar?: number
}

interface Agent {
  name: string
  state: string
  dot: string
  icon: string
  prog?: number
}

interface TableRowData {
  name: string
  model: string
  icon: string
  success: string
  thru: string
  eff: string
  tier: string
  tierCls: string
}

const AGENTS: Agent[] = [
  { name: 'LegalArchitect', state: 'Writing...', dot: 'bg-status-final', icon: 'gavel', prog: 75 },
  { name: 'EngSovereign', state: 'Thinking...', dot: 'bg-status-review', icon: 'code', prog: 20 },
  { name: 'FinanceOracle', state: 'Idle', dot: 'bg-status-draft', icon: 'account_balance' },
]

const TABLE: TableRowData[] = [
  { name: 'Legal Policy Reviewer', model: 'Llama-3-70B Optimized', icon: 'balance', success: '99.8%', thru: '452 docs/hr', eff: '0.12 t/doc', tier: 'Platinum', tierCls: 'bg-status-final/10 text-status-final' },
  { name: 'Technical Architect', model: 'GPT-4o Enterprise', icon: 'code_blocks', success: '98.4%', thru: '312 docs/hr', eff: '0.45 t/doc', tier: 'Gold', tierCls: 'bg-status-final/10 text-status-final' },
  { name: 'Financial Forecaster', model: 'Claude 3.5 Sonnet', icon: 'analytics', success: '92.1%', thru: '189 docs/hr', eff: '0.82 t/doc', tier: 'Silver', tierCls: 'bg-status-review/10 text-status-review' },
  { name: 'Global Content Localizer', model: 'Gemini 1.5 Pro', icon: 'translate', success: '97.9%', thru: '1,240 docs/hr', eff: '0.08 t/doc', tier: 'Gold', tierCls: 'bg-status-final/10 text-status-final' },
]

const RANGES = ['24 Hours', '7 Days', '30 Days'] as const

export default function Analytics() {
  const { data: analytics } = useAnalytics()

  const METRICS: Metric[] = [
    { label: 'Token Consumption', icon: 'toll', value: analytics ? `${(analytics.totalDocuments * 4800).toLocaleString()}M` : '1.2M', trend: 'trending_up', trendText: '+12.4% vs last period', good: true },
    { label: 'Avg Gen Time', icon: 'timer', value: analytics ? `${(analytics.efficiencyIndex / 22).toFixed(1)}s` : '4.2s', trend: 'trending_down', trendText: '-0.8s (Improved)', good: true },
    { label: 'Agent Efficiency', icon: 'psychology', value: analytics ? analytics.collaborationScore.toFixed(1) : '94.8', bar: analytics ? analytics.collaborationScore : 94.8 },
    { label: 'Generated Docs', icon: 'description', value: analytics ? analytics.totalDocuments.toLocaleString() : '18,432', trend: 'check_circle', trendText: '99.2% Success rate', good: true },
  ]

  return (
    <>
      <div className="h-16 flex items-center justify-between px-gutter w-full bg-surface-studio border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <Input className="bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-1.5 text-body-sm focus:ring-2 focus:ring-secondary focus:outline-none w-64" placeholder="Search infrastructure..." />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-on-surface-variant hover:text-secondary" href="#">Workspace</a>
            <a className="text-on-surface-variant hover:text-secondary" href="#">Library</a>
            <a className="text-on-surface-variant hover:text-secondary" href="#">Agents</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded font-label-md text-label-md transition-all">Deploy Agent</Button>
          <button className="p-2 text-on-surface-variant hover:text-secondary relative">
            <Icon name="notifications" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-white"><Icon name="account_circle" /></div>
        </div>
      </div>

      <div className="p-gutter max-w-screen-xl mx-auto w-full space-y-gutter">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Intelligence Analytics</h2>
            <p className="text-body-md text-on-surface-variant">Real-time monitoring of AI orchestration performance and token efficiency.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant">
            {RANGES.map((t, i) => (
              <button key={t} className={`px-3 py-1.5 rounded font-label-md text-label-md ${i === 0 ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-surface-container-lowest p-gutter rounded-xl border border-outline-variant flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{m.label}</span>
                <Icon name={m.icon} className="text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <div className="text-display-lg font-bold text-on-surface leading-tight tracking-tighter">{m.value}</div>
                {m.trend && (
                  <div className="flex items-center gap-1 mt-1">
                    <Icon name={m.trend} className={`text-sm ${m.good ? 'text-status-final' : 'text-status-review'}`} />
                    <span className={`font-label-sm text-label-sm ${m.good ? 'text-status-final' : 'text-status-review'}`}>{m.trendText}</span>
                  </div>
                )}
                {m.bar !== undefined && (
                  <div className="w-full bg-surface-variant h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-ai-vibrant h-full" style={{ width: `${m.bar}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter">
            <div className="flex items-center justify-between mb-gutter">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">AI Activity Over Time</h3>
                <p className="text-body-sm text-on-surface-variant">Inference requests vs token depth per hour</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-ai-vibrant" /><span className="text-label-sm font-label-sm text-on-surface-variant">Requests</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-outline-variant" /><span className="text-label-sm font-label-sm text-on-surface-variant">Baseline</span></div>
              </div>
            </div>
            <div className="relative w-full h-[300px] mt-8 chart-gradient rounded">
              <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                <line x1="0" x2="800" y1="50" y2="50" stroke="#e4e2e4" strokeDasharray="4" strokeWidth="1" />
                <line x1="0" x2="800" y1="150" y2="150" stroke="#e4e2e4" strokeDasharray="4" strokeWidth="1" />
                <line x1="0" x2="800" y1="250" y2="250" stroke="#e4e2e4" strokeDasharray="4" strokeWidth="1" />
                <path d="M0,300 L0,220 C50,180 100,100 150,120 C200,140 250,220 300,200 C350,180 400,60 450,40 C500,20 550,120 600,150 C650,180 700,100 750,110 L800,90 L800,300 Z" fill="url(#cg)" opacity="0.6" />
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,220 C50,180 100,100 150,120 C200,140 250,220 300,200 C350,180 400,60 450,40 C500,20 550,120 600,150 C650,180 700,100 750,110 L800,90" fill="none" stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </svg>
              <div className="absolute left-[470px] top-[-10px] bg-inverse-surface text-inverse-on-surface p-3 rounded shadow-xl text-label-sm font-label-sm flex flex-col">
                <span>14:00 PM</span><span className="font-bold">2.4k Requests</span><span className="text-blue-300">Peak Performance</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter overflow-hidden flex flex-col">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-gutter">Live Agents</h3>
            <div className="space-y-4 flex-1">
              {AGENTS.map((a) => (
                <div key={a.name} className="flex items-center justify-between p-3 bg-surface-studio rounded border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                        <Icon name={a.icon} className="text-white text-body-lg" />
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 ${a.dot} border-2 border-white rounded-full`} />
                    </div>
                    <div>
                      <div className="font-label-md text-label-md text-on-surface">{a.name}</div>
                      <div className={`text-label-sm font-label-sm ${a.state === 'Writing...' ? 'text-status-final' : a.state === 'Thinking...' ? 'text-status-review' : 'text-on-surface-variant'}`}>{a.state}</div>
                    </div>
                  </div>
                  {a.prog !== undefined && (
                    <div className="text-right">
                      <div className="w-16 bg-surface-variant h-1 rounded-full mt-1">
                        <div className={`bg-ai-vibrant h-full ${a.state === 'Thinking...' ? 'animate-pulse' : ''}`} style={{ width: `${a.prog}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-gutter w-full py-3 text-label-md font-label-md text-secondary hover:bg-secondary/5 rounded border border-dashed border-secondary transition-colors">Add Custom Agent</Button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-gutter border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">Top Performing Agents</h3>
            <Button variant="ghost" className="flex items-center gap-2 text-label-md font-label-md text-secondary hover:underline">View Detailed Audit Logs <Icon name="open_in_new" className="text-sm" /></Button>
          </div>
          <Table className="w-full text-left border-collapse">
            <TableHeader>
              <TableRow className="bg-surface-studio border-b border-outline-variant">
                {['Agent Identity', 'Success Rate', 'Throughput', 'Token Efficiency', 'Status'].map((h) => (
                  <TableHead key={h} className="px-gutter py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-outline-variant">
              {TABLE.map((r) => (
                <TableRow key={r.name} className="hover:bg-surface-studio transition-colors">
                  <TableCell className="px-gutter py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center text-secondary"><Icon name={r.icon} className="text-body-md" /></div>
                      <div>
                        <div className="font-body-md text-on-surface font-semibold">{r.name}</div>
                        <div className="text-label-sm font-label-sm text-on-surface-variant">{r.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-gutter py-4 text-right font-label-md text-label-md text-status-final">{r.success}</TableCell>
                  <TableCell className="px-gutter py-4 text-right font-label-md text-label-md text-on-surface">{r.thru}</TableCell>
                  <TableCell className="px-gutter py-4 text-right font-label-md text-label-md text-on-surface">{r.eff}</TableCell>
                  <TableCell className="px-gutter py-4 text-center">
                    <span className={`px-2 py-1 ${r.tierCls} text-[10px] font-bold uppercase rounded-full`}>{r.tier}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-primary-container text-on-primary-container p-gutter rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4"><Icon name="verified" className="text-secondary" /><span className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container/80">Sovereign Protocol</span></div>
              <h4 className="font-headline-md text-headline-md mb-2 text-white">Advanced Safety Guardrails</h4>
              <p className="text-body-md text-on-primary-container/90">All generated documents undergo parallel ethical alignment checks and deterministic formatting verification before finalization.</p>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <Button className="bg-white text-primary px-6 py-3 rounded font-label-md text-label-md hover:bg-white/90 transition-colors">Safety Audit</Button>
              <Button variant="outline" className="text-white border border-white/20 px-6 py-3 rounded font-label-md text-label-md hover:bg-white/10 transition-colors">Configuration</Button>
            </div>
          </div>
          <div className="bg-surface-studio border border-outline-variant rounded-xl p-6 flex flex-col justify-center">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Orchestration Center</h4>
            <p className="text-body-sm text-on-surface-variant">Global monitoring node: US-East-1 Cluster</p>
          </div>
        </div>

        <footer className="mt-auto border-t border-outline-variant bg-surface px-gutter py-4 flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-status-final rounded-full animate-pulse" /><span>Systems Operational</span></div>
            <div className="flex items-center gap-2"><Icon name="bolt" className="text-[16px]" /><span>Latency: 24ms</span></div>
          </div>
          <div className="flex items-center gap-4"><span>API v2.4.1</span><span className="opacity-30">|</span><span>© 2024 Repora Intelligence</span></div>
        </footer>
      </div>
    </>
  )
}
