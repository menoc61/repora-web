# Task 6: Sharing — extract sub-components (structural only)

## Current state
`src/pages/Sharing.tsx` (428 lines) — sharing/access-control page. Hooks are ALREADY wired (`useCollaborators`, `useInvite`, `useResendInvite`, `useGenerateLink`, `useUpdateCollaborator`, `useRemoveCollaborator`, `useUpdateShareSettings`, `useAccessLogs`). This task is PURELY structural decomposition — preserve all wiring, JSX, styles, French labels, behavior. Also present: a local `Toggle` component (lines 421-428) and a dead `emailRef` (line 97, unused).

## Files
Create under `src/components/sharing/`:
- `types.ts` — `CollaboratorRow` interface (34-43), `ROLES` (25), `ROLE_MAP` (27-32), `ROLE_STYLES` (52-58), `COLLABORATORS` (45-50), `toRow(c)` (60-72). Export all.
- `Toggle.tsx` — move the local `Toggle` (421-428). Props `{ checked: boolean; onChange: () => void }`.
- `InviteForm.tsx` — the "Inviter des collaborateurs" section (182-226). Controlled: props `{ email: string; role: string; onEmailChange: (v: string) => void; onRoleChange: (v: string) => void; onSend: () => void; sending: boolean }`.
- `CollaboratorList.tsx` — "Collaborateurs actuels" section (228-282) plus its per-row dropdown menu (254-277) AND the "Modifier le role" edit modal (380-402). Owns local `openDropdownIndex` + `editRoleOpen` state. Props: `{ rows: CollaboratorRow[]; resendPending: boolean; resendVariables: any; onResend: (email: string) => void; onEditRole: (email: string, newRole: string) => void; onRemove: (email: string) => void; updatePending: boolean }`. Imports `ROLES`, `ROLE_MAP` from `./types`.
- `ExternalAccessPanel.tsx` — the "Acces externe" section (286-334). Props: `{ docId: string | undefined; generatedLink: string | null; copied: boolean; onGenerate: () => void; generating: boolean; onCopy: () => void; securityToggles: {passwordProtect:boolean; expiration:boolean; nda:boolean}; onSecurityToggle: (k) => void }`. Renders `<SecuritySettings toggles={securityToggles} onToggle={onSecurityToggle} />` inside (line 318-332 region).
- `SecuritySettings.tsx` — the 3-toggle block (319-332). Props `{ toggles; onToggle }`. Uses `Toggle` from `./Toggle`.
- `AuditPanel.tsx` — the "Audit souverain" section (336-352). Props `{ onViewLogs: () => void }` (the "Voir les journaux d'acces" button).
- `AccessLogModal.tsx` — the access-logs modal (356-378). Props `{ open: boolean; logs: any; onClose: () => void }`.
- `SharingView.tsx` — owns `docId` + all hooks + remaining state (`email`, `role`, `generatedLink`, `copied`, `showAccessLogs`, `securityToggles`) + all handlers (`handleSendInvite`, `handleResend`, `handleGenerateLink`, `handleCopyLink`, `handleEditRole`, `handleRemove`, `handleSecurityToggle`, `handleViewAccessLogs`). Renders: back link (170-173), header (175-178), the grid (InviteForm + CollaboratorList on left col, ExternalAccessPanel + AuditPanel on right col, 180-354), `<AccessLogModal open={showAccessLogs} .../>`, the compliance footer (404-415). Props `{ docId: string | undefined }`.
- `index.ts` — barrel re-exporting `SharingView` (and `./types`, `Toggle` if helpful).

Modify: `src/pages/Sharing.tsx` → thin wrapper:
```tsx
import { useSearch } from '@tanstack/react-router'
import SharingView from '../components/sharing'
export default function Sharing() {
  const search = useSearch({ from: '/sharing' })
  const docId = search.id
  return <SharingView docId={docId} />
}
```
Drop dead `emailRef` and unused imports (`Link`, `useRef`). Remove `Toggle` definition (moved).

## Steps
- [ ] Step1: `types.ts`, `Toggle.tsx`.
- [ ] Step2: `InviteForm`, `CollaboratorList` (with dropdown + edit-role modal), `ExternalAccessPanel` (embeds SecuritySettings), `SecuritySettings`, `AuditPanel`, `AccessLogModal` — exact JSX/styles/labels.
- [ ] Step3: `SharingView.tsx` owning hooks/state/handlers; compose all + footer.
- [ ] Step4: `index.ts` barrel.
- [ ] Step5: Slim `Sharing.tsx` to wrapper; drop dead `emailRef`/imports.
- [ ] Step6: Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (invite/resend/generate-link/copy/role-edit/remove/security-toggles/access-logs).
- [ ] Step7: Commit `git add src/components/sharing src/pages/Sharing.tsx && git commit -m "refactor(sharing): decompose into sub-components"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly (do NOT translate).
- No new tests; verification = tsc + vite build.
- Keep relative imports within `sharing/` consistent.
- Behavior + hook wiring preserved exactly. Do not touch the mutation calls.
