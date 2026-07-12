import { useState, useEffect } from 'react'
import { useCreateDiagram, useProjectDiagrams } from '../../hooks/useQueries'
import Icon from '../Icon'
import { Button } from '../ui/button'

const DIAGRAM_TYPES = [
  { value: 'use_case', label: 'Cas d\'utilisation' },
  { value: 'sequence', label: 'Séquence' },
  { value: 'activity', label: 'Activité' },
  { value: 'class', label: 'Classe' },
  { value: 'deployment', label: 'Déploiement' },
]

function DiagramCard({ id, type, renderedUrl }: { id: string; type: string; renderedUrl: string }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-studio border-b border-outline-variant">
        <span className="font-label-sm text-label-sm uppercase">{DIAGRAM_TYPES.find(t => t.value === type)?.label || type}</span>
        {renderedUrl && (
          <a
            href={renderedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-ai-vibrant hover:underline font-label-sm"
          >
            Ouvrir
          </a>
        )}
      </div>
      {renderedUrl && !imgError ? (
        <img
          src={renderedUrl}
          alt={type}
          className="w-full p-2"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="p-4 text-center">
          <Icon name="broken_image" className="text-2xl text-outline mx-auto mb-1" />
          <p className="text-label-sm text-on-surface-variant italic">{imgError ? 'Erreur de chargement' : 'Rendu en cours...'}</p>
        </div>
      )}
    </div>
  )
}

export function DiagramPanel({ projectId, title }: { projectId: string | undefined; title: string }) {
  const createDiagram = useCreateDiagram()
  const { data: existingDiagrams = [] } = useProjectDiagrams(projectId)
  const [diagramType, setDiagramType] = useState<string>('use_case')
  const [localDiagrams, setLocalDiagrams] = useState<Array<{ id: string; type: string; rendered_url: string }>>([])
  const [diagramError, setDiagramError] = useState<string | null>(null)

  // Merge existing and locally generated diagrams
  const allDiagrams = [
    ...existingDiagrams.map(d => ({ id: d.id, type: d.type, rendered_url: d.rendered_url })),
    ...localDiagrams.filter(ld => !existingDiagrams.some(ed => ed.id === ld.id)),
  ]

  async function handleGenerateDiagram() {
    if (!projectId) return
    setDiagramError(null)
    try {
      const result = await createDiagram.mutateAsync({
        projectId,
        type: diagramType,
        source: title,
      })
      setLocalDiagrams((prev) => [...prev, { ...result, type: diagramType }])
    } catch {
      setDiagramError('Echec de la generation du diagramme.')
    }
  }

  return (
    <div className="mb-6 border-b border-outline-variant pb-6">
      <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
        <Icon name="account_tree" className="text-ai-vibrant" />
        Diagrammes UML
      </h3>
      {!projectId ? (
        <p className="text-label-sm text-on-surface-variant italic">
          Liez ce document a un projet pour generer des diagrammes.
        </p>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <select
              className="flex-1 p-2 border border-outline-variant rounded bg-white font-body-sm text-secondary focus:outline-none focus:border-ai-vibrant"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
            >
              {DIAGRAM_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Button
              onClick={handleGenerateDiagram}
              disabled={createDiagram.isPending}
              className="bg-ai-vibrant text-white px-3 py-2 rounded font-label-sm hover:opacity-90 transition-all flex items-center gap-1"
            >
              {createDiagram.isPending ? <Icon name="progress_activity" className="animate-spin text-[16px]" /> : <Icon name="auto_awesome" className="text-[16px]" />}
              Generer
            </Button>
          </div>
          {diagramError && (
            <p className="text-label-sm text-error mb-2">{diagramError}</p>
          )}
          {allDiagrams.length > 0 && (
            <div className="space-y-3">
              {allDiagrams.map((d) => (
                <DiagramCard key={d.id} id={d.id} type={d.type} renderedUrl={d.rendered_url} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
