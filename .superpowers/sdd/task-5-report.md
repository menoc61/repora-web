# Task 5 Report — VersionHistory decomposition

## Status
DONE_WITH_CONCERNS

## Summary
Decomposed `src/pages/VersionHistory.tsx` (363 lines) into 7 files under
`src/components/version-history/`. The page is now a thin wrapper. All JSX,
Tailwind classes, French labels, and behavior are preserved verbatim.

## Files created
- `src/components/version-history/types.ts` — `Version` interface, `VERSIONS`,
  `ROLE_LABELS`, `ROLE_COLORS` (moved untouched from source lines 7-43).
- `src/components/version-history/VersionCard.tsx` — left-list item card
  (incl. "Hier" divider). Props `{ version, active, selected, onSelect }`.
- `src/components/version-history/RestoreButton.tsx` — outline "Restaurer
  cette version" button. Props `{ pending, disabled, onRestore }`.
- `src/components/version-history/AcceptChangesBar.tsx` — right "Orchestrateur
  IA" panel. Props `{ selectedVersion, acceptPending, collaborators,
  collabsLoading, retentionDays, onApplySuggestion, onManageRetention }`.
- `src/components/version-history/DiffViewer.tsx` — middle comparison panel
  (sticky header + restore-success state + diff content). Props
  `{ version, versionsData, restoreSuccess, restorePending, acceptPending,
  onRestore, onAccept, onClose }`; composes `RestoreButton`.
- `src/components/version-history/VersionHistoryView.tsx` — main 3-pane
  container; owns `docId` + all hooks (`useVersions`, `useCollaborators`,
  `useRestoreVersion`, `useSaveDocument`, `useAcceptChanges`) + state
  (`showRetention`, `retentionDays`, `selectedVersion`, `restoreSuccess`) +
  all handlers; renders left list, middle div (DiffViewer or empty states),
  `AcceptChangesBar`, and the inline retention modal.
- `src/components/version-history/index.ts` — barrel, default-exports
  `VersionHistoryView` (so `import VersionHistoryView from '../components/version-history'`
  works as specified).

## Modified
- `src/pages/VersionHistory.tsx` — slimmed to:
  ```tsx
  import { useSearch } from '@tanstack/react-router'
  import VersionHistoryView from '../components/version-history'
  export default function VersionHistory() {
    const search = useSearch({ from: '/history' })
    const docId = search.id
    return <VersionHistoryView docId={docId} />
  }
  ```
  The dead `useNavigate` import + `const navigate = useNavigate()` were removed
  (confirmed unused by `tsc --noEmit`). All other now-unused imports/hooks/
  state/handlers removed.

## Verification
- `npx tsc --noEmit` → passes (no errors).
- `npx vite build` → ✓ built in 9.46s (2416 modules transformed). The only
  stderr output is the pre-existing >500 kB chunk-size warning (unrelated to
  this change; present on the original build too).

## Behaviors preserved (identical)
- Version list render / loading spinner / "Hier" divider / active/selected
  styling / AI/auto/user avatar logic / additions-removals chips.
- Select (skips ACTUEL), restore (mutate → restoreSuccess), accept changes
  (`useAcceptChanges` wiring unchanged), apply suggestion (same wiring),
  manage/save retention, close comparison.
- Middle empty states: loading / no-docId / no-selection.
- "Orchestrateur IA" panel: Legal Scout card, collaborators list + role
  colors/labels, retention info, "Gerer la retention" button.
- Inline retention modal (30/90/180/365 radios, Annuler/Enregistrer).
- All French strings and DESIGN.md tokens preserved exactly.

## Concerns
1. **Added `retentionDays` prop to `AcceptChangesBar`** (not in the brief's
   prop list). The retention-info line in the right panel
   ("...conservees pendant {retentionDays} jours...") references that state;
   omitting the prop would have broken behavior. The view passes its
   `retentionDays` state. All other listed props match the brief.
2. **`key` placement**: the original put `key={v.version}` on the wrapping div.
   In the new structure the key is passed to `<VersionCard key={v.version}>`
   — functionally identical React reconciliation.
3. The middle `<div className="flex-1 ...">` container (bg-white, scroll) is
   owned by `VersionHistoryView`, conditionally rendering `<DiffViewer>` vs the
   empty-state block, exactly mirroring the original single container.

## Commit
- `6343196` refactor(version-history): decompose into sub-components

## Build summary
tsc --noEmit clean; vite build succeeds (✓ built in 9.46s, 2416 modules).

## Report file
C:\Users\DTA_WORKSTATION\Downloads\REPORA WEB\repora-web\.superpowers\sdd\task-5-report.md
