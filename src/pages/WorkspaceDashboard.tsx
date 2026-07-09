import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import TopBar from '../layout/TopBar'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useDocuments, useAnalytics, useCreateProject, useGenerateDocument, useAgents } from '../hooks/useQueries'
import { useWorkspaceStore } from '../stores'

const ACTIVITY = [
  { icon: 'person', bg: 'bg-ai-glow', c: 'text-ai-vibrant', t: <><span className="font-bold">Sarah Jenkins</span> left 4 comments on <span className="text-ai-vibrant font-semibold">Q4 Strategic Financial Audit</span></>, sub: '"Please verify the margin data in table 4..."', time: '12m ago' },
  { icon: 'check_circle', bg: 'bg-status-final/10', c: 'text-status-final', t: <><span className="font-bold">Legal Bot</span> auto-validated 12 clauses in <span className="text-ai-vibrant font-semibold">Client NDA - Acme Corp</span></>, time: '45m ago' },
  { icon: 'edit', bg: 'bg-status-review/10', c: 'text-status-review', t: <><span className="font-bold">Marcus Thorne</span> is currently editing <span className="text-ai-vibrant font-semibold">Project Phoenix Scope</span></>, time: 'Active now' },
]

export default function WorkspaceDashboard() {
  const navigate = useNavigate()
  const { data: documents = [] } = useDocuments()
  const { data: analytics } = useAnalytics()
  const { data: agents = [] } = useAgents()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  const createProject = useCreateProject()
  const generateDoc = useGenerateDocument()
  const [prompt, setPrompt] = useState('')

  async function handleGenerate() {
    if (!prompt.trim()) return
    try {
      // First create a project from the prompt, then dispatch generation.
      const project = await createProject.mutateAsync({ name: prompt.slice(0, 80), brief: prompt })
      const result = await generateDoc.mutateAsync({ projectId: project.id, prompt })
      setActiveView('editor')
      navigate({ to: '/editor', search: { id: result.document_id } })
    } catch {
      /* shown via pending/error states */
    }
  }

  return (
    <>
      <TopBar title="Workspace" tabs={[{ label: 'File', to: '#' }, { label: 'Edit', to: '#' }, { label: 'View', to: '#' }, { label: 'Insert', to: '#' }, { label: 'Tools', to: '#' }]} />
      <div className="p-8 max-w-[1200px] mx-auto">
        <section className="mb-12 relative overflow-hidden rounded-xl bg-primary-container p-8 text-white min-h-[220px] flex flex-col justify-center">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-headline-md text-headline-md font-black mb-2">Generate with AI Orchestrator</h2>
            <p className="font-body-md opacity-80 mb-6">
              Describe your document requirements, and our multi-agent system will draft, verify, and format it for you.
            </p>
            <div className="relative flex items-center">
              <Input
                className="w-full bg-white/10 border border-white/20 rounded-lg py-4 pl-5 pr-32 text-body-md placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-ai-vibrant/50 backdrop-blur-md"
                placeholder="e.g., Draft a master service agreement for a logistics partner..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
              />
              <Button
                onClick={handleGenerate}
                disabled={createProject.isPending || generateDoc.isPending || !prompt.trim()}
                className="absolute right-2 bg-ai-vibrant hover:bg-secondary text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all"
              >
                {createProject.isPending || generateDoc.isPending ? 'Generating…' : 'Generate'}
                <Icon name="bolt" className="text-[18px]" />
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">
              Recent Documents
              {analytics && <span className="text-body-sm text-on-surface-variant font-normal ml-2">({analytics.totalDocuments} total)</span>}
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Icon name="grid_view" /></Button>
              <Button variant="ghost" size="icon"><Icon name="list" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            {documents.map((d) => (
              <Link
                key={d.id}
                to="/editor"
                search={{ id: d.id }}
                onClick={() => setActiveView('editor')}
                className="col-span-12 md:col-span-4"
              >
                <Card className="p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={d.status as 'draft' | 'review' | 'final' | 'active' | 'autonomous'} />
                    <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-headline-md text-[18px] font-bold text-primary mb-2">{d.title}</h4>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-6">{d.content || 'No description'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-300" />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
                      {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}

            <div className="col-span-12 md:col-span-8 bg-white border border-outline-variant rounded-lg p-6">
              <h4 className="font-label-md text-label-md font-bold mb-6 flex items-center gap-2">
                <Icon name="analytics" className="text-ai-vibrant" />
                TEAM COLLABORATION ACTIVITY
              </h4>
              <div className="space-y-6">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full ${a.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon name={a.icon} className={a.c} />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-sm">{a.t}</p>
                      {a.sub && <p className="text-label-sm text-on-surface-variant opacity-60 mt-1 italic">{a.sub}</p>}
                    </div>
                    <span className="text-label-sm text-on-surface-variant opacity-40">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 bg-primary-container text-white rounded-lg p-6 flex flex-col">
              <h4 className="font-label-md text-label-md font-bold mb-4 flex items-center gap-2">
                <Icon name="robot_2" className="text-ai-vibrant" />
                AI AGENT ORCHESTRATOR
              </h4>
              <div className="space-y-4 flex-1">
                {agents.length === 0 && (
                  <p className="text-label-sm opacity-50">No agents configured.</p>
                )}
                {agents.map((a) => (
                  <div key={a.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-label-sm text-label-sm">{a.name}</span>
                      <span className={`text-[10px] ${a.enabled ? 'bg-status-final' : 'bg-white/5'} text-white px-1.5 rounded`}>
                        {a.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full">
                      <div className={`h-full ${a.enabled ? 'bg-status-final' : 'bg-white/10'} rounded-full`} style={{ width: a.enabled ? '100%' : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/agents" onClick={() => setActiveView('agents')}>
                <Button variant="outline" className="mt-6 w-full border-white/20 text-white hover:bg-white/10">
                  Manage Agents
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
