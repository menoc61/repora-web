import Icon from '../Icon'
import { Button } from '../ui/button'
import { SectionRequirement, Preset } from './types'

interface NonFunctionalStepProps {
  reqs: SectionRequirement[]
  presets: Preset[]
  onTogglePreset: (text: string) => void
  onAdd: () => void
  onUpdate: (id: number, text: string) => void
  onRemove: (id: number) => void
}

export default function NonFunctionalStep({ reqs, presets, onTogglePreset, onAdd, onUpdate, onRemove }: NonFunctionalStepProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-8">
      <h2 className="font-headline-lg text-primary-container mb-1">Exigences Non-Fonctionnelles</h2>
      <p className="font-body-md text-secondary mb-6">Definissez les criteres de qualite : performance, securite, disponibilite, scalabilite, etc.</p>

      <div className="mb-6">
        <h3 className="font-label-md font-mono text-secondary mb-3">Suggestions rapides</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => onTogglePreset(p.text)}
              className={`px-3 py-1.5 rounded-full font-body-sm border transition-all ${
                reqs.some(r => r.text === p.text)
                  ? 'bg-ai-vibrant/10 border-ai-vibrant text-ai-vibrant'
                  : 'border-outline-variant text-secondary hover:border-ai-vibrant/30'
              }`}
            >
              {reqs.some(r => r.text === p.text) ? <Icon name="check" className="text-sm mr-1 inline" /> : <Icon name="add" className="text-sm mr-1 inline" />}
              {p.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md font-mono text-secondary">Exigences personnalisees</h3>
        <Button onClick={onAdd} variant="outline" size="sm"><Icon name="add" /> Ajouter</Button>
      </div>
      <div className="space-y-3">
        {reqs.length === 0 && (
          <p className="text-center py-8 text-secondary font-body-sm">Aucune exigence non-fonctionnelle. Ajoutez-en ou selectionnez des suggestions.</p>
        )}
        {reqs.map(req => (
          <div key={req.id} className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg bg-surface-studio group hover:border-ai-vibrant/30 transition-colors">
            <span className="font-mono font-label-sm text-secondary w-6 shrink-0">NF-{reqs.indexOf(req) + 1}</span>
            <input
              className="flex-1 p-2 border border-outline-variant rounded bg-white font-body-md text-primary-container focus:outline-none focus:border-ai-vibrant transition-colors"
              placeholder="Exigence non-fonctionnelle..."
              value={req.text}
              onChange={e => onUpdate(req.id, e.target.value)}
            />
            <button
              onClick={() => onRemove(req.id)}
              className="p-2 text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <Icon name="delete" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
