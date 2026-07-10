# Repora — Page Decomposition & Feature Completion Design

**Date:** 2026-07-10
**Status:** Approved approach (Approach A), pending per-wave spec expansion
**Author:** opencode (with user direction)

## 1. Goal & scope

Repora's 14 page components are monolithic (155–612 lines each) with only primitive
UI primitives (`src/components/ui/*`) and a few feature components (`AgentStatus`,
`GenerationProgress`, `StatusBadge`, `Toast`, `Icon`). The earlier graphify analysis
found **18 hooks defined but unused by any page**, several pointing at real backend
features with no UI (comments, agent tools, validation view, diagram listing).

This design decomposes every page into focused, co-located sub-components **and**
wires the unused hooks into real UI — balanced, per the user's direction ("both").

Quality bar (user-selected): **functional correctness + clean sub-component structure
+ strict DESIGN.md ("Repora Sovereign") token adherence + French UI label consistency.**
No new unit tests are required (vitest stays optional), but `tsc --noEmit` and
`vite build` must stay green after every wave.

## 2. Approach A — page-folder decomposition

For each page `src/pages/<Page>.tsx`:

- The page file becomes a **thin orchestrator**: it owns top-level route state, calls
  the data hooks, and renders sub-components. Business logic that is purely presentational
  moves into the sub-component.
- Sub-components live in `src/components/<page>/` (kebab-case folder, PascalCase files),
  one file per component.
- Shared, cross-page UI (modals, forms, tables, empty states) is promoted to
  `src/components/ui/` or `src/components/` only if reused by ≥2 pages. Otherwise it
  stays local to the page folder.
- Error handling uses the existing global `notify()` from `src/components/Toast.tsx`
  (`notify({ type: 'error', title, message })`). Inline `setError` strings are replaced
  with `notify` calls so failures surface consistently. Loading uses React Query's
  `isPending`/`isLoading` states, never hardcoded `false ? ... : ...` toggles.
- Naming: components are PascalCase; files match the component name; props are typed
  inline or via a local `interface Props`.

### Folder convention
```
src/pages/<Page>.tsx              # thin orchestrator
src/components/<page>/
  <SubComponent>.tsx              # one concern per file
  index.ts                       # re-export barrel (optional)
```

## 3. DESIGN.md token rules (mandatory)

