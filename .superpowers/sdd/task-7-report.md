# Task 7 Report — OnboardingWizard step decomposition

## Status
DONE

## Summary
Decomposed `src/pages/OnboardingWizard.tsx` (612 lines) into presentational step sub-components under `src/components/onboarding/`, with `OnboardingWizardView` owning all state, handlers, hooks, and the early-return states. The page is now a 4-line thin wrapper.

## Files created (`src/components/onboarding/`)
- `types.ts` — `Project`, `Requirement`, `SectionRequirement`, `Preset`, `StepDef` interfaces; `STEPS`, `NFR_PRESETS`, `ACTOR_PRESETS` arrays (verbatim French labels).
- `ContextStep.tsx` — step 0. Props `{ context; setContext }`.
- `FunctionalStep.tsx` — step 1. Props `{ reqs; onAdd; onUpdate; onRemove; actors }`.
- `NonFunctionalStep.tsx` — step 2. Props `{ reqs; presets; onTogglePreset; onAdd; onUpdate; onRemove }`.
- `ActorsStep.tsx` — step 3. Props `{ actors; presets; onToggle; onAddCustom }`.
- `ReviewStep.tsx` — step 4. Props `{ context; funcReqs; nonFuncReqs; actors; onEditStep }`.
- `ActorModal.tsx` — modal. Props `{ open; value; onChange; onConfirm; onCancel }`. Returns `null` when `!open` (equivalent to the original `showActorModal && (...)` conditional).
- `OnboardingWizardView.tsx` — owns `projectId` + ALL state (`step`, `project`, `loading`, `saving`, `error`, `context`, `funcReqs`, `nonFuncReqs`, `actors`, `generating`, `showActorModal`, `newActorName`, `reqsInitialized`), ALL handlers (`saveContext`, `saveRequirements`, `handleNext`, `handlePrev`, `handleGenerate`, `addFuncReq`, `updateFuncReq`, `removeFuncReq`, `addNonFuncReq`, `updateNonFuncReq`, `removeNonFuncReq`, `toggleNFrPreset`, `toggleActor`, `addCustomActor`, `confirmCustomActor`), the `api`/hooks wiring, the `loading` + `!projectId` early returns, header, progress bar, step indicators, error banner, step switch, nav buttons, and `<ActorModal>`.
- `index.ts` — `export { default } from './OnboardingWizardView'` + `export * from './types'`.

## Modified
- `src/pages/OnboardingWizard.tsx` — slimmed to thin wrapper returning `<OnboardingWizardView projectId={id} />`.

## Verification
- `npx tsc --noEmit` — passes (no errors).
- `npx vite build` — succeeds (only a >500kB chunk-size advisory, pre-existing, not an error).

## Preservation checks
- All `api.*` calls unchanged: `api.get('/projects/${projectId}')`, `api.patch(...)`, `api.get(.../requirements)`, `api.delete('/requirements/${r.id}')`.
- `useRequirements(projectId)`, `useAddRequirement()`, `useGenerateDocument()` and all `.mutateAsync` / `.mutateAsync` / `.isPending` usages untouched.
- All French labels, DESIGN.md tokens (e.g. `surface-studio`, `ai-vibrant`, `primary-container`, `status-final`), Tailwind classes, and JSX structure preserved verbatim.
- Behavior identical: step navigation, context save, functional/non-functional req add/edit/remove, NFR presets toggle, actor toggle/custom add, review edit-links, and generate→navigate.

## Concerns
- `generating` state is set in `handleGenerate` but never read in render (inherited from the original file; kept to preserve exact wiring). No functional impact.
- Line-ending normalization (LF→CRLF) warnings from git are cosmetic and do not affect the build.
