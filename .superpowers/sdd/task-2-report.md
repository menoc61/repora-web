# Task 2 Report — Editor sub-component extraction

## Status
DONE_WITH_CONCERNS

## Summary
Extracted 5 components from `src/pages/Editor.tsx` into `src/components/editor/`
(`EditorHeader`, `InspectorPanel`, `AgentProgressPanel`, `OutlineTree`, `ShareDialog`),
and refactored `Editor.tsx` to compose them. The inline UML diagram section was left
in place and passed as children of `InspectorPanel` (Task 3 will extract it).

## Files created
- `src/components/editor/EditorHeader.tsx` — fixed top nav. Props: `title`, `status`,
  `docId`, `onShare`, `onExport`, `sharePending`. Keeps French labels, status-dot markup
  (`status-draft/review/final`), menu buttons (no-op), Export/`Gerer les acces`/Share/
  history links.
- `src/components/editor/InspectorPanel.tsx` — layout wrapper (`{ children }`), fixed right
  sidebar `bg-surface border-l border-outline-variant flex flex-col`.
- `src/components/editor/AgentProgressPanel.tsx` — SSE-driven `GenerationProgress` when
  `sseEvents.length > 0 || isGenerating`, else "Aucun agent actif" placeholder. Moved the
  `activeAgentCount` derivation in here.
- `src/components/editor/OutlineTree.tsx` — "Plan du document" `<nav>` + exported
  `OutlineItem` (moved from bottom of `Editor.tsx`).
- `src/components/editor/ShareDialog.tsx` — owns `useValidationToken(docId)`, the
  `handleShare` logic (mutate → `${origin}/validate/${token}` → copy to clipboard →
  `notify` on error), the share-url banner, and the `Dialog` itself. Driven by
  `open`/`onOpenChange`.

## Refactor of `Editor.tsx`
- Removed inline `<header>`, share banner, inspector top block, and `OutlineItem`.
- Removed `handleShare` and `shareUrl` state; added `shareOpen` / `sharePending` state.
- Renders `<EditorHeader ... onShare={() => setShareOpen(true)} onExport={handleExport}
  sharePending={sharePending} />`, `<ShareDialog ... onShareStateChange={setSharePending} />`,
  `<InspectorPanel>` containing `<AgentProgressPanel>`, the still-inline diagram section,
  and `<OutlineTree>`.
- `handleExport` stays in `EditorPage`. All `../` relative imports preserved.

## Behavior preserved
- Export → triggers `exportDoc.mutateAsync` + blob download (unchanged).
- Share → opens dialog, generates validation token, copies link, shows banner.
- Outline nav renders from `outlineSections`.
- SSE agent progress shows `GenerationProgress` while streaming.

## Verification
- `npx tsc --noEmit` — clean (no errors).
- `npx vite build` — succeeded (`✓ built in 8.53s`). Only warning: chunk > 500 kB
  (pre-existing, unrelated to this task).

## Concerns
1. **`sharePending` deviation from literal brief.** Brief step 6 states
   `sharePending={validationToken.isPending}`, but `useValidationToken` now lives inside
   `ShareDialog` (per the ShareDialog interface requirement). To keep the Share button
   disabled during generation, I lifted a `sharePending` boolean from `EditorPage` via an
   added optional `onShareStateChange(pending)` callback on `ShareDialog`. Behavior is
   identical; the prop list is a superset of the brief's interface.
2. **Settings button changed from `navigate({to:'/settings'})` to a `<Link to="/settings">`.**
   Functionally equivalent (both route to `/settings`); `useNavigate` was therefore dropped
   from `EditorPage`. `EditorHeader` no longer receives `navigate`.
3. **`notify` on share error** was added (brief explicitly mentioned `notify`); the original
   `handleShare` had no error toast. This is an additive behavior, not a regression.
4. Unused symbols already present in `Editor.tsx` (`relativeTime`, `AgentStatus` import)
   were left untouched to keep the diff focused.

## Commit
defce77 refactor(editor): extract header, inspector, outline, share sub-components
