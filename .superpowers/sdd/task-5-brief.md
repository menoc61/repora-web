# Task 5: VersionHistory — extract sub-components

## Current state
`src/pages/VersionHistory.tsx` is a 363-line 3-pane page: left version list, middle comparison panel, right "Orchestrateur IA" panel + retention modal. It already uses `useAcceptChanges` (prior analysis replaced the broken `useApplyPatch`). State/handlers live in the default `VersionHistory()` component.

## Files
Create under `src/components/version-history/`:
- `types.ts` — `Version` interface (lines 7-20), `VERSIONS` fallback (22-27), `ROLE_LABELS` (29-35), `ROLE_COLORS` (37-43).
- `VersionCard.tsx` — the left-list item card (lines 134-179, including the "Hier" divider at 135-141). Props: `{ version: Version; active: boolean; selected: boolean; onSelect: () => void }`.
- `RestoreButton.tsx` — the "Restaurer cette version" outline button (lines 201-203). Props: `{ pending: boolean; disabled: boolean; onRestore: () => void }`.
- `AcceptChangesBar.tsx` — the entire right "Orchestrateur IA" panel (lines 281-340: Legal Scout card + Apply suggestion button + active collaborators + retention info). Props: `{ selectedVersion: Version | null; acceptPending: boolean; collaborators: any[]; collabsLoading: boolean; onApplySuggestion: () => void; onManageRetention: () => void }`.
- `DiffViewer.tsx` — the middle comparison panel shown when a version is selected (lines 189-257: sticky header with restore/accept/close + restore-success state + diff content). Props: `{ version: Version; versionsData: any; restoreSuccess: boolean; restorePending: boolean; acceptPending: boolean; onRestore: () => void; onAccept: () => void; onClose: () => void }`. It composes `RestoreButton`.
- `VersionHistoryView.tsx` — the main 3-pane container. Owns `docId` + all hooks (`useVersions`, `useCollaborators`, `useRestoreVersion`, `useSaveDocument`, `useAcceptChanges`) + state (`showRetention`, `retentionDays`, `selectedVersion`, `restoreSuccess`) + all handlers. Renders the left list (mapping `VersionCard`), `DiffViewer` (middle), `AcceptChangesBar` (right), and the retention modal (keep inline — small). Props: `{ docId: string | undefined }`.
- `index.ts` — barrel re-exporting `VersionHistoryView` (and `./types` if helpful).

Modify: `src/pages/VersionHistory.tsx` — replace body with:
```tsx
import VersionHistoryView from '../components/version-history'
export default function VersionHistory() {
  const search = useSearch({ from: '/history' })
  const docId = search.id
  return <VersionHistoryView docId={docId} />
}
```
Remove now-unused imports/hooks/state/handlers from the page. Remove the dead `useNavigate` (line 2 import + line 57 `const navigate = useNavigate()`) if tsc confirms unused.

## Steps
- [ ] **Step1:** Create `types.ts` with the shared `Version` interface, `VERSIONS`, `ROLE_LABELS`, `ROLE_COLORS`.
- [ ] **Step2:** Create `VersionCard.tsx`, `RestoreButton.tsx`, `AcceptChangesBar.tsx`, `DiffViewer.tsx` with the EXACT JSX/styles/labels from the source lines cited. Preserve all French labels verbatim.
- [ ] **Step3:** Create `VersionHistoryView.tsx` owning hooks/state/handlers; compose the panes; keep retention modal inline.
- [ ] **Step4:** Create `index.ts` barrel.
- [ ] **Step5:** Slim `VersionHistory.tsx` to the thin wrapper above; remove dead `useNavigate`.
- [ ] **Step6:** Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (select/restore/accept/apply-suggestion/retention/collaborators).
- [ ] **Step7:** Commit — `git add src/components/version-history src/pages/VersionHistory.tsx && git commit -m "refactor(version-history): decompose into sub-components"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly (no translation).
- No new tests; verification = tsc + vite build.
- Keep relative imports within `version-history/` consistent.
- Behavior preserved exactly.
- Do NOT change the `useAcceptChanges` wiring (already correct).
