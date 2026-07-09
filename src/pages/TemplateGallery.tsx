import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useTemplates, useCreateDocumentFromTemplate, useGenerateDocument } from '../hooks/useQueries'
import type { Template } from '../schemas'

interface TemplateCard {
  title: string
  dept: string
  icon: string
  color: string
  agents: [string, string][]
}

type AgentStatus = 'final' | 'review' | 'draft'

const TEMPLATES: TemplateCard[] = [
  { title: 'Master Service Agreement', dept: 'Juridique', icon: 'gavel', color: 'bg-blue-50 text-secondary', agents: [['Legal Scout', 'final'], ['Risk Auditor', 'review']] },
  { title: 'PRD Technical Blueprint', dept: 'Ingenierie', icon: 'terminal', color: 'bg-emerald-50 text-status-final', agents: [['Tech Writer', 'final'], ['Spec Validator', 'draft']] },
  { title: 'Go-To-Market Strategy', dept: 'Marketing', icon: 'campaign', color: 'bg-amber-50 text-status-review', agents: [['Market Analyst', 'final'], ['Copy Catalyst', 'review']] },
  { title: 'Global Onboarding Guide', dept: 'RH', icon: 'badge', color: 'bg-purple-50 text-purple-600', agents: [['Culture Guide', 'final'], ['Policy Sync', 'final']] },
  { title: 'Quarterly Fiscal Review', dept: 'Finance', icon: 'account_balance', color: 'bg-slate-100 text-on-surface', agents: [['Data Cruncher', 'review'], ['Forecast AI', 'final']] },
]

const FILTERS: string[] = ['Tous les modeles', 'Juridique', 'Ingenierie', 'Marketing', 'RH', 'Finance']

function agentDotClass(status: AgentStatus): string {
  if (status === 'final') return 'bg-status-final'
  if (status === 'review') return 'bg-status-review'
  return 'bg-status-draft'
}

export default function TemplateGallery() {
  const [active, setActive] = useState<string>('Tous les modeles')
  const [searchQuery, setSearchQuery] = useState('')
  const { data: apiTemplates = [], isLoading } = useTemplates()
  const createFromTemplate = useCreateDocumentFromTemplate()
  const generateDoc = useGenerateDocument()
  const navigate = useNavigate()

  const cards: TemplateCard[] = apiTemplates.length > 0
    ? apiTemplates.map((t) => ({
        title: t.title,
        dept: t.department,
        icon: t.icon,
        color: 'bg-blue-50 text-secondary',
        // TODO: API does not return agent data; wire to GET /templates/:id/agents when endpoint exists
        agents: [] as [string, string][],
      }))
    : TEMPLATES

  let filtered = active === 'Tous les modeles' ? cards : cards.filter((c) => c.dept === active)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((c) =>
      c.title.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q)
    )
  }

  const handleUseTemplate = async (tpl: TemplateCard) => {
    const t = apiTemplates.find((at) => at.title === tpl.title)
    if (!t) return
    try {
      // Create project + document from template (backend sets template outline)
      const project = await createFromTemplate.mutateAsync({ templateId: t.id, projectName: tpl.title })
      const docId = project.documentId ?? project.id
      // Trigger generation with templateId for template-aware pipeline
      await generateDoc.mutateAsync({
        projectId: project.id,
        prompt: tpl.title,
        templateId: t.id,
      })
      navigate({ to: '/editor', search: { id: docId } })
    } catch {
      // Errors surfaced via mutation states
    }
  }

  return (
    <>
      <div className="h-16 flex items-center justify-between px-gutter bg-surface-studio border-b border-outline-variant">
        <div className="relative w-full max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <Input className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-ai-vibrant outline-none" placeholder="Rechercher modeles, agents ou tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <nav className="hidden md:flex gap-6">
          <Link to="/workspace" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">Espace de travail</Link>
          <Link to="/library" className="font-label-md text-label-md text-primary border-b-2 border-secondary pb-1">Bibliotheque</Link>
          <Link to="/agents" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">Agents</Link>
        </nav>
      </div>

      <div className="p-gutter max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Bibliotheque de modeles</h2>
          <p className="text-on-surface-variant font-body-md max-w-2xl">
            Deployez des environnements souverains preconfigures adaptes aux flux de travail departementaux complexes. Chaque modele inclut la logique d&apos;orchestration et des agents IA specialises par domaine.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all ${
                  active === f ? 'bg-primary text-white' : 'bg-white border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((t) => (
            <div key={t.title} className="group bg-white border border-outline-variant p-6 flex flex-col h-full hover:border-secondary hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`${t.color} p-2 rounded`}>
                  <Icon name={t.icon} />
                </div>
                <span className="font-label-sm text-[10px] bg-surface-variant text-on-surface-variant px-2 py-1 rounded uppercase tracking-tighter">{t.dept}</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-secondary transition-colors">{t.title}</h3>
              <p className="text-on-surface-variant font-body-sm mb-6 line-clamp-2">
                Cadre standardise avec evaluation des risques clause par clause et adaptations specifiques a chaque juridiction.
              </p>
              <div className="mt-auto pt-4 border-t border-outline-variant/30">
                <p className="font-label-sm text-[11px] text-on-surface-variant uppercase mb-3">Agents actifs</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {t.agents.length > 0 ? (
                    t.agents.map(([name, st]) => (
                      <div key={name} className="flex items-center gap-1 bg-surface-studio border border-outline-variant px-2 py-1 rounded">
                        <div className={`w-1.5 h-1.5 rounded-full ${agentDotClass(st as AgentStatus)}`} />
                        <span className="font-label-sm text-label-sm text-on-primary-fixed-variant">{name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="font-label-sm text-label-sm text-on-surface-variant italic">Aucun agent associe</span>
                  )}
                </div>
                <Button
                  className="w-full bg-surface-container-highest text-on-surface font-label-md text-label-md hover:bg-primary-container hover:text-white"
                  onClick={() => handleUseTemplate(t)}
                  disabled={createFromTemplate.isPending || generateDoc.isPending}
                >
                  {createFromTemplate.isPending ? 'Creation...' : 'Utiliser le modele'}
                </Button>
              </div>
            </div>
          ))}

          <Link to="/editor" search={{ id: undefined }} className="group border-2 border-dashed border-outline-variant p-6 flex flex-col items-center justify-center text-center hover:border-secondary hover:bg-white transition-all cursor-pointer bg-surface-studio/50">
            <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center mb-4 group-hover:border-secondary group-hover:text-secondary">
              <Icon name="add" className="text-[32px]" />
            </div>
            <h3 className="font-headline-md text-[20px] mb-1 group-hover:text-secondary">Modele personnalise</h3>
            <p className="text-on-surface-variant font-body-sm">Creez votre propre logique d&apos;orchestration a partir de zero.</p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-primary-container rounded-xl border border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <Icon name="auto_awesome" className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-status-final rounded-full border-2 border-primary-container" />
            </div>
            <div>
              <h4 className="text-white font-label-md text-label-md font-bold mb-1">Orchestrateur global actif</h4>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-status-final animate-pulse" /><span className="font-label-sm text-[10px] text-on-primary-container uppercase">3 agents inactifs</span></div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-status-review animate-bounce" /><span className="font-label-sm text-[10px] text-on-primary-container uppercase">1 agent en synthese</span></div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between mb-2">
              <span className="font-label-sm text-[10px] text-on-primary-container uppercase">Preparation contextuelle</span>
              <span className="font-label-sm text-[10px] text-white">94%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-ai-vibrant" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
