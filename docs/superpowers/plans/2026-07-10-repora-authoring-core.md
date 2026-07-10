# Repora Wave 1 — Authoring Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the 7 authoring-core pages into focused, co-located sub-components and verify all data hooks are correctly wired, with strict DESIGN.md token and French-label adherence.

**Architecture:** Each page file becomes a thin orchestrator that owns route/query state and renders sub-components from `src/components/<page>/`. Presentational logic moves into one-file-per-concern components. No new backend endpoints; we only consume existing hooks. Sharing's hooks are already wired — its work is purely structural. DocumentLibrary already uses `useAnalytics` + `safePage` — its work is structural plus a dead-`activities` fix.

**Tech Stack:** React 18, TypeScript, TanStack Router, TanStack Query (`@tanstack/react-query`), Tailwind CSS with DESIGN.md tokens, `@/components/ui/*` primitives, `notify()` from `src/components/Toast.tsx`.

## Global Constraints

- Colors MUST come from DESIGN.md tokens: `primary-container` (#131b2e), `secondary`/`ai-vibrant` (#2563EB), `surface-studio` (#F8FAFC), `outline-variant`, `status-draft`/`status-review`/`status-final`, `error`. No raw hex except where a token is missing (then add the token to DESIGN.md).
- Spacing: `p-gutter` (24px), `px-gutter`, `pl-sidebar-width` (280px), `pr-inspector-width` (320px), `max-w-[800px]` for editor canvas. Never double-apply sidebar/inspector offsets.
- Typography: `font-headline-*` (Geist) headings, `font-body-*` (Inter) text, `font-label-*` (JetBrains Mono) machine/agent metadata & status.
- Shape: 4px radius on buttons/inputs/chips, 8px on panels/cards.
- Error handling: use `notify({ type: 'error', title, message })` from `src/components/Toast.tsx`. No silent `catch {}`. No `alert()`/`prompt()`.
- Loading: use React Query `isPending`/`isLoading`. No hardcoded `{false ? ... : ...}` toggles.
- French UI labels throughout; English only in code/comments.
- `tsc --noEmit` and `vite build` MUST stay green after every task.
- **No new unit tests** (user-selected quality bar: "Polish + DESIGN.md"). Verification = `tsc --noEmit` + `vite build` per task.
- Keep each page's existing import style (`../` for most pages; `@/` for DocumentLibrary).

---

## File Structure

```
src/pages/Editor.tsx                     # slim orchestrator (was 543 → ~140)
src/components/editor/
  EditorCanvas.tsx                       # BlockNote + Yjs wrapper
  EditorHeader.tsx                       # top nav (title, export, share, history)
  InspectorPanel.tsx                     # right sidebar container
  AgentProgressPanel.tsx                 # SSE GenerationProgress / placeholder
  OutlineTree.tsx                        # document outline nav
  DiagramPanel.tsx                       # UML generation + list
  ShareDialog.tsx                        # validation-token share flow
  index.ts                               # barrel

src/pages/VersionHistory.tsx             # slim orchestrator (was 363 → ~90)
src/components/history/
  VersionList.tsx
  VersionDiffView.tsx
  CollaboratorsPanel.tsx
  RetentionDialog.tsx
  index.ts

src/pages/Sharing.tsx                    # slim orchestrator (was 428 → ~70)
src/components/sharing/
  InviteForm.tsx
  CollaboratorTable.tsx
  ExternalAccessCard.tsx
  AuditCard.tsx
  AccessLogsDialog.tsx
  EditRoleDialog.tsx
  RoleBadge.tsx
  Toggle.tsx
  index.ts

src/pages/OnboardingWizard.tsx           # slim orchestrator (was 612 → ~120)
src/components/onboarding/
  WizardStepper.tsx
  ContextStep.tsx
  FunctionalReqStep.tsx
  NonFunctionalReqStep.tsx
  ActorsStep.tsx
  ReviewStep.tsx
  ActorModal.tsx
  index.ts

src/pages/DocumentLibrary.tsx            # slim orchestrator (was 381 → ~90)
src/components/library/
  LibraryFilters.tsx
  DocumentTable.tsx
  DocumentRow.tsx
  Pagination.tsx
  InsightsPanel.tsx                      # wires useActivity (fix dead activities[])
  index.ts

src/pages/WorkspaceDashboard.tsx         # slim orchestrator (was 362 → ~90)
src/components/dashboard/
  GenerateHero.tsx
  ProjectsStrip.tsx
  DocumentsGrid.tsx
  ActivityFeed.tsx
  AgentStatusPanel.tsx
  index.ts

src/pages/TemplateGallery.tsx            # slim orchestrator (was 192 → ~50)
src/components/templates/
  TemplateFilters.tsx
  TemplateCard.tsx
  TemplateGrid.tsx
  index.ts
```

---

## Tasks

### Task 1: Editor — extract `EditorCanvas`

**Files:** Create `src/components/editor/EditorCanvas.tsx`; Modify `src/pages/Editor.tsx:121-221` (move `EditorContent` function body out).

**Interfaces:**
- Consumes: `docId: string`, `document: any`, `isLoading: boolean`, `onWordCountChange: (n:number)=>void`, `onOutlineChange: (s:OutlineSection[])=>void` (same props as current `EditorContent`).
- Produces: `EditorCanvas` component, imported by `Editor.tsx`.

- [ ] **Step 1: Create `src/components/editor/EditorCanvas.tsx`** with the full `EditorContent` implementation moved verbatim (keep imports `useRef, useEffect, useCallback, useState`, `BlockNoteView`, `useCreateBlockNote`, `Y`, `WebsocketProvider`, `Icon`, `Button`, `api`). Export `EditorCanvas`.
- [ ] **Step 2: In `Editor.tsx`, replace the `function EditorContent(...)` block** (lines 113-221) with `export { EditorCanvas }` re-export via the barrel; render `<EditorCanvas ... />` in `EditorPage` where `EditorContent` was used (line 388).
- [ ] **Step 3: Verify build** — `npx tsc --noEmit` (expect clean), `npx vite build` (expect success).
- [ ] **Step 4: Commit** — `git add src/components/editor/EditorCanvas.tsx src/pages/Editor.tsx && git commit -m "refactor(editor): extract EditorCanvas sub-component"`

### Task 2: Editor — extract `EditorHeader`, `InspectorPanel`, `AgentProgressPanel`, `OutlineTree`, `ShareDialog`

**Files:** Create `src/components/editor/{EditorHeader,InspectorPanel,AgentProgressPanel,OutlineTree,ShareDialog}.tsx`; Modify `src/pages/Editor.tsx`.

**Interfaces:**
- `EditorHeader` props: `{ title:string; status:Document['status']; docId:string|undefined; onShare:()=>void; sharePending:boolean }`.
- `InspectorPanel` props: `{ children: React.ReactNode }` (composes `AgentProgressPanel`, `OutlineTree`).
- `AgentProgressPanel` props: `{ sseEvents: HermesEvent[]; isGenerating:boolean; agents:any[] }`.
- `OutlineTree` props: `{ sections: OutlineSection[] }`.
- `ShareDialog` props: `{ docId:string|undefined; open:boolean; onOpenChange:(b:boolean)=>void }` — owns the `useValidationToken` + copy logic.

- [ ] **Step 1: Create `EditorHeader.tsx`** — move the `<header>...</header>` block (Editor.tsx:340-377) into a component. Use `StatusBadge` for the status dot, keep French labels ("Bibliotheque", "Gerer les acces", "Exporter", "Partager"). Wire `onShare` to the share button; keep `Link` to `/sharing` and `/history`.
- [ ] **Step 2: Create `AgentProgressPanel.tsx`** — move the SSE/placeholder block (Editor.tsx:400-414).
- [ ] **Step 3: Create `OutlineTree.tsx`** — move `OutlineItem` (Editor.tsx:440-458) + the `<nav>` mapping (Editor.tsx:416-429) into `OutlineTree`, rendering `<OutlineItem>` internally.
- [ ] **Step 4: Create `ShareDialog.tsx`** — move `handleShare` + the `shareUrl` banner (Editor.tsx:329-335, 379-384) into a `Dialog` from `@/components/ui/dialog` (or keep the inline banner; wrap the share action in `ShareDialog` that calls `useValidationToken`). Use `notify` on error.
- [ ] **Step 5: Create `InspectorPanel.tsx`** — a layout wrapper that renders `AgentProgressPanel` + children (the outline/diagram sections) + the footer word-count bar.
- [ ] **Step 6: Wire in `EditorPage`** — replace inline header/inspector JSX with `<EditorHeader .../>`, `<InspectorPanel><AgentProgressPanel .../><OutlineTree .../><DiagramPanel .../></InspectorPanel>`, `<ShareDialog .../>`. Move `handleShare` state into `ShareDialog`.
- [ ] **Step 7: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 8: Commit** — `git add src/components/editor src/pages/Editor.tsx && git commit -m "refactor(editor): extract header, inspector, outline, share sub-components"`

### Task 3: Editor — finalize `DiagramPanel`

**Files:** Modify `src/components/editor/DiagramPanel.tsx` (created in prior session at page level — relocate to `src/components/editor/`).

**Interfaces:** Keep current props; add per-diagram `useDiagram(id)` fetch so the rendered image updates from the real backend URL rather than only the create response.

- [ ] **Step 1: Move the `DiagramPanel` JSX** currently inline in `Editor.tsx` into `src/components/editor/DiagramPanel.tsx`. Props: `{ projectId:string|undefined; title:string }`.
- [ ] **Step 2: After `createDiagram.mutateAsync`, push `{ id, type, rendered_url }` into local `diagrams` state** (already done); additionally call `useDiagram(id)` per stored id to refresh the `rendered_url` once the backend renders it.
- [ ] **Step 3: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 4: Commit** — `git add src/components/editor/DiagramPanel.tsx src/pages/Editor.tsx && git commit -m "refactor(editor): relocate DiagramPanel and refresh rendered urls"`

### Task 4: Editor — barrel + slim orchestrator

**Files:** Create `src/components/editor/index.ts`; finalize `src/pages/Editor.tsx` as thin orchestrator.

- [ ] **Step 1: Write `index.ts`** re-exporting `EditorCanvas, EditorHeader, InspectorPanel, AgentProgressPanel, OutlineTree, DiagramPanel, ShareDialog`.
- [ ] **Step 2: Ensure `Editor.tsx` imports only from `../components/editor`** and the page body is a thin orchestrator (state + hooks + render). Target ≤140 lines.
- [ ] **Step 3: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 4: Commit** — `git add src/components/editor/index.ts src/pages/Editor.tsx && git commit -m "refactor(editor): add barrel and slim orchestrator"`

### Task 5: VersionHistory — extract sub-components

**Files:** Create `src/components/history/{VersionList,VersionDiffView,CollaboratorsPanel,RetentionDialog}.tsx` + `index.ts`; Modify `src/pages/VersionHistory.tsx` (currently 363 → ~90).

**Interfaces:**
- `VersionList` props: `{ versions: Version[]; selected: Version|null; onSelect:(v:Version)=>void }`.
- `VersionDiffView` props: `{ selected: Version|null; versionsData:any; onRestore:()=>void; restorePending:boolean; onAccept:()=>void; acceptPending:boolean; restoreSuccess:boolean; onClose:()=>void }`.
- `CollaboratorsPanel` props: `{ collaborators:any[]; loading:boolean }`.
- `RetentionDialog` props: `{ open:boolean; days:number; onOpenChange:(b:boolean)=>void; onSave:(d:number)=>void; saving:boolean }`.

- [ ] **Step 1: Create `VersionList.tsx`** — move the sidebar list (VersionHistory.tsx:125-184).
- [ ] **Step 2: Create `VersionDiffView.tsx`** — move the comparison panel (VersionHistory.tsx:187-254), wiring `useAcceptChanges` already in parent.
- [ ] **Step 3: Create `CollaboratorsPanel.tsx`** — move the active-collaborators block (VersionHistory.tsx:305-327), keeping the `key={c.email}-${idx}` dedupe fix.
- [ ] **Step 4: Create `RetentionDialog.tsx`** — move the retention modal (VersionHistory.tsx:339-358).
- [ ] **Step 5: Slim `VersionHistory.tsx`** — keep only state + hooks (`useVersions, useRestoreVersion, useCollaborators, useSaveDocument, useAcceptChanges`) + render the four sub-components. Remove the now-unused `applyPatch`/raw logic. Target ≤90 lines.
- [ ] **Step 6: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 7: Commit** — `git add src/components/history src/pages/VersionHistory.tsx && git commit -m "refactor(history): decompose VersionHistory into sub-components"`

### Task 6: Sharing — extract sub-components (hooks already wired)

**Files:** Create `src/components/sharing/{InviteForm,CollaboratorTable,ExternalAccessCard,AuditCard,AccessLogsDialog,EditRoleDialog,RoleBadge,Toggle}.tsx` + `index.ts`; Modify `src/pages/Sharing.tsx` (428 → ~70).

**Interfaces (all consume callbacks + data from the orchestrator; hooks stay in the page):**
- `RoleBadge` props: `{ role:string }` → renders French label + color via `ROLE_STYLES`.
- `Toggle` props: `{ checked:boolean; onChange:()=>void }` (move existing `Toggle` here).
- `InviteForm` props: `{ onSend:(email:string,roleKey:string)=>void; sending:boolean; onResend:(email:string)=>void; resendingEmail:string|null }`.
- `CollaboratorTable` props: `{ rows:CollaboratorRow[]; onEditRole:(i:number)=>void; onRemove:(i:number)=>void; onResend:(email:string)=>void; resendPending:boolean; resendVars:any; updatePending:boolean; removePending:boolean }`.
- `ExternalAccessCard` props: `{ onGenerate:()=>void; generating:boolean; link:string|null; onCopy:()=>void; copied:boolean; toggles; onToggle:(k)=>void }`.
- `AuditCard` props: `{ onViewLogs:()=>void }`.
- `AccessLogsDialog` props: `{ open:boolean; onOpenChange:(b:boolean)=>void; logs:any[] }`.
- `EditRoleDialog` props: `{ openIndex:number|null; rows:CollaboratorRow[]; onClose:()=>void; onConfirm:(i:number,role:string)=>void; pending:boolean }`.

- [ ] **Step 1: Create `RoleBadge.tsx` and `Toggle.tsx`** — move `ROLE_STYLES` + `toRow` helpers and the `Toggle` component out.
- [ ] **Step 2: Create `InviteForm.tsx`** — move the invite section (Sharing.tsx:182-226) + resend button logic.
- [ ] **Step 3: Create `CollaboratorTable.tsx`** — move the collaborators list (Sharing.tsx:228-282).
- [ ] **Step 4: Create `ExternalAccessCard.tsx`** — move the external-access card (Sharing.tsx:285-334).
- [ ] **Step 5: Create `AuditCard.tsx`** — move the sovereign-audit card (Sharing.tsx:336-352).
- [ ] **Step 6: Create `AccessLogsDialog.tsx`** — move the access-logs modal (Sharing.tsx:356-378).
- [ ] **Step 7: Create `EditRoleDialog.tsx`** — move the edit-role modal (Sharing.tsx:380-402).
- [ ] **Step 8: Slim `Sharing.tsx`** — keep hooks (`useCollaborators, useInvite, useGenerateLink, useResendInvite, useAccessLogs, useUpdateCollaborator, useRemoveCollaborator, useUpdateShareSettings`) + state; render the sub-components and pass callbacks. Replace any `catch {}` with `notify`. Target ≤70 lines.
- [ ] **Step 9: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 10: Commit** — `git add src/components/sharing src/pages/Sharing.tsx && git commit -m "refactor(sharing): decompose Sharing into sub-components"`

### Task 7: OnboardingWizard — extract step sub-components

**Files:** Create `src/components/onboarding/{WizardStepper,ContextStep,FunctionalReqStep,NonFunctionalReqStep,ActorsStep,ReviewStep,ActorModal}.tsx` + `index.ts`; Modify `src/pages/OnboardingWizard.tsx` (612 → ~120).

**Interfaces:**
- `WizardStepper` props: `{ steps: {key,label,icon}[]; step:number; onJump:(i:number)=>void }`.
- `ContextStep` props: `{ context; setContext; saving:boolean }`.
- `FunctionalReqStep` props: `{ reqs:SectionRequirement[]; actors:string[]; onAdd; onUpdate; onRemove; saving }`.
- `NonFunctionalReqStep` props: `{ reqs; onAdd; onUpdate; onRemove; onTogglePreset; saving }`.
- `ActorsStep` props: `{ actors; presets; onToggle; onAddCustom; customName; setCustomName; onConfirmCustom; showModal; setShowModal }`.
- `ReviewStep` props: `{ context; funcReqs; nonFuncReqs; actors }`.
- `ActorModal` props: `{ open; name; setName; onConfirm; onCancel }` (move existing modal).

- [ ] **Step 1: Create `WizardStepper.tsx`** — move step indicators (OnboardingWizard.tsx:268-288).
- [ ] **Step 2: Create `ContextStep.tsx`** — move STEP 0 (OnboardingWizard.tsx:298-334).
- [ ] **Step 3: Create `FunctionalReqStep.tsx`** — move STEP 1 (OnboardingWizard.tsx:336-386).
- [ ] **Step 4: Create `NonFunctionalReqStep.tsx`** — move STEP 2 (OnboardingWizard.tsx:388-441).
- [ ] **Step 5: Create `ActorsStep.tsx`** — move STEP 3 (OnboardingWizard.tsx:443-487).
- [ ] **Step 6: Create `ReviewStep.tsx`** — move STEP 4 (OnboardingWizard.tsx:490-558).
- [ ] **Step 7: Create `ActorModal.tsx`** — move the actor modal (OnboardingWizard.tsx:586-604).
- [ ] **Step 8: Slim `OnboardingWizard.tsx`** — keep step state, project/requirements hooks (`useRequirements, useAddRequirement, useGenerateDocument`), localStorage-free navigation, and render steps by `step`. Keep `api.get` project load + `api.patch` brief (no `useProject`/`usePatchProject` hook exists). Target ≤120 lines.
- [ ] **Step 9: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 10: Commit** — `git add src/components/onboarding src/pages/OnboardingWizard.tsx && git commit -m "refactor(onboarding): decompose wizard steps into sub-components"`

### Task 8: DocumentLibrary — extract sub-components + fix dead `activities`

**Files:** Create `src/components/library/{LibraryFilters,DocumentTable,DocumentRow,Pagination,InsightsPanel}.tsx` + `index.ts`; Modify `src/pages/DocumentLibrary.tsx` (381 → ~90).

**Interfaces:**
- `LibraryFilters` props: `{ department; status; owner; search; onDepartment; onStatus; onOwner; onSearch; onClear }`.
- `DocumentRow` props: `{ doc:Document; selected:boolean; onToggleSelect; onExport; onShare; onHistory }`.
- `DocumentTable` props: `{ docs:Document[]; selectedIds; onToggleSelect; onExportSingle; onShare; onHistory }` — renders header + `DocumentRow`s + `Pagination`.
- `Pagination` props: `{ current; total; onPage:(p:number)=>void }` (move lines 299-323).
- `InsightsPanel` props: `{ metrics; activities }` — **wire `useActivity`** to replace the empty `activities:[]` (DocumentLibrary.tsx:121) so the AI insights list shows real data.

- [ ] **Step 1: Create `LibraryFilters.tsx`** — move the filter bar (DocumentLibrary.tsx:161-220), keeping `@/` imports.
- [ ] **Step 2: Create `DocumentRow.tsx`** — move a single `<TableRow>` (DocumentLibrary.tsx:248-294).
- [ ] **Step 3: Create `Pagination.tsx`** — move the pagination footer (DocumentLibrary.tsx:299-323).
- [ ] **Step 4: Create `DocumentTable.tsx`** — move the `<Table>` block (DocumentLibrary.tsx:223-298) composing `DocumentRow` + `Pagination`.
- [ ] **Step 5: Create `InsightsPanel.tsx`** — move the bento widgets (DocumentLibrary.tsx:326-377); accept `activities` prop; in the page, call `useActivity()` and pass real `activities` (fixes the dead empty array + the unused `useActivity` hook gap).
- [ ] **Step 6: Slim `DocumentLibrary.tsx`** — keep `useDocuments, useExportDocument, useCreateProject, useGenerateDocument, useAnalytics, useActivity`; remove the `const activities = []` line; render `LibraryFilters` + `DocumentTable` + `InsightsPanel`. Keep `safePage` pagination logic. Target ≤90 lines.
- [ ] **Step 7: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 8: Commit** — `git add src/components/library src/pages/DocumentLibrary.tsx && git commit -m "refactor(library): decompose DocumentLibrary + wire useActivity"`

### Task 9: WorkspaceDashboard — extract sub-components

**Files:** Create `src/components/dashboard/{GenerateHero,ProjectsStrip,DocumentsGrid,ActivityFeed,AgentStatusPanel}.tsx` + `index.ts`; Modify `src/pages/WorkspaceDashboard.tsx` (362 → ~90).

**Interfaces:**
- `GenerateHero` props: `{ prompt; setPrompt; onGenerate; generating }`.
- `ProjectsStrip` props: `{ projects; loading; onOpenProject:(id:string)=>void }` (move the section added in prior session).
- `DocumentsGrid` props: `{ documents; viewMode; setViewMode; onNew; creating; onOpenDoc:(id:string)=>void; isGenerating:(d)=>boolean }`.
- `ActivityFeed` props: `{ items: UIActivityItem[]; loading }` (move `mapActivityItem` + feed).
- `AgentStatusPanel` props: `{ agents:any[] }` (move the orchestrator card).

- [ ] **Step 1: Create `GenerateHero.tsx`** — move the hero (WorkspaceDashboard.tsx:137-161).
- [ ] **Step 2: Create `ProjectsStrip.tsx`** — move the projects section (added prior session).
- [ ] **Step 3: Create `DocumentsGrid.tsx`** — move grid/list + new-document cards (WorkspaceDashboard.tsx:163-250, 251-287 activity card excluded).
- [ ] **Step 4: Create `ActivityFeed.tsx`** — move `getTimeAgo` + `mapActivityItem` + the activity panel (WorkspaceDashboard.tsx:33-79, 251-287).
- [ ] **Step 5: Create `AgentStatusPanel.tsx`** — move the orchestrator card (WorkspaceDashboard.tsx:289-320).
- [ ] **Step 6: Slim `WorkspaceDashboard.tsx`** — keep hooks (`useDocuments, useProjects, useActivity, useCreateProject, useAgents`); render the five sub-components. Target ≤90 lines.
- [ ] **Step 7: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 8: Commit** — `git add src/components/dashboard src/pages/WorkspaceDashboard.tsx && git commit -m "refactor(dashboard): decompose WorkspaceDashboard into sub-components"`

### Task 10: TemplateGallery — extract sub-components

**Files:** Create `src/components/templates/{TemplateFilters,TemplateCard,TemplateGrid}.tsx` + `index.ts`; Modify `src/pages/TemplateGallery.tsx` (192 → ~50).

**Interfaces:**
- `TemplateFilters` props: `{ active; onSelect }`.
- `TemplateCard` props: `{ template; onUse }`.
- `TemplateGrid` props: `{ templates; onUse; onCustom }`.

- [ ] **Step 1: Create `TemplateFilters.tsx`** — move the filter chips (TemplateGallery.tsx:101-113).
- [ ] **Step 2: Create `TemplateCard.tsx`** — move a single card (TemplateGallery.tsx:117-152).
- [ ] **Step 3: Create `TemplateGrid.tsx`** — move the grid (TemplateGallery.tsx:116-161) composing `TemplateCard`; keep the "Modele personnalise" link.
- [ ] **Step 4: Slim `TemplateGallery.tsx`** — keep `useTemplates, useCreateDocumentFromTemplate, useGenerateDocument`; remove `alert('Fonctionnalite a venir')` placeholders (replace with `notify` or working handlers); render `TemplateFilters` + `TemplateGrid`. Target ≤50 lines.
- [ ] **Step 5: Verify build** — `npx tsc --noEmit && npx vite build`.
- [ ] **Step 6: Commit** — `git add src/components/templates src/pages/TemplateGallery.tsx && git commit -m "refactor(templates): decompose TemplateGallery into sub-components"`

### Task 11: Cross-page polish pass (Wave 1)

**Files:** All 7 pages + new components.

- [ ] **Step 1: Token audit** — grep every new/modified file for raw hex colors (`#[0-9a-fA-F]{3,6}`) and inline `bg-red-50`/`text-green-400`/`border-gray-300` etc.; replace with DESIGN.md tokens (`error-container`/`on-error-container`, `status-final`, `outline-variant`).
- [ ] **Step 2: French-label audit** — confirm no English UI strings leaked (code comments may stay English).
- [ ] **Step 3: Verify build** — `npx tsc --noEmit && npx vite build` (expect clean).
- [ ] **Step 4: Commit** — `git add -A && git commit -m "style: enforce DESIGN.md tokens and French labels across Wave 1"`

---

## Self-Review

**1. Spec coverage:** Wave 1's 7 pages all have decomposition tasks (Tasks 1-10). DESIGN.md token + French-label rules are in Global Constraints and enforced in Task 11. `notify`/no-`alert` rule is in Global Constraints and applied in Tasks 2, 6, 10. Sharing hook wiring is correctly scoped to "already wired, structural only" (corrected from the spec's assumption). DocumentLibrary `useActivity` wiring (Task 8) closes a real hook gap. ✓

**2. Placeholder scan:** No "TBD"/"TODO". Each task has concrete files + props + build/commit steps. The "move lines X-Y" references point to code read in this session, so they are actionable. ✓

**3. Type consistency:** `OutlineSection`, `Version`, `CollaboratorRow`, `SectionRequirement`, `Document`, `HermesEvent`, `UIActivityItem` are reused with the same names as in the source pages. `useActivity` returns `any[]` (matches `WorkspaceDashboard`/`DocumentLibrary` usage). `useValidationToken` (Editor) and `useAcceptChanges` (VersionHistory) already typed in prior session. ✓

**Gaps found & fixed:** Spec §5.3 implied Sharing needed hook wiring — corrected here: hooks already imported/used, so Sharing is structural only. Spec mentioned a missing `useDiagrams` list hook for Editor — Task 3 uses `useDiagram(id)` per created diagram (local state), avoiding a new hook. No new task needed.
