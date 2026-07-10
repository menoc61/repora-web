# Task 9 Report: WorkspaceDashboard — extract sub-components

**Status:** DONE

## Summary
Decomposed `src/pages/WorkspaceDashboard.tsx` (362 lines) into a presentational
`src/components/workspace-dashboard/` module. The View owns all state, hooks, and
handlers; sub-components are pure presentational props consumers.

## Files created (`src/components/workspace-dashboard/`)
- `activity.tsx` — `BackendActivityItem` + `UIActivityItem` interfaces, `getTimeAgo`,
  `mapActivityItem`. Shared by View and ActivityFeed to avoid circular import.
- `PromptHero.tsx` — hero section. Props: `{ prompt, onPromptChange, onGenerate, generating }`.
- `ProjectCard.tsx` — single project `<Link to="/onboarding/$id">`. Props: `{ project, onOpen }`.
- `ProjectGrid.tsx` — projects section + loading skeleton + empty state. Props: `{ projects, loading, onOpen }`.
- `DocumentCard.tsx` — doc `<Link to="/editor" search={{id}}>`. Props: `{ doc, viewMode, onOpen }`.
- `NewDocumentCard.tsx` — dashed "Nouveau document" card. Props: `{ onClick, generating }`.
- `ActivityFeed.tsx` — "ACTIVITE DE COLLABORATION" widget. Props: `{ activityItems, loading }`. Imports `UIActivityItem` from `./activity`.
- `AgentStatusPanel.tsx` — "ORCHESTRATEUR IA" widget. Props: `{ agents }`.
- `WorkspaceDashboardView.tsx` — owns navigate, all 6 hooks, prompt/viewMode state,
  `isDocumentGenerating`, `activityItems` (via `mapActivityItem`), `handleGenerate`,
  `handleNewDocument`, `onOpenProject`/`onOpenDocument`. Composes full tree.
- `index.ts` — barrel re-exporting `WorkspaceDashboardView` (default) + `./activity`.

## Page wrapper
`src/pages/WorkspaceDashboard.tsx` slimmed to:
```tsx
import WorkspaceDashboardView from '../components/workspace-dashboard'
export default function WorkspaceDashboard() {
  return <WorkspaceDashboardView />
}
```
Dropped the unused `HermesGenerationError` import.

## Behavior preservation
- All `useX().mutate*` calls (`createProject.mutateAsync`) unchanged.
- All French labels preserved verbatim (no translation).
- DESIGN.md tokens (colors, fonts, radii) unchanged.
- Prompt generate → /onboarding; project cards → /onboarding; doc cards → /editor;
  grid/list toggle; activity feed; agent panel — all intact.
- `generating` wired to `createProject.isPending` (matches original disabled logic).

## Deviations / decisions (justified)
- **Relative import depth:** From `src/components/workspace-dashboard/`, cross-folder
  paths are `../../layout/TopBar`, `../../components/...`, `../../stores`, `../../hooks/...`
  (the brief's `../` examples were page-relative; the correct depth here is `../../`).
  Sibling imports use `./`.
- **`AgentStatusPanel` `setActiveView('agents')`:** brief constrains its props to
  `{ agents: any[] }`, but the original Link called `setActiveView('agents')`. To keep
  the prop shape AND preserve behavior, the panel pulls `setActiveView` from the global
  `useWorkspaceStore` directly.
- **Document generating badge:** `isDocumentGenerating(d)` is computed in the View and
  injected as a transient `doc.__generating` flag (document objects are `any`), read by
  `DocumentCard` — keeps its prop shape `{ doc, viewMode, onOpen }` while preserving the
  "Generation en cours..." indicator.
- `onOpenProject`/`onOpenDocument` call `setActiveView` + `navigate` per the brief; the
  sub-component `<Link>` targets are identical, so navigation is idempotent.

## Verification
- `npx tsc --noEmit` → clean (no errors).
- `npx vite build` → success (`✓ built in 9.66s`). Only warning is the pre-existing
  >500 kB chunk-size advisory (unrelated to this change).

## Commit
`5d1fa00` refactor(workspace-dashboard): decompose into sub-components

## Concerns
- Minor: `onOpenProject`/`onOpenDocument` invoke `navigate()` while the sub-component
  `<Link>` also navigates to the same route — redundant but idempotent and matches the
  brief's described handler contract. No observable behavior change.
- No automated tests added (per task constraint; verification = tsc + vite build).
