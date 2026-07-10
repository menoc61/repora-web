# Task 9: WorkspaceDashboard — extract sub-components

## Current state
`src/pages/WorkspaceDashboard.tsx` (362 lines) — workspace home: TopBar, prompt hero, active-projects grid, recent-documents section (with NewDocument card, doc cards, activity feed side-widget, agent-status side-widget). Uses RELATIVE `../` imports. All hooks already wired (`useDocuments`, `useProjects`, `useActivity`, `useAgents`, `useCreateProject`, `useWorkspaceStore`). Preserve ALL JSX, styles, French labels, behavior.

## Files
Create under `src/components/workspace-dashboard/`:
- `activity.tsx` — `BackEndActivityItem` (13-22), `UIActivityItem` (24-31) interfaces; `getTimeAgo(ts)` (33-45); `mapActivityItem(item)` (47-79, returns `UIActivityItem` with JSX `t`/`sub`). Export all. (Lives here so both View + ActivityFeed can import `UIActivityItem` without a circular dep.)
- `PromptHero.tsx` — hero (138-162). Props `{ prompt: string; onPromptChange: (v:string)=>void; onGenerate: ()=>void; generating: boolean }`.
- `ProjectCard.tsx` — single project card (180-194). Props `{ project: any; onOpen: (id:string)=>void }`. Renders `<Link to="/onboarding/$id" params={{id: project.projectId ?? project.id}} onClick={()=>onOpen(project.projectId ?? project.id)}>`.
- `ProjectGrid.tsx` — projects section (164-197, incl. loading skeleton + empty state + grid). Props `{ projects: any[]; loading: boolean; onOpen: (id:string)=>void }`. Maps to `ProjectCard`.
- `DocumentCard.tsx` — doc card (253-284). Props `{ doc: any; viewMode: 'grid'|'list'; onOpen: (id:string)=>void }`. Renders `<Link to="/editor" search={{id:doc.id}} onClick={()=>onOpen(doc.id)}>` with className depending on viewMode.
- `NewDocumentCard.tsx` — dashed "Nouveau document" card (232-250). Props `{ onClick: ()=>void; generating: boolean }`.
- `ActivityFeed.tsx` — "ACTIVITE DE COLLABORATION" widget (287-323). Props `{ activityItems: UIActivityItem[]; loading: boolean }`. Imports `UIActivityItem` from `./activity`.
- `AgentStatusPanel.tsx` — "ORCHESTRATEUR IA" widget (325-356). Props `{ agents: any[] }`.
- `WorkspaceDashboardView.tsx` — owns: navigate, `useDocuments()`, `useProjects()`, `useActivity()`, `useAgents()`, `useWorkspaceStore` (setActiveView), `useCreateProject()`, prompt/viewMode state, `isDocumentGenerating(doc)` (96-105), `activityItems` (92, via `mapActivityItem` from `./activity`), `handleGenerate` (107-115), `handleNewDocument` (117-124), `onOpenProject`/`onOpenDocument` (call setActiveView + navigate). Renders: TopBar (128-136) + `<PromptHero .../>` + `<ProjectGrid .../>` + the "Documents recents" section: header (199-229, with NewDocument button + grid/list toggle) + grid container (230-357) composing `<NewDocumentCard/>` (grid mode only) + docs.map(`<DocumentCard/>`) + `<ActivityFeed/>` (col-span-8) + `<AgentStatusPanel/>` (col-span-4). No props (workspace root).
- `index.ts` — barrel re-exporting `WorkspaceDashboardView` (and `./activity` if helpful).

Modify: `src/pages/WorkspaceDashboard.tsx` → thin wrapper:
```tsx
import WorkspaceDashboardView from '../components/workspace-dashboard'
export default function WorkspaceDashboard() {
  return <WorkspaceDashboardView />
}
```
Drop the unused `HermesGenerationError` import (line 11).

## Steps
- [ ] Step1: `activity.tsx` (interfaces + helpers).
- [ ] Step2: `PromptHero`, `ProjectCard`, `ProjectGrid`, `DocumentCard`, `NewDocumentCard`, `ActivityFeed`, `AgentStatusPanel` — exact JSX/styles/labels.
- [ ] Step3: `WorkspaceDashboardView.tsx` owning state + handlers + hooks; composes all (incl. the documents-section header + grid container).
- [ ] Step4: `index.ts` barrel.
- [ ] Step5: Slim `WorkspaceDashboard.tsx` to wrapper; drop unused `HermesGenerationError` import.
- [ ] Step6: Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (generate via prompt, project cards→onboarding, doc cards→editor, view toggle, activity feed, agent panel).
- [ ] Step7: Commit `git add src/components/workspace-dashboard src/pages/WorkspaceDashboard.tsx && git commit -m "refactor(workspace-dashboard): decompose into sub-components"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly.
- No new tests; verification = tsc + vite build.
- Use RELATIVE `../` for cross-folder (consistent with this page: `../layout/TopBar`, `../components/Icon`, `../hooks/useQueries`, `../stores`) and `./` for siblings in `workspace-dashboard/`.
- Behavior preserved exactly. Do not change any `useX().mutate*` call.
