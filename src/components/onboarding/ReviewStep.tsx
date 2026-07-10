import Icon from '../Icon'
import { SectionRequirement } from './types'

interface ReviewStepProps {
  context: { description: string; objectives: string; scope: string }
  funcReqs: SectionRequirement[]
  nonFuncReqs: SectionRequirement[]
  actors: string[]
  onEditStep: (s: number) => void
}

export default function ReviewStep({ context, funcReqs, nonFuncReqs, actors, onEditStep }: ReviewStepProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-8">
      <h2 className="font-headline-lg text-primary-container mb-1">Recapitulatif avant generation</h2>
      <p className="font-body-md text-secondary mb-8">Verifiez les informations ci-dessous avant de lancer la generation du cahier des charges.</p>

      <div className="space-y-6">
        <div className="p-4 bg-surface rounded-lg border border-outline-variant">
          <h3 className="font-label-md font-mono text-secondary mb-2 flex items-center gap-2">
            <Icon name="description" /> Contexte
            <button onClick={() => onEditStep(0)} className="text-xs text-ai-vibrant hover:underline ml-auto">Modifier</button>
          </h3>
          <div className="font-body-sm text-primary-container space-y-2">
            {context.description && <p><strong>Description :</strong> {context.description.slice(0, 200)}{context.description.length > 200 ? '...' : ''}</p>}
            {context.objectives && <p><strong>Objectifs :</strong> {context.objectives.slice(0, 200)}{context.objectives.length > 200 ? '...' : ''}</p>}
            {context.scope && <p><strong>Perimetre :</strong> {context.scope.slice(0, 200)}{context.scope.length > 200 ? '...' : ''}</p>}
            {!context.description && !context.objectives && !context.scope && <p className="text-secondary italic">Aucun contexte defini</p>}
          </div>
        </div>

        <div className="p-4 bg-surface rounded-lg border border-outline-variant">
          <h3 className="font-label-md font-mono text-secondary mb-2 flex items-center gap-2">
            <Icon name="checklist" /> Exigences Fonctionnelles ({funcReqs.filter(r => r.text.trim()).length})
            <button onClick={() => onEditStep(1)} className="text-xs text-ai-vibrant hover:underline ml-auto">Modifier</button>
          </h3>
          {funcReqs.filter(r => r.text.trim()).length === 0 ? (
            <p className="text-amber-600 font-body-sm flex items-center gap-1"><Icon name="warning" className="text-sm" /> Aucune exigence fonctionnelle — le document risque d'etre vide</p>
          ) : (
            <ul className="font-body-sm text-primary-container space-y-1 list-disc list-inside">
              {funcReqs.filter(r => r.text.trim()).slice(0, 10).map(r => (
                <li key={r.id}>{r.text}{r.sourceActor ? ` (Acteur: ${r.sourceActor})` : ''}</li>
              ))}
              {funcReqs.filter(r => r.text.trim()).length > 10 && <li className="text-secondary">... et {funcReqs.filter(r => r.text.trim()).length - 10} autres</li>}
            </ul>
          )}
        </div>

        <div className="p-4 bg-surface rounded-lg border border-outline-variant">
          <h3 className="font-label-md font-mono text-secondary mb-2 flex items-center gap-2">
            <Icon name="speed" /> Exigences Non-Fonctionnelles ({nonFuncReqs.filter(r => r.text.trim()).length})
            <button onClick={() => onEditStep(2)} className="text-xs text-ai-vibrant hover:underline ml-auto">Modifier</button>
          </h3>
          {nonFuncReqs.filter(r => r.text.trim()).length === 0 ? (
            <p className="text-secondary font-body-sm italic">Aucune exigence non-fonctionnelle</p>
          ) : (
            <ul className="font-body-sm text-primary-container space-y-1 list-disc list-inside">
              {nonFuncReqs.filter(r => r.text.trim()).slice(0, 8).map(r => <li key={r.id}>{r.text}</li>)}
            </ul>
          )}
        </div>

        <div className="p-4 bg-surface rounded-lg border border-outline-variant">
          <h3 className="font-label-md font-mono text-secondary mb-2 flex items-center gap-2">
            <Icon name="group" /> Acteurs ({actors.length})
            <button onClick={() => onEditStep(3)} className="text-xs text-ai-vibrant hover:underline ml-auto">Modifier</button>
          </h3>
          {actors.length === 0 ? (
            <p className="text-amber-600 font-body-sm flex items-center gap-1"><Icon name="warning" className="text-sm" /> Aucun acteur defini</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {actors.map(a => (
                <span key={a} className="px-3 py-1 rounded-full bg-ai-vibrant/5 text-ai-vibrant font-body-sm border border-ai-vibrant/20">{a}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
