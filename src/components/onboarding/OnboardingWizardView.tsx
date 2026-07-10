import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import Icon from '../Icon'
import { Button } from '../ui/button'
import { api } from '../../api/client'
import { useRequirements, useAddRequirement, useGenerateDocument } from '../../hooks/useQueries'
import { useGenerationStore } from '../../stores/generationStore'
import { Project, Requirement, SectionRequirement, STEPS, NFR_PRESETS, ACTOR_PRESETS } from './types'
import ContextStep from './ContextStep'
import FunctionalStep from './FunctionalStep'
import NonFunctionalStep from './NonFunctionalStep'
import ActorsStep from './ActorsStep'
import ReviewStep from './ReviewStep'
import ActorModal from './ActorModal'

interface OnboardingWizardViewProps {
  projectId: string | undefined
}

export default function OnboardingWizardView({ projectId }: OnboardingWizardViewProps) {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [context, setContext] = useState({ description: '', objectives: '', scope: '' })
  const [funcReqs, setFuncReqs] = useState<SectionRequirement[]>([])
  const [nonFuncReqs, setNonFuncReqs] = useState<SectionRequirement[]>([])
  const [actors, setActors] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [showActorModal, setShowActorModal] = useState(false)
  const [newActorName, setNewActorName] = useState('')
  const { data: requirements = [], isLoading: reqsLoading } = useRequirements(projectId)
  const addRequirement = useAddRequirement()
  const generateDocument = useGenerateDocument()

  // Load project
  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    api.get<Project>(`/projects/${projectId}`)
      .then(p => {
        setProject(p)
        // Parse brief into context fields
        if (p.brief) {
          setContext(prev => ({ ...prev, description: p.brief || '' }))
        }
      })
      .catch(() => setError('Projet introuvable'))
      .finally(() => setLoading(false))
  }, [projectId])

  // Load existing requirements from hook
  const [reqsInitialized, setReqsInitialized] = useState(false)
  useEffect(() => {
    if (!projectId || reqsLoading || reqsInitialized || !Array.isArray(requirements)) return
    const fReqs = requirements
      .filter(r => r.type === 'functional')
      .map((r, i) => ({ id: i, type: 'functional' as const, text: r.text, sourceActor: r.source_actor || '' }))
    const nReqs = requirements
      .filter(r => r.type === 'non_functional')
      .map((r, i) => ({ id: i + 100, type: 'non_functional' as const, text: r.text, sourceActor: r.source_actor || '' }))
    if (fReqs.length) setFuncReqs(fReqs)
    if (nReqs.length) setNonFuncReqs(nReqs)
    const actorSet = new Set(requirements.map(r => r.source_actor).filter(Boolean) as string[])
    if (actorSet.size) setActors(Array.from(actorSet))
    setReqsInitialized(true)
  }, [requirements, reqsLoading, projectId, reqsInitialized])

  // Save context
  const saveContext = useCallback(async () => {
    if (!projectId) return
    setSaving(true)
    try {
      const fullBrief = [
        context.description,
        context.objectives ? `Objectifs: ${context.objectives}` : '',
        context.scope ? `Perimetre: ${context.scope}` : '',
      ].filter(Boolean).join('\n\n')
      await api.patch(`/projects/${projectId}`, { brief: fullBrief })
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }, [projectId, context])

  // Save requirements batch
  const saveRequirements = useCallback(async (type: 'functional' | 'non_functional', reqs: SectionRequirement[]) => {
    if (!projectId) return
    setSaving(true)
    try {
      const existing = await api.get<Requirement[]>(`/projects/${projectId}/requirements`)
      const toDelete = existing.filter(r => r.type === type)
      for (const r of toDelete) {
        await api.delete(`/requirements/${r.id}`)
      }
      for (const r of reqs) {
        if (r.text.trim()) {
          await addRequirement.mutateAsync({
            projectId,
            type: r.type,
            text: r.text,
            sourceActor: r.sourceActor || undefined,
          })
        }
      }
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }, [projectId, addRequirement])

  // Save and next
  const handleNext = async () => {
    setError(null)
    if (step === 0) await saveContext()
    if (step === 1) await saveRequirements('functional', funcReqs)
    if (step === 2) await saveRequirements('non_functional', nonFuncReqs)
    if (step === 3) {
      // Actors saved as sourceActor on requirements
      // Ensure actors are preserved when re-saving func reqs
      await saveRequirements('functional', funcReqs)
    }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handlePrev = () => { if (step > 0) setStep(step - 1) }

  // Launch generation
  const handleGenerate = async () => {
    if (!projectId) return
    setGenerating(true)
    try {
      const result = await generateDocument.mutateAsync({ projectId })
      const genStore = useGenerationStore.getState()
      genStore.startSession({ projectId, documentId: result.document_id, title: project?.name ?? 'Document' })
      navigate({ to: '/editor', search: { id: result.document_id } })
    } catch (e) {
      setError((e as Error).message)
      setGenerating(false)
    }
  }

  // Functional reqs helpers
  const addFuncReq = () => {
    setFuncReqs([...funcReqs, { id: Date.now(), type: 'functional', text: '', sourceActor: actors[0] || '' }])
  }
  const updateFuncReq = (id: number, field: 'text' | 'sourceActor', value: string) => {
    setFuncReqs(funcReqs.map(r => r.id === id ? { ...r, [field]: value } : r))
  }
  const removeFuncReq = (id: number) => setFuncReqs(funcReqs.filter(r => r.id !== id))

  // Non-func reqs helpers
  const addNonFuncReq = () => setNonFuncReqs([...nonFuncReqs, { id: Date.now(), type: 'non_functional', text: '', sourceActor: '' }])
  const updateNonFuncReq = (id: number, text: string) => {
    setNonFuncReqs(nonFuncReqs.map(r => r.id === id ? { ...r, text } : r))
  }
  const removeNonFuncReq = (id: number) => setNonFuncReqs(nonFuncReqs.filter(r => r.id !== id))
  const toggleNFrPreset = (preset: string) => {
    if (nonFuncReqs.some(r => r.text === preset)) {
      setNonFuncReqs(nonFuncReqs.filter(r => r.text !== preset))
    } else {
      setNonFuncReqs([...nonFuncReqs, { id: Date.now() + Math.random(), type: 'non_functional', text: preset, sourceActor: '' }])
    }
  }

  // Actor helpers
  const toggleActor = (actor: string) => {
    if (actors.includes(actor)) setActors(actors.filter(a => a !== actor))
    else setActors([...actors, actor])
  }
  const addCustomActor = () => {
    setNewActorName('')
    setShowActorModal(true)
  }
  const confirmCustomActor = () => {
    const name = newActorName.trim()
    if (name && !actors.includes(name)) {
      setActors([...actors, name])
    }
    setShowActorModal(false)
    setNewActorName('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <Icon name="progress_activity" className="animate-spin" />
          <span className="font-label-md font-mono">Chargement...</span>
        </div>
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-surface-studio flex items-center justify-center">
        <div className="text-center">
          <Icon name="error_outline" className="text-5xl text-status-review mb-4 block mx-auto" />
          <p className="font-body-lg text-primary-container mb-4">Aucun projet specifie. Creez d'abord un projet.</p>
          <Button onClick={() => navigate({ to: '/workspace' })}>Retour a l'accueil</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-studio">
      {/* Header */}
      <div className="border-b border-outline-variant bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/workspace' })}>
            <Icon name="arrow_back" />
          </Button>
          <div>
            <h1 className="font-headline-md text-primary-container">
              {project?.name || 'Nouveau Projet'}
            </h1>
            <p className="font-label-md font-mono text-secondary">Assistant de redaction — Cahier des Charges</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="font-label-sm font-mono text-secondary flex items-center gap-1"><Icon name="progress_activity" className="animate-spin text-sm" /> Sauvegarde...</span>}
          <span className="font-label-md font-mono text-secondary">Etape {step + 1}/{STEPS.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-outline-variant">
        <div
          className="h-full bg-ai-vibrant transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => { if (i < step) setStep(i) }}
              disabled={i > step}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                i === step
                  ? 'bg-primary-container text-white'
                  : i < step
                  ? 'bg-surface text-primary-container hover:bg-outline-variant cursor-pointer'
                  : 'bg-surface text-outline-variant cursor-not-allowed'
              }`}
            >
              <Icon name={s.icon} className="text-base" />
              <span className="font-label-md font-mono whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container border border-on-error-container rounded text-on-error-container font-body-sm flex items-start gap-2">
            <Icon name="error_outline" className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0"><Icon name="close" /></button>
          </div>
        )}

        {/* STEP 0: CONTEXT */}
        {step === 0 && <ContextStep context={context} setContext={setContext} />}

        {/* STEP 1: FUNCTIONAL REQUIREMENTS */}
        {step === 1 && (
          <FunctionalStep
            reqs={funcReqs}
            onAdd={addFuncReq}
            onUpdate={updateFuncReq}
            onRemove={removeFuncReq}
            actors={actors}
          />
        )}

        {/* STEP 2: NON-FUNCTIONAL REQUIREMENTS */}
        {step === 2 && (
          <NonFunctionalStep
            reqs={nonFuncReqs}
            presets={NFR_PRESETS}
            onTogglePreset={toggleNFrPreset}
            onAdd={addNonFuncReq}
            onUpdate={updateNonFuncReq}
            onRemove={removeNonFuncReq}
          />
        )}

        {/* STEP 3: ACTORS */}
        {step === 3 && (
          <ActorsStep
            actors={actors}
            presets={ACTOR_PRESETS}
            onToggle={toggleActor}
            onAddCustom={addCustomActor}
          />
        )}

        {/* STEP 4: REVIEW + LAUNCH */}
        {step === 4 && (
          <ReviewStep
            context={context}
            funcReqs={funcReqs}
            nonFuncReqs={nonFuncReqs}
            actors={actors}
            onEditStep={setStep}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={handlePrev} disabled={step === 0}>
            <Icon name="arrow_back" /> Precedent
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={saving}>
              {saving ? <><Icon name="progress_activity" className="animate-spin" /> Sauvegarde...</> : <>Suivant <Icon name="arrow_forward" /></>}
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generateDocument.isPending}
              className="bg-status-final hover:bg-status-final/90 text-white"
            >
              {generateDocument.isPending ? (
                <><Icon name="progress_activity" className="animate-spin" /> Generation en cours...</>
              ) : (
                <><Icon name="auto_awesome" /> Lancer la generation du cahier des charges</>
              )}
            </Button>
          )}
        </div>
      </div>

      <ActorModal
        open={showActorModal}
        value={newActorName}
        onChange={setNewActorName}
        onConfirm={confirmCustomActor}
        onCancel={() => setShowActorModal(false)}
      />
    </div>
  )
}
