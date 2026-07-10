import Icon from '../Icon'
import { Button } from '../ui/button'
import type { TemplateItem, AgentStatus } from './types'
import { agentDotClass } from './types'

interface TemplateCardProps {
  template: TemplateItem
  onUse: () => void
  isPending: boolean
}

export default function TemplateCard({ template, onUse, isPending }: TemplateCardProps) {
  return (
    <div className="group bg-white border border-outline-variant p-6 flex flex-col h-full hover:border-secondary hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`${template.color} p-2 rounded`}>
          <Icon name={template.icon} />
        </div>
        <span className="font-label-sm text-[10px] bg-surface-variant text-on-surface-variant px-2 py-1 rounded uppercase tracking-tighter">{template.dept}</span>
      </div>
      <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-secondary transition-colors">{template.title}</h3>
      <p className="text-on-surface-variant font-body-sm mb-6 line-clamp-2">
        Cadre standardise avec evaluation des risques clause par clause et adaptations specifiques a chaque juridiction.
      </p>
      <div className="mt-auto pt-4 border-t border-outline-variant/30">
        <p className="font-label-sm text-[11px] text-on-surface-variant uppercase mb-3">Agents actifs</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {template.agents.length > 0 ? (
            template.agents.map(([name, st]) => (
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
          onClick={onUse}
          disabled={isPending}
        >
          {isPending ? 'Creation...' : 'Utiliser le modele'}
        </Button>
      </div>
    </div>
  )
}
