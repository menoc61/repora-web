# Task 7: OnboardingWizard — extract step sub-components

## Current state
`src/pages/OnboardingWizard.tsx` (612 lines) — 5-step requirements-elicitation wizard. Hooks ALREADY wired: `useRequirements`, `useAddRequirement`, `useGenerateDocument` (lines 76-78), plus `api` for project load/save (81-149). State (step, project, context, funcReqs, nonFuncReqs, actors, modal, etc.) + handlers live in the default `OnboardingWizard()` component. Preserve ALL wiring, JSX, styles, French labels, behavior.

## Files
Create under `src/components/onboarding/`:
- `types.ts` — `Project` (9-15), `Requirement` (17-22), `SectionRequirement` (24-29) interfaces; `STEPS` (31-37), `NFR_PRESETS` (39-48), `ACTOR_PRESETS` (50-56) arrays. Export all.
- `ContextStep.tsx` — step 0 (303-339). Props `{ context: {description;objectives;scope}; setContext: (c) => void }`.
- `FunctionalStep.tsx` — step 1 (341-391). Props `{ reqs: SectionRequirement[]; onAdd: () => void; onUpdate: (id, field, value) => void; onRemove: (id) => void; actors: string[] }`.
- `NonFunctionalStep.tsx` — step 2 (393-446). Props `{ reqs: SectionRequirement[]; presets: {text;key}[]; onTogglePreset: (text) => void; onAdd: () => void; onUpdate: (id, text) => void; onRemove: (id) => void }`.
- `ActorsStep.tsx` — step 3 (448-493). Props `{ actors: string[]; presets: {text;key}[]; onToggle: (a) => void; onAddCustom: () => void }`.
- `ReviewStep.tsx` — step 4 (495-563). Props `{ context; funcReqs: SectionRequirement[]; nonFuncReqs: SectionRequirement[]; actors: string[]; onEditStep: (s: number) => void }`.
- `ActorModal.tsx` — the add-actor modal (591-609). Props `{ open: boolean; value: string; onChange: (v) => void; onConfirm: () => void; onCancel: () => void }`.
- `OnboardingWizardView.tsx` — owns `projectId` + ALL state (step, project, loading, saving, error, context, funcReqs, nonFuncReqs, actors, generating, showActorModal, newActorName, reqsInitialized) + ALL handlers (loadProject, reqs-init effect, saveContext, saveRequirements, handleNext, handlePrev, handleGenerate, addFuncReq, updateFuncReq, removeFuncReq, addNonFuncReq, updateNonFuncReq, removeNonFuncReq, toggleNFrPreset, toggleActor, addCustomActor, confirmCustomActor). Renders: loading state (221-230), `!projectId` state (232-242), header (247-263), progress bar (265-271), step indicators (273-293), error banner (295-301), the active step component (switch on `step`), nav buttons (566-588), `<ActorModal .../>`. Imports `api` from `../../api/client`, hooks from `../../hooks/useQueries`, `useNavigate`. Props `{ projectId: string | undefined }`.
- `index.ts` — barrel re-exporting `OnboardingWizardView` (and `./types` if helpful).

Modify: `src/pages/OnboardingWizard.tsx` → thin wrapper:
```tsx
import { useParams } from '@tanstack/react-router'
import OnboardingWizardView from '../components/onboarding'
export default function OnboardingWizard() {
  const { id } = useParams({ from: '/onboarding/$id' as any, strict: false }) as { id?: string }
  return <OnboardingWizardView projectId={id} />
}
```

## Steps
- [ ] Step1: `types.ts`.
- [ ] Step2: `ContextStep`, `FunctionalStep`, `NonFunctionalStep`, `ActorsStep`, `ReviewStep` — exact JSX/styles/labels, receiving state+handlers via props.
- [ ] Step3: `ActorModal.tsx`.
- [ ] Step4: `OnboardingWizardView.tsx` owning everything; compose.
- [ ] Step5: `index.ts` barrel.
- [ ] Step6: Slim `OnboardingWizard.tsx` to wrapper.
- [ ] Step7: Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (step nav, context save, req add/edit/remove, presets, actors, review, generate→navigate).
- [ ] Step8: Commit `git add src/components/onboarding src/pages/OnboardingWizard.tsx && git commit -m "refactor(onboarding): decompose wizard steps into sub-components"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly.
- No new tests; verification = tsc + vite build.
- Keep relative imports within `onboarding/` consistent (`../../` for api/hooks).
- Behavior + hook wiring preserved exactly. Do not change `api.*` or `useX().mutate*` calls.
