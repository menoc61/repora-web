import Icon from '../Icon'
import { SectionRequirement } from './types'

interface ContextStepProps {
  context: { description: string; objectives: string; scope: string }
  setContext: (c: { description: string; objectives: string; scope: string }) => void
}

export default function ContextStep({ context, setContext }: ContextStepProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-8">
      <h2 className="font-headline-lg text-primary-container mb-2">Contexte du Projet</h2>
      <p className="font-body-md text-secondary mb-6">Decrivez le contexte, les objectifs et le perimetre de votre projet. Ces informations aideront les agents IA a produire un document pertinent.</p>

      <div className="space-y-6">
        <div>
          <label className="block font-label-md font-mono text-primary-container mb-2">Description du projet</label>
          <textarea
            className="w-full min-h-32 p-4 border border-outline-variant rounded bg-surface-studio font-body-md text-primary-container resize-y focus:outline-none focus:border-ai-vibrant transition-colors"
            placeholder="Decrivez votre projet en detail : de quoi s'agit-il, quel probleme resout-il, dans quel contexte s'inscrit-il..."
            value={context.description}
            onChange={e => setContext({ ...context, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-label-md font-mono text-primary-container mb-2">Objectifs principaux</label>
          <textarea
            className="w-full min-h-24 p-4 border border-outline-variant rounded bg-surface-studio font-body-md text-primary-container resize-y focus:outline-none focus:border-ai-vibrant transition-colors"
            placeholder="Quels sont les objectifs mesurables du projet ? Que doit accomplir le produit final ?"
            value={context.objectives}
            onChange={e => setContext({ ...context, objectives: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-label-md font-mono text-primary-container mb-2">Perimetre</label>
          <textarea
            className="w-full min-h-24 p-4 border border-outline-variant rounded bg-surface-studio font-body-md text-primary-container resize-y focus:outline-none focus:border-ai-vibrant transition-colors"
            placeholder="Qu'est-ce qui est INCLUS et EXCLU du perimetre de ce projet ?"
            value={context.scope}
            onChange={e => setContext({ ...context, scope: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
