# Task 1: Editor — extract `EditorCanvas`

## Files
- Create: `src/components/editor/EditorCanvas.tsx`
- Modify: `src/pages/Editor.tsx` (move the `EditorContent` function, currently ~lines 113-221, into the new file)

## Interfaces
- Consumes (same props as current `EditorContent`): `docId: string`, `document: any`, `isLoading: boolean`, `onWordCountChange: (n: number) => void`, `onOutlineChange: (s: OutlineSection[]) => void`
- Produces: a default-exported (or named) `EditorCanvas` component, imported by `Editor.tsx` and rendered where `EditorContent` was used (inside `EditorPage`, the `<EditorContent ... />` at ~line 388).

## Steps
- [ ] **Step 1:** Create `src/components/editor/EditorCanvas.tsx` containing the full `EditorContent` implementation moved verbatim. Keep its existing imports: `useRef, useEffect, useCallback, useState` from 'react'; `BlockNoteViewRaw as BlockNoteView, useCreateBlockNote` from '@blocknote/react'; `Y` from 'yjs'; `WebsocketProvider` from 'y-websocket'; `Icon` from '../components/Icon'; `Button` from '../components/ui/button'; `api` from '../api/client'. It references `OutlineSection` (defined in Editor.tsx) and `sectionsToBlocks/blocksToSections/wordCountFromBlocks/extractOutlineFromBlocks/relativeTime` helpers — these live in Editor.tsx, so the new file must import them OR you must move the helpers it needs into the new file. The `EditorCanvas` only uses `sectionsToBlocks`, `blocksToSections`, `wordCountFromBlocks`, `extractOutlineFromBlocks` (the `relativeTime` helper is NOT used by EditorContent). Move those four helpers into `EditorCanvas.tsx` (they are pure functions with no external deps). Export `EditorCanvas`.
- [ ] **Step 2:** In `Editor.tsx`, remove the `EditorContent` function body and instead import `EditorCanvas` from `../components/editor/EditorCanvas` (or via the barrel once it exists — for this task just import the file directly). Replace `<EditorContent docId=... document=... isLoading=... onWordCountChange=... onOutlineChange=... />` with `<EditorCanvas ... />` using the same props.
- [ ] **Step 3:** Verify — `npx tsc --noEmit` (clean) and `npx vite build` (success).
- [ ] **Step 4:** Commit — `git add src/components/editor/EditorCanvas.tsx src/pages/Editor.tsx && git commit -m "refactor(editor): extract EditorCanvas sub-component"`

## Constraints (from Wave 1 spec)
- DESIGN.md tokens only for any styling you touch; French UI labels (none change here).
- No new tests (quality bar = build-clean). Verification = tsc + vite build.
- Keep existing import style in Editor.tsx (`../` relative).
- Do NOT change behavior — this is a pure file move. The editor must still load, auto-save, and emit word-count/outline changes exactly as before.
