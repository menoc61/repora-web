import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useDocuments, useAnalytics } from '../hooks/useQueries'
import type { Document } from '../schemas'

type ActiveStatus = 'draft' | 'review' | 'final' | 'active' | 'autonomous'

interface ActiveDoc {
  title: string
  icon: string
  avatars: string[]
  note: string
  status: ActiveStatus
  meta: string
  time: string
}

interface FeedItem {
  icon: string
  bg: string
  t: React.ReactNode
  sub?: string
  time: string
}

interface TemplateItem {
  title: string
  icon: string
  dept: string
  count: string
}

const ACTIVE: ActiveDoc[] = [
  { title: '2024 Legal Framework - Section IV', icon: 'description', avatars: ['JD', 'AM', 'SK'], note: '+2 AI Agents drafting', status: 'review', meta: 'Under Review', time: '4m ago' },
  { title: 'Infrastructure Scaling Protocol v2', icon: 'terminal', avatars: ['RE', 'TL'], note: 'Synchronizing changes...', status: 'active', meta: 'Active Edit', time: '12m ago' },
  { title: 'AI Orchestration Governance Policy', icon: 'auto_awesome', avatars: ['AI'], note: 'Repora Agent optimizing blocks', status: 'autonomous', meta: 'Autonomous', time: 'Active now' },
]

const FEED: FeedItem[] = [
  { icon: 'comment', bg: 'bg-secondary text-white', t: <><span className="font-bold">Sarah K.</span> left a comment on <a className="text-secondary hover:underline" href="#">Quarterly Security Audit</a></>, sub: '"The sovereign encryption protocols in Section 2.1 need a final validation from the DevSecOps agent."', time: '24 minutes ago' },
  { icon: 'check_circle', bg: 'bg-status-final text-white', t: <><span className="font-bold">Repora AI</span> completed an automated review of <a className="text-secondary hover:underline" href="#">Compliance Standards 2024</a></>, time: '1 hour ago • 0 conflicts found' },
  { icon: 'edit_document', bg: 'bg-ai-vibrant text-white', t: <><span className="font-bold">Marcus Chen</span> and 3 others pushed 12 edits to <a className="text-secondary hover:underline" href="#">Product Roadmap</a></>, time: '2 hours ago' },
]

const TEMPLATES: TemplateItem[] = [
  { title: 'IP Assignment Master', icon: 'balance', dept: 'Legal', count: 'Used by 42 teams' },
  { title: 'System Architecture V2', icon: 'architecture', dept: 'Eng', count: 'Used by 18 teams' },
  { title: 'SOC2 Compliance Log', icon: 'verified_user', dept: 'Security', count: 'Used by 12 teams' },
]

const ICON_BY_DEPT: Record<string, string> = {
  Legal: 'document',
  Engineering: 'terminal',
  Security: 'auto_awesome',
}

const getInitials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

const noteFor = (status: ActiveStatus): string => {
  switch (status) {
    case 'autonomous': return 'Repora Agent optimizing blocks'
    case 'active': return 'Synchronizing changes...'
    case 'review': return '+2 AI Agents drafting'
    case 'final': return 'Finalized and locked'
    case 'draft': return 'Initial draft in progress'
    default: return ''
  }
}

const metaFor = (status: ActiveStatus): string => {
  switch (status) {
    case 'review': return 'Under Review'
    case 'active': return 'Active Edit'
    case 'autonomous': return 'Autonomous'
    case 'final': return 'Final'
    case 'draft': return 'Draft'
    default: return ''
  }
}

