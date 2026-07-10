# Task 2: Editor — extract `EditorHeader`, `InspectorPanel`, `AgentProgressPanel`, `OutlineTree`, `ShareDialog`

## Current state
After Task 1, `EditorCanvas.tsx` exists and `Editor.tsx` renders `<EditorCanvas .../>`. `Editor.tsx` still contains, inline: the top `<header>` nav (handleExport/handleShare buttons), the right-hand inspector panel (SSE `GenerationProgress` block + the document outline `<nav>` + `OutlineItem` + a diagram section that is still INLINE — leave that diagram section alone, Task 3 extracts it), and a `shareUrl` banner. The `handleShare` function (calls `useValidationToken`) and `handleExport` (calls `useExportDocument`) live in `EditorPage`.

## Files
Create under `src/components/editor/`:
- `EditorHeader.tsx`
- `InspectorPanel.tsx`
- `AgentProgressPanel.tsx`
- `OutlineTree.tsx`
- `ShareDialog.tsx`

Modify `src/pages/Editor.tsx`.

## Interfaces
- `EditorHeader` props: `{ title: string; status: Document['status']; docId: string | undefined; onShare: () => void; sharePending: boolean }`. Renders the fixed top nav: back-to-library link, title + status dot (use existing inline status dot markup with `status-draft/review/final` colors), the "Fichier/Edition/..." menu buttons (keep as no-op `onClick={() => {}}`), Export button (calls `onShare`? no — Export calls `handleExport`; Share calls `onShare`), Share button (calls `onShare`), history link, settings link. Keep French labels ("Bibliotheque", "Gerer les acces", "Exporter", "Partager").
- `InspectorPanel` props: `{ children: React.ReactNode }` — a layout wrapper: fixed right sidebar `bg-surface border-l border-outline-variant` with a flex-col; renders `children`. (The diagram section from Editor.tsx is passed as children for now; Task 3 will replace it with `<DiagramPanel/>`.)
- `AgentProgressPanel` props: `{ sseEvents: HermesEvent[]; isGenerating: boolean; agents: any[] }` — renders the SSE-driven `GenerationProgress` (import from `../components/GenerationProgress`) when `sseEvents.length > 0 || isGenerating`, else the placeholder "Aucun agent actif" block. Move the JSX from Editor.tsx's inspector top block.
- `OutlineTree` props: `{ sections: OutlineSection[] }` — renders the "Plan du document" `<nav>` mapping `sections` to `OutlineItem`; also export the `OutlineItem` component (currently defined at bottom of Editor.tsx) from this file.
- `ShareDialog` props: `{ docId: string | undefined; open: boolean; onOpenChange: (b: boolean) => void }` — owns `useValidationToken(docId)`, the `handleShare` logic (mutate, build `${origin}/validate/${token}`, copy to clipboard, `notify` on error), and the share-url banner. Use `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter` from `../components/ui/dialog` if convenient, OR keep the inline banner approach — either is fine, but it MUST be driven by `open`/`onOpenChange` and call `useValidationToken` internally.

## Steps
- [ ] **Step 1:** Create `EditorHeader.tsx` (move the `<header>...</header>` block; accept props above). Status dot uses existing markup.
- [ ] **Step 2:** Create `AgentProgressPanel.tsx`.
- [ ] **Step 3:** Create `OutlineTree.tsx` (move `OutlineItem` + the `<nav>` mapping).
- [ ] **Step 4:** Create `ShareDialog.tsx` (move `handleShare` + share banner; driven by `open`/`onOpenChange`).
- [ ] **Step 5:** Create `InspectorPanel.tsx` wrapper.
- [ ] **Step 6:** In `EditorPage` (`Editor.tsx`): remove the inline header/inspector/outline/share JSX and the `handleShare` function. Render `<EditorHeader title={title} status={status} docId={docId} onShare={() => setShareOpen(true)} sharePending={validationToken.isPending} />`, and `<InspectorPanel>` containing `<AgentProgressPanel sseEvents={sseEvents} isGenerating={isGenerating} agents={agents} />`, `<OutlineTree sections={outlineSections} />`, and the (still-inline) diagram section as children. Render `<ShareDialog docId={docId} open={shareOpen} onOpenChange={setShareOpen} />`. Add `const [shareOpen, setShareOpen] = useState(false)` and remove the old `shareUrl` banner state (ShareDialog owns it). `handleExport` stays in EditorPage (or move to EditorHeader as a prop callback — keep `handleExport` in EditorPage and pass `onExport={handleExport}` to EditorHeader).
- [ ] **Step 7:** Verify — `npx tsc --noEmit` (clean) and `npx vite build` (success). The editor must behave identically: export works, share opens dialog + copies link + shows banner, outline renders, SSE agent progress shows.
- [ ] **Step 8:** Commit — `git add src/components/editor src/pages/Editor.tsx && git commit -m "refactor(editor): extract header, inspector, outline, share sub-components"`

## Constraints
- DESIGN.md tokens; French UI labels preserved.
- No new tests; verification = tsc + vite build.
- Keep `../` relative imports.
- DO NOT modify the inline diagram section in this task (Task 3 extracts it). Pass it as children to `InspectorPanel`.
- No behavior change to export/share/outline/SSE.