All new/extracted UI MUST use only tokens from `DESIGN.md`:
- **Colors:** `primary-container` (#131b2e), `secondary`/`ai-vibrant` (#2563EB),
  `surface-studio` (#F8FAFC), `outline-variant`, `status-draft`/`status-review`/
  `status-final`, `error`. No raw hex except where a token is missing (then add the
  token to DESIGN.md, do not inline).
- **Spacing:** use `p-gutter` (24px), `px-gutter`, `pl-sidebar-width` (280px),
  `pr-inspector-width` (320px), `max-w-[800px]` for editor canvas. Never double-apply
  sidebar/inspector offsets (the earlier `pl-sidebar-width` + `pl-sidebar-width` bug).
- **Typography:** `font-headline-*` (Geist) for headings, `font-body-*` (Inter) for
  text, `font-label-*` (JetBrains Mono) for machine/agent metadata, timestamps,
  status labels. Mono = "the machine is talking."
- **Shape:** 4px radius on buttons/inputs/chips, 8px on panels/cards.
- **Elevation:** no dramatic shadows; tonal layers + 1px `outline-variant` borders;
  active/selected = 2px AI-blue left accent.

## 4. Wave decomposition (6 sub-projects)

Each wave is its own spec → plan → implementation cycle. Wave 1 is detailed in §5;
waves 2–6 are scoped in §6 and get full specs when reached.

| Wave | Pages | Primary new features wired |
|---|---|---|
| 1. Authoring core | Editor, VersionHistory, Sharing, OnboardingWizard, DocumentLibrary, WorkspaceDashboard, TemplateGallery | Sharing invite/link/collaborator mgmt; diagram listing in Editor |
| 2. Collaboration | Editor (comments), Sharing (comments), activity | `useComments`/`useAddComment`/`useResolveComment` |
| 3. Admin & agents | Settings, Infrastructure | `useAgentTools`/`useConnectTool`/`useDisconnectTool`/`useTestAgent`/`useExportAgentConfig` |
| 4. Validation & export | ValidatePortal, ExportPreview, Assistant | `useValidationView`; fix `FORMAT_LABEL_TO_EXPORT` mapping |
| 5. Auth | LoginPage, SignupPage | form decomposition, error polish |
| 6. Polish & perf | all | DESIGN.md token audit, French-label pass, route-level `React.lazy` code-splitting |

## 5. Wave 1 detailed design — Authoring core

### 5.1 Editor.tsx (543 → ~120 orchestrator + `src/components/editor/*`)
Sub-components:
- `EditorCanvas.tsx` — BlockNote + Yjs wrapper (extract current `EditorContent`).
- `EditorHeader.tsx` — top nav: title, status chip, Export/Share/History buttons.
- `InspectorPanel.tsx` — right sidebar container composing the blocks below.
- `AgentProgressPanel.tsx` — SSE-driven `GenerationProgress` or placeholder.
- `OutlineTree.tsx` — document outline nav (`OutlineItem` extracted here).
- `DiagramPanel.tsx` — UML generation (already added; refine to list created diagrams
  via local state + a `useDiagram(id)` fetch per id; add export-link button).
- `ShareDialog.tsx` — validation-token share flow (extract from `handleShare`).
Hooks already wired: `useDocument`, `useSaveDocument`, `useExportDocument`,
`useValidationToken`, `useAgents`, `useDocumentStream`, `useCreateDiagram`.
Token/label: status uses `status-draft/review/final`; French labels preserved.

### 5.2 VersionHistory.tsx (363 → orchestrator + `src/components/history/*`)
Sub-components:
- `VersionList.tsx` — sidebar list (extract `allVersions.map`).
- `VersionDiffView.tsx` — comparison panel + "Accepter"/"Restaurer" actions.
- `CollaboratorsPanel.tsx` — active collaborators (extract `collaboratorsData` map).
- `RetentionDialog.tsx` — retention settings modal (extract `showRetention`).
Hooks: `useVersions`, `useRestoreVersion`, `useCollaborators`, `useSaveDocument`,
`useAcceptChanges` (already fixed). Remove any `alert()`/placeholder handlers.

### 5.3 Sharing.tsx (428 → orchestrator + `src/components/sharing/*`)
Sub-components:
- `CollaboratorTable.tsx` — table of collaborators with role + remove.
- `InviteDialog.tsx` — email + role invite form.
- `ShareLinkCard.tsx` — public link + copy + regenerate.
- `RoleBadge.tsx` — role → French label + color (reuse `ROLE_LABELS`/`ROLE_COLORS`).
- `AccessSettingsForm.tsx` — link/access toggles.
**New feature wiring (the main Wave 1 feature work):** replace raw `api.*` calls with
`useInvite`, `useGenerateLink`, `useResendInvite`, `useUpdateCollaborator`,
`useRemoveCollaborator`, `useUpdateShareSettings`. Verify each against its backend
route before wiring. Errors → `notify`.

### 5.4 OnboardingWizard.tsx (612 → orchestrator + `src/components/onboarding/*`)
Sub-components:
- `WizardStepper.tsx` — step indicators (extract `STEPS.map`).
- `ContextStep.tsx` — description/objectives/scope textareas.
- `FunctionalReqStep.tsx` — functional requirement editor.
- `NonFunctionalReqStep.tsx` — NFR presets + custom.
- `ActorsStep.tsx` — actor chips + custom-add.
- `ReviewStep.tsx` — summary.
- `ActorModal.tsx` — custom actor input (already present).
Hooks already wired (prior session): `useRequirements`, `useAddRequirement`,
`useGenerateDocument`. Keep `api.get` only for raw project load + `api.patch` brief
(no hook exists yet — note as a follow-up `usePatchProject`).

### 5.5 DocumentLibrary.tsx (381 → orchestrator + `src/components/library/*`)
Sub-components:
- `LibraryFilters.tsx` — search + department filter + grid/list toggle.
- `DocumentCard.tsx` / `DocumentListRow.tsx` — one document presentation each.
- `LibraryGrid.tsx` / `LibraryList.tsx` — layout variants.
Hooks: `useDocuments` (already used). Ensure pagination uses `safePage` (fixed prior
session). French labels preserved.

### 5.6 WorkspaceDashboard.tsx (362 → orchestrator + `src/components/dashboard/*`)
Sub-components:
- `GenerateHero.tsx` — prompt input + generate.
- `ProjectsStrip.tsx` — active projects (already added; extract).
- `DocumentsGrid.tsx` — recent documents.
- `ActivityFeed.tsx` — collaboration activity (extract `mapActivityItem`).
- `AgentStatusPanel.tsx` — orchestrator agent panel.
Hooks already wired: `useDocuments`, `useProjects`, `useActivity`, `useCreateProject`,
`useAgents`.

### 5.7 TemplateGallery.tsx (192 → orchestrator + `src/components/templates/*`)
Sub-components:
- `TemplateFilters.tsx` — category filter.
- `TemplateCard.tsx` — one template.
- `TemplateGrid.tsx` — layout.
Hooks: `useTemplates`, `useCreateDocumentFromTemplate`, `useGenerateDocument` (already
used). Remove `alert()` placeholders; replace with `notify` or working handlers.

## 6. Waves 2–6 (scoped, detailed at execution time)

- **Wave 2 — Collaboration:** Add `CommentThread` sub-component in
  `src/components/editor/` and `src/components/sharing/` wired to
  `useComments`/`useAddComment`/`useResolveComment`. Backend `/documents/:id/comments`
  and `/comments` exist. Polish `ActivityFeed`.
- **Wave 3 — Admin & agents:** Settings gets `AgentToolConfig` panel using
  `useAgentTools`/`useConnectTool`/`useDisconnectTool`/`useTestAgent`/`useExportAgentConfig`.
  Infrastructure keeps its improved loading (prior session) but extracts
  `ServiceCard`, `LogStream`, `HealthMeter`.
- **Wave 4 — Validation & export:** ValidatePortal uses `useValidationView`; ExportPreview
  fixes `FORMAT_LABEL_TO_EXPORT` (LaTeX→.tex, MD→.md) and extracts `FormatSelector`,
  `ExportProgress`. Assistant extracts `ChatPanel`, `SuggestionCard`; keeps `notify`
  error path.
- **Wave 5 — Auth:** LoginPage/SignupPage extract `AuthForm`, `OAuthButtons`,
  `FieldError`; replace `alert()` with `notify` + inline field errors; French labels.
- **Wave 6 — Polish & perf:** Audit every file for non-token colors/raw hex; consolidate
  French labels; add `React.lazy` + `Suspense` per route in `router.tsx` to cut the
  1.58 MB main chunk; verify build.

## 7. Cross-cutting rules
- No `alert()` or `prompt()` anywhere (replaced in prior sessions; enforce in review).
- No hardcoded loading toggles (`{false ? ... : ...}`).
- Every `catch` shows `notify({ type: 'error', ... })` — no silent `catch {}`.
- French UI labels throughout; English only in code/comments.
- `tsc --noEmit` + `vite build` green after each wave.

## 8. Non-goals / risks
- **Non-goals:** new backend endpoints (we only consume existing ones); new tests
  (optional); changing the data model.
- **Risk:** some unused hooks may point at backend routes that 500/403 in the current
  local setup (seen earlier: `/api/admin/*` 403, `/api/projects` 500). Wire hooks
  defensively — surface backend errors via `notify`, don't assume success.
- **Risk:** `useProject` returns a document-mapped shape (not raw project) — avoid for
  raw-project needs; prefer `api.get` where the hook transforms unexpectedly.
- **Risk:** no `useDiagrams` (list) hook exists; Editor diagram listing uses local
  state + `useDiagram(id)` per created diagram. If a list endpoint is needed later,
  add a `useDiagrams(projectId)` hook.
