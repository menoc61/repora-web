export interface TemplateItem {
  title: string
  dept: string
  icon: string
  color: string
  agents: [string, string][]
}

export type AgentStatus = 'final' | 'review' | 'draft'

export const TEMPLATES: TemplateItem[] = [
  { title: 'Master Service Agreement', dept: 'Juridique', icon: 'gavel', color: 'bg-secondary-container text-secondary', agents: [['Legal Scout', 'final'], ['Risk Auditor', 'review']] },
  { title: 'PRD Technical Blueprint', dept: 'Ingenierie', icon: 'terminal', color: 'bg-status-final/10 text-status-final', agents: [['Tech Writer', 'final'], ['Spec Validator', 'draft']] },
  { title: 'Go-To-Market Strategy', dept: 'Marketing', icon: 'campaign', color: 'bg-status-review/10 text-status-review', agents: [['Market Analyst', 'final'], ['Copy Catalyst', 'review']] },
  { title: 'Global Onboarding Guide', dept: 'RH', icon: 'badge', color: 'bg-tertiary-fixed text-on-tertiary-fixed', agents: [['Culture Guide', 'final'], ['Policy Sync', 'final']] },
  { title: 'Quarterly Fiscal Review', dept: 'Finance', icon: 'account_balance', color: 'bg-surface-container-low text-on-surface', agents: [['Data Cruncher', 'review'], ['Forecast AI', 'final']] },
]

export const FILTERS: string[] = ['Tous les modeles', 'Juridique', 'Ingenierie', 'Marketing', 'RH', 'Finance']

export function agentDotClass(status: AgentStatus): string {
  if (status === 'final') return 'bg-status-final'
  if (status === 'review') return 'bg-status-review'
  return 'bg-status-draft'
}
