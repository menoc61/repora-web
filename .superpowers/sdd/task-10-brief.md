# Task 10: TemplateGallery — extract sub-components

## Current state
`src/pages/TemplateGallery.tsx` (192 lines) — template gallery: top search+nav bar, header + filter chips, template grid (cards + "Modele personnalise" card), bottom "Orchestrateur global actif" banner. Uses RELATIVE `../` imports. Hooks already wired (`useTemplates`, `useCreateDocumentFromTemplate`, `useGenerateDocument`). Preserve ALL JSX, styles, French labels, behavior.

NOTE: the data interface at line 9 is misnamed `TemplateCard` (it is a template ITEM, not a card). Rename it to `TemplateItem` in `types.ts` and use that name in the View + `TemplateCard` component prop (internal rename, no behavior change).

## Files
Create under `src/components/template-gallery/`:
- `types.ts` — `TemplateItem` interface (rename of 9-15: title, dept, icon, color, agents:[string,string][]), `AgentStatus` type (17), `TEMPLATES` (19-25), `FILTERS` (27), `agentDotClass(status)` (29-33). Export all.
- `SearchNav.tsx` — top search + nav bar (83-93). Props `{ searchQuery: string; onSearchChange: (v:string)=>void }`. Includes the search Input + the 3 static `<Link>` nav items.
- `FilterChips.tsx` — filter chips row (101-113). Props `{ filters: string[]; active: string; onSelect: (f:string)=>void }`.
- `TemplateCard.tsx` — single template card (118-151). Props `{ template: TemplateItem; onUse: () => void; isPending: boolean }`.
- `CreateTemplateCard.tsx` — dashed "Modele personnalise" Link card (154-160). No props (static Link to `/editor` search `{id:undefined}`).
- `OrchestratorBanner.tsx` — bottom banner (163-188). No props (static).
- `TemplateGalleryView.tsx` — owns: active + searchQuery state, `useTemplates()` (apiTemplates), `useCreateDocumentFromTemplate()` (createFromTemplate), `useGenerateDocument()` (generateDoc), navigate, `cards` mapping (43-52: apiTemplates→TemplateItem or fallback TEMPLATES), `filtered` (54-60), `handleUseTemplate` (62-79, uses `Template` from `@/schemas` / `../schemas`), `isPending` (= createFromTemplate.isPending || generateDoc.isPending). Renders: `<SearchNav .../>` + container with the static header (95-101 text) + `<FilterChips filters={FILTERS} active={active} onSelect={setActive} />` + grid `<div>` (116) mapping `filtered` to `<TemplateCard key={t.title} template={t} onUse={() => handleUseTemplate(t)} isPending={isPending} />` + `<CreateTemplateCard />` + `<OrchestratorBanner />`. Props: none (page root). Imports `Template` type from `../schemas`.
- `index.ts` — barrel re-exporting `TemplateGalleryView` (and `./types` if helpful).

Modify: `src/pages/TemplateGallery.tsx` → thin wrapper:
```tsx
import TemplateGalleryView from '../components/template-gallery'
export default function TemplateGallery() {
  return <TemplateGalleryView />
}
```

## Steps
- [ ] Step1: `types.ts` (rename `TemplateCard`→`TemplateItem`).
- [ ] Step2: `SearchNav`, `FilterChips`, `TemplateCard`, `CreateTemplateCard`, `OrchestratorBanner` — exact JSX/styles/labels.
- [ ] Step3: `TemplateGalleryView.tsx` owning state + hooks + cards/filtered/handleUseTemplate; composes all.
- [ ] Step4: `index.ts` barrel.
- [ ] Step5: Slim `TemplateGallery.tsx` to wrapper.
- [ ] Step6: Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (search, filter chips, use-template→editor, custom-template card, banner).
- [ ] Step7: Commit `git add src/components/template-gallery src/pages/TemplateGallery.tsx && git commit -m "refactor(template-gallery): decompose into sub-components"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly.
- No new tests; verification = tsc + vite build.
- Use RELATIVE `../` for cross-folder (consistent with this page) and `./` for siblings in `template-gallery/`.
- Behavior preserved exactly. Do not change any `useX().mutate*` call. The `agents: []` mapping fallback (API does not return agent data) is preserved verbatim.
