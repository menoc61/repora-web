import Icon from '../Icon'
import { Preset } from './types'

interface ActorsStepProps {
  actors: string[]
  presets: Preset[]
  onToggle: (a: string) => void
  onAddCustom: () => void
}

export default function ActorsStep({ actors, presets, onToggle, onAddCustom }: ActorsStepProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-8">
      <h2 className="font-headline-lg text-primary-container mb-1">Acteurs et Parties Prenantes</h2>
      <p className="font-body-md text-secondary mb-6">Qui utilisera le systeme ? Selectionnez ou ajoutez les acteurs.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        {presets.map(a => (
          <button
            key={a.key}
            onClick={() => onToggle(a.text)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-body-md transition-all ${
              actors.includes(a.text)
                ? 'bg-ai-vibrant/10 border-ai-vibrant text-ai-vibrant'
                : 'border-outline-variant text-secondary hover:border-ai-vibrant/30 bg-surface-studio'
            }`}
          >
            <Icon name="person" />
            {a.text}
            {actors.includes(a.text) && <Icon name="check" className="ml-2" />}
          </button>
        ))}
        <button
          onClick={onAddCustom}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-outline-variant text-secondary hover:border-ai-vibrant bg-surface-studio font-body-md transition-all"
        >
          <Icon name="add" />
          Ajouter un acteur...
        </button>
      </div>

      {actors.length > 0 && (
        <div className="p-4 bg-surface rounded-lg border border-outline-variant">
          <h3 className="font-label-md font-mono text-secondary mb-2">Acteurs selectionnes ({actors.length})</h3>
          <div className="flex flex-wrap gap-2">
            {actors.map(a => (
              <span key={a} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ai-vibrant/5 text-ai-vibrant font-body-sm border border-ai-vibrant/20">
                {a}
                <button onClick={() => onToggle(a)} className="ml-1 hover:text-error"><Icon name="close" className="text-xs" /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
