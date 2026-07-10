# Task 4: Editor — barrel + slim orchestrator

## Current state
After Tasks 1-3, `src/pages/Editor.tsx` renders a thin `EditorPage` that imports the extracted sub-components individually (Editor.tsx:12-18). There is no barrel. Also present: a dead `import { AgentStatus }` (Editor.tsx:11) and a dead `relativeTime` function (Editor.tsx:22-35) — flagged as unused in the Task 2 review.

## Files
Create: `src/components/editor/index.ts` (barrel).
Modify: `src/pages/Editor.tsx`.

## Interfaces
`src/components/editor/index.ts` exports (re-export from each file):
- `EditorCanvas` (from `./EditorCanvas`) and type `OutlineSection` (use `export { EditorCanvas, type OutlineSection } from './EditorCanvas'`)
- `EditorHeader` from `./EditorHeader`
- `InspectorPanel` from `./InspectorPanel`
- `AgentProgressPanel` from `./AgentProgressPanel`
- `OutlineTree` from `./OutlineTree`
- `ShareDialog` from `./ShareDialog`
- `DiagramPanel` from `./DiagramPanel`

## Steps
- [ ] **Step 1:** Create `src/components/editor/index.ts` with the re-exports above.
- [ ] **Step 2:** In `Editor.tsx`, replace the 7 individual sub-component imports (lines 12-18) with a single `import { EditorCanvas, type OutlineSection, EditorHeader, InspectorPanel, AgentProgressPanel, OutlineTree, ShareDialog, DiagramPanel } from '../components/editor'`. Keep `Icon` and hook imports separate.
- [ ] **Step 3:** Remove the dead `import { AgentStatus }` (line 11) and the `relativeTime` function (lines 22-35). (Verify they're unused by running tsc — if tsc errors, stop and report; do NOT force-remove a used symbol.)
- [ ] **Step 4:** Verify — `npx tsc --noEmit` and `npx vite build`. Editor must behave identically (export/share/canvas/inspector/outline/diagram).
- [ ] **Step 5:** Commit — `git add src/components/editor/index.ts src/pages/Editor.tsx && git commit -m "refactor(editor): add barrel and slim orchestrator imports"`

## Constraints
- DESIGN.md tokens; French labels unchanged (no UI changes in this task).
- No new tests; verification = tsc + vite build.
- Behavior preserved exactly.