const timeFor = (iso?: string): string => {
  if (!iso) return 'Active now'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Active now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const toActiveDoc = (doc: Document): ActiveDoc => {
  const status = doc.status as ActiveStatus
  return {
    title: doc.title,
    icon: ICON_BY_DEPT[doc.department] ?? 'description',
    avatars: doc.collaborators.length
      ? doc.collaborators.map((c) => getInitials(c.name))
      : [getInitials(doc.author.name)],
    note: noteFor(status),
    status,
    meta: metaFor(status),
    time: timeFor(doc.updatedAt),
  }
}

export default function CollaborationHub() {
  const [search, setSearch] = useState('')
  const { data: documents = [] } = useDocuments()
  const { data: analytics } = useAnalytics()

  const activeDocs: ActiveDoc[] = documents.length ? documents.map(toActiveDoc) : ACTIVE

  const efficiencyIndex = analytics?.efficiencyIndex ?? 94.2
  const aiUtilization = analytics?.aiUtilization ?? 68
  const topContributor = analytics?.topContributor ?? 'Autonomous Orchestrator'

  const handleDeployAgent = () => {}
  const handleBrowseTemplates = () => {}
  const handleExploreGraph = () => {}
  const handleLoadOlder = () => {}

  return (
    <>
      <div className="h-16 flex items-center justify-between px-gutter bg-surface-studio border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center bg-surface-container-high rounded-full px-4 py-1.5 w-80">
            <Icon name="search" className="text-outline mr-2" />
            <Input
              className="bg-transparent border-none focus-visible:ring-0 text-body-sm p-0 h-auto w-full"
              placeholder="Search workspace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <nav className="hidden md:flex gap-6">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary" href="#">Workspace</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-secondary" href="#">Library</a>
            <a className="font-label-md text-label-md text-primary border-b-2 border-secondary pb-1" href="#">Agents</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"><Icon name="notifications" /></button>
          <button className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"><Icon name="account_circle" /></button>
          <Button
            onClick={handleDeployAgent}
            className="rounded-full bg-primary text-on-primary font-label-md text-label-md px-6 py-2 hover:opacity-80 transition-opacity"
          >
            Deploy Agent
          </Button>
        </div>
      </div>

      <div className="p-gutter max-w-[1400px] mx-auto min-h-screen space-y-gutter">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="md:col-span-3 bg-surface border border-outline-variant rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-headline-lg text-headline-lg mb-2">Team Collaboration Pulse</h2>
                <p className="text-on-surface-variant font-body-md max-w-lg">Sovereign intelligence is coordinating 14 parallel streams. Collaboration density is up 22% this week across Engineering and Legal departments.</p>
              </div>
              <div className="hidden lg:block text-right">
                <div className="font-label-sm text-label-sm text-secondary mb-1 uppercase">Active Agents</div>
                <div className="flex gap-1 justify-end">
                  {[6, 8, 5, 10, 7].map((h, i) => (
                    <div key={i} className={`w-1.5 ${h === 10 ? 'h-10 animate-pulse' : `h-${h}`} bg-secondary-container rounded-full`} style={{ height: `${h * 4}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Workspace Uptime</div>
            <div className="font-display-lg text-headline-lg text-status-final">99.98%</div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="collab-wave w-full h-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          <section className="col-span-12 lg:col-span-8 space-y-gutter">
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                <div className="flex items-center gap-2"><Icon name="flash_on" className="text-secondary" /><h3 className="font-headline-md text-headline-md">Active Now</h3></div>
                <div className="text-label-sm text-on-surface-variant">8 DOCUMENTS CURRENTLY EDITED</div>
              </div>
              <div className="divide-y divide-outline-variant">
                {activeDocs.map((d) => (
                  <Link key={d.title} to="/editor" className="p-6 hover:bg-surface-studio transition-colors group cursor-pointer flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded bg-surface-container-high flex items-center justify-center text-secondary"><Icon name={d.icon} className="text-[28px]" /></div>
                      <div>
                        <h4 className="font-bold text-body-lg group-hover:text-secondary transition-colors">{d.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex -space-x-2">
                            {d.avatars.map((a, i) => (
                              <div key={i} className="w-6 h-6 rounded-full ring-2 ring-surface bg-blue-100 flex items-center justify-center text-[10px] font-bold">{a}</div>
                            ))}
                          </div>
                          <span className="text-label-sm text-on-surface-variant">{d.note}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={d.status}>{d.meta}</StatusBadge>
                      <div className="font-label-sm text-[10px] text-outline">Modified {d.time}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center gap-2"><Icon name="history" className="text-secondary" /><h3 className="font-headline-md text-headline-md">Global Activity Feed</h3></div>
              <div className="p-6 space-y-6">
                {FEED.map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full ${f.bg} flex-shrink-0 flex items-center justify-center`}><Icon name={f.icon} className="text-[16px]" /></div>
                    <div className="space-y-1">
                      <p className="font-body-md">{f.t}</p>
                      {f.sub && <div className="bg-surface-container-low p-3 rounded-lg border-l-4 border-secondary text-body-sm italic">{f.sub}</div>}
                      <p className="text-label-sm text-on-surface-variant">{f.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={handleLoadOlder}
                className="w-full py-4 bg-surface-container-low text-label-md font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors border-t border-outline-variant rounded-none"
              >
                LOAD OLDER ACTIVITY
              </Button>
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 space-y-gutter">
            <div className="bg-surface border border-outline-variant rounded-xl p-6">
              <div className="flex justify-between items-center mb-6"><h3 className="font-headline-md text-headline-md">Trending Templates</h3><Icon name="trending_up" className="text-outline" /></div>
              <div className="space-y-4">
                {TEMPLATES.map((t) => (
                  <Link key={t.title} to="/templates" className="p-4 rounded-xl border border-outline-variant hover:border-secondary transition-colors group cursor-pointer flex gap-3 items-center bg-surface-studio">
                    <div className="w-10 h-10 rounded bg-white border border-outline-variant flex items-center justify-center text-secondary"><Icon name={t.icon} /></div>
                    <div><div className="font-bold text-body-md">{t.title}</div><div className="text-label-sm text-on-surface-variant">{t.dept} • {t.count}</div></div>
                  </Link>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={handleBrowseTemplates}
                className="w-full mt-6 py-2 text-secondary font-label-md text-label-md hover:underline"
              >
                Browse all templates →
              </Button>
            </div>

            <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <h3 className="font-headline-md text-headline-md mb-4 relative z-10">Team Insights</h3>
              <div className="space-y-6 relative z-10">
                <div><div className="flex justify-between text-label-sm mb-2 opacity-80 uppercase">Efficiency Index</div><div className="text-2xl font-bold">{efficiencyIndex}</div>
                  <div className="flex items-center gap-2 mt-1 text-status-final"><Icon name="arrow_upward" className="text-[16px]" /><span className="text-xs">8% vs last month</span></div></div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-label-sm mb-2 opacity-80 uppercase">AI Utilization</div>
                  <div className="flex items-center gap-4"><div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="bg-secondary-container h-full" style={{ width: `${aiUtilization}%` }} /></div><span className="font-bold">{aiUtilization}%</span></div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-label-sm mb-2 opacity-80 uppercase">Top Contributor</div>
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-secondary-fixed-dim text-secondary text-[10px] flex items-center justify-center font-black">AI</div><div className="font-bold">{topContributor}</div></div>
                </div>
              </div>
            </div>

            <div className="bg-surface-studio border border-outline-variant border-dashed rounded-xl p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-ai-glow flex items-center justify-center mb-4"><Icon name="hub" className="text-secondary text-[32px]" /></div>
              <h4 className="font-bold mb-2">Knowledge Graph</h4>
              <p className="text-body-sm text-on-surface-variant mb-4">Visualize how your team's documents are interconnected through sovereign intelligence.</p>
              <Button
                variant="outline"
                onClick={handleExploreGraph}
                className="bg-surface border border-outline-variant font-label-md text-label-md px-6 py-2 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Explore Graph
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
