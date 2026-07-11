import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { useValidateDocument, useSubmitValidation } from '../hooks/useQueries'
import { api } from '../api/client'
import ReactMarkdown from 'react-markdown'

interface BackendSection {
  id: string
  title: string
  content: string
  status: string
}

interface DiagramPreview {
  id: string
  type: string
  renderedUrl: string
}

interface ValidateDocumentResponse {
  document: {
    id: string
    title: string
    status: string
    sections: BackendSection[]
  }
  validation: {
    decision: string | null
    decidedAt: string | null
  }
}

export default function ValidatePortal() {
  const { token } = useParams({ from: '/validate/$token' as any })
  const { data, isLoading, error } = useValidateDocument(token) as {
    data: ValidateDocumentResponse | undefined
    isLoading: boolean
    error: Error | null
  }
  const submit = useSubmitValidation()

  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [diagrams, setDiagrams] = useState<DiagramPreview[]>([])
  const [diagramsLoading, setDiagramsLoading] = useState(true)

  // Fetch diagrams for this validation
  useEffect(() => {
    if (!token) return
    api.get<DiagramPreview[]>(`/validate/${token}/diagrams`, { public: true })
      .then(d => setDiagrams(d || []))
      .catch(() => {})
      .finally(() => setDiagramsLoading(false))
  }, [token])

  const document = data?.document
  const validation = data?.validation
  const alreadyDecided = validation?.decision != null

  function handleDecision(sectionId: string, decision: 'approved' | 'rejected') {
    setDecisions((prev) => ({ ...prev, [sectionId]: decision }))
    if (decision === 'approved') {
      setReasons((prev) => {
        const next = { ...prev }
        delete next[sectionId]
        return next
      })
    }
  }

  function handleReason(sectionId: string, reason: string) {
    setReasons((prev) => ({ ...prev, [sectionId]: reason }))
  }

  function allSectionsDecided(): boolean {
    if (!document?.sections?.length) return false
    return document.sections.every((s) => decisions[s.id] != null)
  }

  function missingReasons(): string[] {
    if (!document?.sections) return []
    return document.sections
      .filter((s) => decisions[s.id] === 'rejected' && !(reasons[s.id]?.trim()))
      .map((s) => s.id)
  }

  function handleSubmit() {
    if (!token) return
    const missing = missingReasons()
    if (missing.length > 0) {
      setSubmitError('Veuillez fournir une raison pour chaque section rejetee.')
      return
    }
    setSubmitError(null)

    const sectionReasons: Record<string, string> = {}
    for (const [sectionId, decision] of Object.entries(decisions)) {
      if (decision === 'rejected') {
        sectionReasons[sectionId] = reasons[sectionId] || ''
      }
    }
    const overall = Object.values(decisions).some((d) => d === 'rejected') ? 'rejected' : 'approved'

    submit.mutate(
      { token, decision: overall, sectionReasons },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => setSubmitError(err.message),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-outline-variant border-t-ai-vibrant rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body-md text-on-surface-variant">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-status-review/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="error_outline" className="text-[32px] text-status-review" />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Lien invalide</h2>
          <p className="font-body-md text-on-surface-variant">
            Ce lien de validation est expire ou invalide. Veuillez contacter l&apos;expediteur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  if (alreadyDecided) {
    const decision = validation!.decision!
    const isApproved = decision === 'approved'
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isApproved ? 'bg-status-final/10' : 'bg-status-review/10'}`}
          >
            <Icon
              name={isApproved ? 'check_circle' : 'cancel'}
              className={`text-[32px] ${isApproved ? 'text-status-final' : 'text-status-review'}`}
            />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">
            {isApproved ? 'Document approuve' : 'Document rejete'}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {isApproved
              ? 'Ce document a deja ete approuve. Merci pour votre validation.'
              : 'Ce document a ete rejete. Les modifications demandees ont ete transmises a l\'equipe de redaction.'}
          </p>
          {document && (
            <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-4">
              Document : {document.title}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-status-final/10 flex items-center justify-center mx-auto mb-6">
            <Icon name="check_circle" className="text-[32px] text-status-final" />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Decision envoyee</h2>
          <p className="font-body-md text-on-surface-variant">
            Votre decision a bien ete enregistree. L&apos;equipe de redaction en sera informee.
          </p>
          {document && (
            <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-4">
              Document : {document.title}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-studio">
      <header className="border-b border-outline-variant bg-white">
        <div className="max-w-[800px] mx-auto px-8 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ai-vibrant/10 flex items-center justify-center">
            <Icon name="verified" className="text-ai-vibrant text-lg" />
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            Validation
          </span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-8 py-12">
        {document && (
          <>
            <div className="mb-12">
              <h1 className="font-headline-lg text-headline-lg text-primary leading-tight mb-2">
                {document.title}
              </h1>
              <p className="font-body-md text-on-surface-variant">
                Veuillez examiner chaque section et indiquer votre decision. Un motif est obligatoire pour toute section rejetee.
              </p>
            </div>

            <div className="space-y-8">
              {document.sections?.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  decision={decisions[section.id]}
                  reason={reasons[section.id] || ''}
                  onDecision={(d) => handleDecision(section.id, d)}
                  onReason={(r) => handleReason(section.id, r)}
                />
              ))}
            </div>

            {!diagramsLoading && diagrams.length > 0 && (
              <div className="mt-12">
                <h2 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2">
                  <Icon name="account_tree" className="text-ai-vibrant" />
                  Diagrammes UML
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {diagrams.map(d => (
                    <div key={d.id} className="bg-white rounded-lg border border-outline-variant p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-label-sm text-label-sm text-ai-vibrant bg-ai-glow/20 px-2 py-0.5 rounded uppercase">
                          {d.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {d.renderedUrl ? (
                        <img
                          src={d.renderedUrl}
                          alt={`Diagramme ${d.type}`}
                          className="w-full rounded border border-outline-variant bg-white"
                        />
                      ) : (
                        <p className="text-on-surface-variant font-body-sm italic">Diagramme non disponible</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="mt-6 p-4 bg-status-review/5 border border-status-review/20 rounded-lg text-status-review font-body-sm text-body-sm">
                {submitError}
              </div>
            )}

            <div className="mt-12 border-t border-outline-variant pt-8 flex items-center justify-between">
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                {document.sections?.length
                  ? `${Object.keys(decisions).length} / ${document.sections.length} sections evaluees`
                  : 'Aucune section a evaluer'}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!allSectionsDecided() || submit.isPending}
                className="px-8 py-2.5 bg-primary-container hover:bg-primary-container/90 text-white font-headline text-sm font-semibold rounded-lg transition-all"
              >
                {submit.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi...
                  </span>
                ) : (
                  'Soumettre la decision'
                )}
              </Button>
            </div>
          </>
        )}

        {!document && (
          <div className="text-center py-20">
            <p className="font-body-md text-on-surface-variant">Document introuvable.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function SectionCard({
  section,
  decision,
  reason,
  onDecision,
  onReason,
}: {
  section: BackendSection
  decision: 'approved' | 'rejected' | undefined
  reason: string
  onDecision: (d: 'approved' | 'rejected') => void
  onReason: (r: string) => void
}) {
  return (
    <div className="bg-white rounded-lg border border-outline-variant p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-label-sm text-label-sm text-ai-vibrant bg-ai-glow/20 px-2 py-0.5 rounded">
            Section
          </span>
          <h3 className="font-headline-md text-headline-md text-primary">{section.title}</h3>
        </div>
      </div>

      <div className="font-body-md text-on-surface leading-relaxed mb-6 bg-surface-studio rounded-lg p-5 border border-outline-variant/60 prose prose-sm max-w-none">
        {section.content ? (
          <ReactMarkdown>{section.content}</ReactMarkdown>
        ) : (
          <span className="text-on-surface-variant italic">Contenu en cours de generation...</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onDecision('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all border ${
            decision === 'approved'
              ? 'bg-status-final/10 border-status-final text-status-final'
              : 'border-outline-variant text-on-surface-variant hover:border-status-final hover:text-status-final'
          }`}
        >
          <Icon name="check" className="text-[18px]" />
          Accepter
        </button>

        <button
          onClick={() => onDecision('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-all border ${
            decision === 'rejected'
              ? 'bg-status-review/10 border-status-review text-status-review'
              : 'border-outline-variant text-on-surface-variant hover:border-status-review hover:text-status-review'
          }`}
        >
          <Icon name="close" className="text-[18px]" />
          Rejeter
        </button>
      </div>

      {decision === 'rejected' && (
        <div className="mt-4">
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
            Motif du rejet <span className="text-status-review">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReason(e.target.value)}
            placeholder="Veuillez expliquer pourquoi cette section est rejetee..."
            rows={3}
            className="w-full px-4 py-3 text-body-sm font-body-sm bg-surface-studio border border-outline-variant rounded-lg resize-none focus:border-ai-vibrant focus:ring-0 outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
      )}
    </div>
  )
}
