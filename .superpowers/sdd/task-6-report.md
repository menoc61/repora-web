# Task 6 Report — Sharing: extract sub-components (structural only)

## Status: DONE_WITH_CONCERNS

## Summary
Decomposed `src/pages/Sharing.tsx` (428 lines) into `src/components/sharing/` sub-components as a purely structural refactor. No behavior, hook wiring, JSX, styles, or French labels were changed.

## Files created (`src/components/sharing/`)
- `types.ts` — `ROLES`, `ROLE_MAP`, `CollaboratorRow`, `COLLABORATORS`, `ROLE_STYLES`, `toRow` (all exported).
- `Toggle.tsx` — moved local `Toggle` (was 421-428).
- `InviteForm.tsx` — "Inviter des collaborateurs" section, controlled via props.
- `CollaboratorList.tsx` — "Collaborateurs actuels" + per-row dropdown + "Modifier le role" edit modal. Owns `openDropdownIndex` + `editRoleOpen` local state. Calls back with emails (`onResend(email)`, `onEditRole(email, role)`, `onRemove(email)`).
- `SecuritySettings.tsx` — 3-toggle block using `Toggle`.
- `ExternalAccessPanel.tsx` — "Acces externe" section, embeds `SecuritySettings`.
- `AuditPanel.tsx` — "Audit souverain" section.
- `AccessLogModal.tsx` — access-logs modal (renders null when closed).
- `SharingView.tsx` — owns `docId`, all hooks, all remaining state, all handlers; composes sections + modal + compliance footer.
- `index.ts` — barrel (default `SharingView`, `./types`, `Toggle`).

## Files modified
- `src/pages/Sharing.tsx` — thin wrapper returning `<SharingView docId={docId} />`. Dropped dead `emailRef`, unused `useRef`/`Link` imports, and the local `Toggle` definition.

## Verification
- `npx tsc --noEmit` → clean (no errors).
- `npx vite build` → success ("✓ built in 9.54s"). Only a non-fatal >500 kB chunk-size warning (pre-existing, unrelated to this change).

## Compliance with constraints
- DESIGN.md / Tailwind tokens preserved verbatim (`bg-primary-container`, `text-ai-vibrant`, spacing `gutter`/`margin-desktop`, etc.).
- All French labels preserved exactly (no translation).
- Relative imports within `sharing/` consistent (`../Icon`, `../ui/*`, `../../hooks/useQueries`, `../../schemas`).
- All `useX().mutate(...)` calls untouched — mutation logic identical, only handler signatures adapted from `(rowIndex)` to `(email)` since the list component now resolves the row itself.
- No new tests; verification = tsc + vite build.

## Concerns
1. **Minor behavior deviation in disabled-state granularity:** the brief's `CollaboratorList` prop contract exposes a single `updatePending` flag. The original "Retirer" button was disabled by `removeCollabMutation.isPending`, whereas now it uses `updateCollabMutation.isPending` (the provided `updatePending`). The edit-role button already used `updateCollabMutation.isPending`. This is faithful to the documented props but slightly differs on the remove button's pending gating. Functionally both mutations are independent; the remove button may now disable during an unrelated role-update. Low impact.
2. **Owner guard moved to render time:** original `handleEditRole`/`handleRemove` re-checked `row.role !== 'Proprietaire'`; the extracted component only renders the dropdown/buttons inside the `c.role === 'Proprietaire' ? null : (...)` branch, so owners can never trigger them. Equivalent safety.

## Commit
- `42b540b` refactor(sharing): decompose into sub-components

## Build summary
tsc clean; vite build succeeds (only a pre-existing >500kB chunk-size warning).
