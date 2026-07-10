# Task 1 Report — Extract `EditorCanvas`

**Status:** DONE
**Commit:** `2ba9d39` — refactor(editor): extract EditorCanvas sub-component

## Summary
Pure file move of the `EditorContent` function (BlockNote + Yjs editor wrapper) from
`src/pages/Editor.tsx` (lines ~113–222) into a new file `src/components/editor/EditorCanvas.tsx`.

## What was moved
- `EditorCanvas` component (renamed from `EditorContent`, same props, behavior unchanged:
  lazy Yjs doc/WebsocketProvider init, one-time population from sections, debounced (2000ms)
  auto-save via `useSaveDocument`, word-count + outline emission, save-timer cleanup).
- The four pure helpers it depends on: `sectionsToBlocks`, `blocksToSections`,
  `extractOutlineFromBlocks`, `wordCountFromBlocks`.
- The `OutlineSection` interface (moved into `EditorCanvas.tsx` and re-exported; `Editor.tsx`
  now imports it from the new file).
- The `COLLAB_WS_BASE` constant (only used by the editor).

## What stayed in Editor.tsx
- `relativeTime` helper (not used by the editor) — kept verbatim.
- The top-nav / inspector / outline rendering (`EditorPage`, `OutlineItem`).
- Import of `EditorCanvas` and `OutlineSection` from `../components/editor/EditorCanvas`.

## Import adjustments (required by new file location)
- `../../hooks/useQueries` for `useSaveDocument`.
- Removed from `Editor.tsx`: `useRef`, `useEffect`, `BlockNoteView/useCreateBlockNote`,
  `Y`, `WebsocketProvider`, `useSaveDocument` (no longer used directly).

## Note on brief's import list
The brief listed `Icon`, `Button`, and `api` as imports to keep. These were NOT actually
used by `EditorContent` (grep-confirmed), so they were omitted from `EditorCanvas.tsx` to
avoid dead imports. The editor behavior is unchanged.

## Verification
- `npx tsc --noEmit` → clean (exit 0, no errors).
- `npx vite build` → success (`✓ built in 8.69s`). Only a chunk-size *warning*
  (pre-existing, >500 kB index chunk) — non-blocking.
- No new tests (per quality bar = build-clean).

## Concerns
- None blocking. The `EditorCanvas.tsx` uses `any`-typed blocks and `(editor as any)._tiptapEditor`
  exactly as before; no type-safety improvement was in scope (pure move).
- `OutlineSection` now lives in `EditorCanvas.tsx`; if a future barrel/`index.ts` is added
  under `src/components/editor/`, the `Editor.tsx` import should be routed through it.
