import Icon from '../Icon'
import { Button } from '../ui/button'
import { SectionRequirement } from './types'

interface FunctionalStepProps {
  reqs: SectionRequirement[]
  onAdd: () => void
  onUpdate: (id: number, field: 'text' | 'sourceActor', value: string) => void
  onRemove: (id: number) => void
  actors: string[]
}

export default function FunctionalStep({ reqs, onAdd, onUpdate, onRemove, actors }: FunctionalStepProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline-lg text-primary-container mb-1">Exigences Fonctionnelles</h2>
          <p className="font-body-md text-secondary">Que doit faire le systeme ? Listez chaque fonctionnalite attendue.</p>
        </div>
        <Button onClick={onAdd} variant="outline" size="sm">
          <Icon name="add" /> Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {reqs.length === 0 && (
          <div className="text-center py-12 text-secondary font-body-md">
            <Icon name="checklist" className="text-4xl mb-3 block mx-auto opacity-30" />
            <p>Aucune exigence fonctionnelle definie.</p>
            <p className="font-body-sm mt-1">Cliquez sur "Ajouter" pour commencer.</p>
          </div>
        )}
        {reqs.map(req => (
          <div key={req.id} className="flex items-start gap-3 p-3 border border-outline-variant rounded-lg bg-surface-studio group hover:border-ai-vibrant/30 transition-colors">
            <span className="font-mono font-label-sm text-secondary mt-2 w-6 shrink-0">F-{reqs.indexOf(req) + 1}</span>
            <div className="flex-1 space-y-2">
              <input
                className="w-full p-2 border border-outline-variant rounded bg-white font-body-md text-primary-container focus:outline-none focus:border-ai-vibrant transition-colors"
                placeholder="Decrivez la fonctionnalite..."
                value={req.text}
                onChange={e => onUpdate(req.id, 'text', e.target.value)}
              />
              <select
                className="p-2 border border-outline-variant rounded bg-white font-body-sm text-secondary focus:outline-none focus:border-ai-vibrant"
                value={req.sourceActor}
                onChange={e => onUpdate(req.id, 'sourceActor', e.target.value)}
              >
                <option value="">Acteur concerne...</option>
                {actors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button
              onClick={() => onRemove(req.id)}
              className="p-2 text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <Icon name="delete" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
