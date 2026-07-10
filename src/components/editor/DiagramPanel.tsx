import { useState } from 'react'
import { useCreateDiagram, useDiagram } from '../../hooks/useQueries'
import Icon from '../Icon'
import { Button } from '../ui/button'

// ── Diagram card (refreshes rendered url via useDiagram) ──

function DiagramCard({ id, type, initialUrl }: { id: string; type: string; initialUrl: string }) {
  const { data } = useDiagram(id)
  const renderedUrl = data?.rendered_url ?? initialUrl

  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-studio border-b border-outline-variant">
        <span className="font-label-sm text-label-sm uppercase">{type}</span>
        <a
          href={renderedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-ai-vibrant hover:underline font-label-sm"
        >
          Ouvrir
        </a>
      </div>
      {renderedUrl ? (
        <img src={renderedUrl} alt={type} className="w-full p-2" />
      ) : (
        <p className="text-label-sm text-on-surface-variant p-3 italic">Rendu en cours...</p>
      )}
    </div>
  )
}

// ── Diagram panel (owns diagram state/hook/handler) ──

export function DiagramPanel({ projectId, title }: { projectId: string | undefined; title: string }) {
  const createDiagram = useCreateDiagram()
  const [diagramType, setDiagramType] = useState<string>('use_case')
  const [diagrams, setDiagrams] = useState<Array<{ id: string; type: string; rendered_url: string }>>([])
  const [diagramError, setDiagramError] = useState<string | null>(null)

  async function handleGenerateDiagram() {
    if (!projectId) return
    setDiagramError(null)
    try {
      const result = await createDiagram.mutateAsync({
        projectId,
        type: diagramType,
        source: title,
      })
      setDiagrams((prev) => [...prev, { ...result, type: diagramType }])
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
              <option value="use_case">Cas d'utilisation</option>
              <option value="sequence">Sequence</option>
              <option value="activity">Activite</option>
              <option value="class">Classe</option>
              <option value="deployment">Deploiement</option>
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
          {diagrams.length > 0 && (
            <div className="space-y-3">
              {diagrams.map((d) => (
                <DiagramCard key={d.id} id={d.id} type={d.type} initialUrl={d.rendered_url} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
