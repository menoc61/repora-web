# Task 3: Editor — finalize `DiagramPanel`

## Current state
After Task 2, `Editor.tsx` `EditorPage` still contains an INLINE diagram section (the block at `Editor.tsx:179-242`) passed as children to `<InspectorPanel>`, plus its supporting state/hook/handler in `EditorPage`:
- `useCreateDiagram` import (Editor.tsx:9)
- `const createDiagram = useCreateDiagram()` (Editor.tsx:71)
- `const [diagramType, setDiagramType] = useState('use_case')` and `const [diagrams, setDiagrams] = useState<Array<{id,type,rendered_url}>>([])` and `const [diagramError, setDiagramError] = useState<string|null>(null)` (around Editor.tsx:77)
- `async function handleGenerateDiagram()` (around Editor.tsx:136-146) calling `createDiagram.mutateAsync({ projectId: document.projectId, type: diagramType, source: title })` then `setDiagrams(prev => [...prev, { ...result, type: diagramType }])`.

## Files
Create: `src/components/editor/DiagramPanel.tsx` (and an internal `DiagramCard` component within it).
Modify: `src/pages/Editor.tsx`.

## Interfaces
- `DiagramPanel` props: `{ projectId: string | undefined; title: string }`. It OWNS the `diagramType`/`diagrams`/`diagramError` state, the `useCreateDiagram` hook, and `handleGenerateDiagram`. Renders the exact same JSX currently at Editor.tsx:181-242 (the "Diagrammes UML" heading, the type `<select>`, the Generer button, error text, and the diagrams list).
- `DiagramCard` (internal) props: `{ id: string; type: string; initialUrl: string }`. Uses `useDiagram(id)` (from `../hooks/useQueries`) to fetch the latest `{ id, type, rendered_url }` and displays `rendered_url` (falling back to `initialUrl`), with an "Ouvrir" link and "Rendu en cours..." while missing.

## Steps
- [ ] **Step 1:** Create `DiagramPanel.tsx`. Move the state/hook/handler + JSX into it. The diagrams list maps each stored diagram to `<DiagramCard key={d.id} id={d.id} type={d.type} initialUrl={d.rendered_url} />`. Keep French labels ("Diagrammes UML", "Cas d'utilisation", "Sequence", "Activite", "Classe", "Deploiement", "Generer", "Ouvrir", "Rendu en cours...", "Liez ce document a un projet pour generer des diagrammes.").
- [ ] **Step 2:** In `Editor.tsx` `EditorPage`, REMOVE the inline diagram JSX (Editor.tsx:179-242 block, keeping the `<OutlineTree>` which follows it), REMOVE the `diagramType`/`diagrams`/`diagramError` state, the `createDiagram` hook, `handleGenerateDiagram`, and the `useCreateDiagram` import. Render `<DiagramPanel projectId={document?.projectId} title={title} />` inside `<InspectorPanel>` in place of the inline block (before `<OutlineTree>`).
- [ ] **Step 3:** Verify — `npx tsc --noEmit` and `npx vite build`. Diagram generation must still work: select type, click Generer, the new diagram card appears and the image refreshes via `useDiagram`.
- [ ] **Step 4:** Commit — `git add src/components/editor/DiagramPanel.tsx src/pages/Editor.tsx && git commit -m "refactor(editor): relocate DiagramPanel and refresh rendered urls"`

## Constraints
- DESIGN.md tokens; French labels preserved.
- No new tests; verification = tsc + vite build.
- Keep `../` relative imports.
- Behavior preserved; the only enhancement is `DiagramCard` refreshing `rendered_url` from `useDiagram(id)` (additive, correct).
- Do NOT change the diagram-generation endpoint/payload already wired.
