export interface TemplateItem {
  title: string
  dept: string
  icon: string
  color: string
  agents: [string, string][]
}

export type AgentStatus = 'final' | 'review' | 'draft'

export const TEMPLATES: TemplateItem[] = [
  { title: 'Master Service Agreement', dept: 'Juridique', icon: 'gavel', color: 'bg-blue-50 text-secondary', agents: [['Legal Scout', 'final'], ['Risk Auditor', 'review']] },
  { title: 'PRD Technical Blueprint', dept: 'Ingenierie', icon: 'terminal', color: 'bg-emerald-50 text-status-final', agents: [['Tech Writer', 'final'], ['Spec Validator', 'draft']] },
  { title: 'Go-To-Market Strategy', dept: 'Marketing', icon: 'campaign', color: 'bg-amber-50 text-status-review', agents: [['Market Analyst', 'final'], ['Copy Catalyst', 'review']] },
  { title: 'Global Onboarding Guide', dept: 'RH', icon: 'badge', color: 'bg-purple-50 text-purple-600', agents: [['Culture Guide', 'final'], ['Policy Sync', 'final']] },
  { title: 'Quarterly Fiscal Review', dept: 'Finance', icon: 'account_balance', color: 'bg-slate-100 text-on-surface', agents: [['Data Cruncher', 'review'], ['Forecast AI', 'final']] },
]

export const FILTERS: string[] = ['Tous les modeles', 'Juridique', 'Ingenierie', 'Marketing', 'RH', 'Finance']

export function agentDotClass(status: AgentStatus): string {
  if (status === 'final') return 'bg-status-final'
  if (status === 'review') return 'bg-status-review'
  return 'bg-status-draft'
}
