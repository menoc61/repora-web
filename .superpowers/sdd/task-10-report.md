# Task 10 Report — TemplateGallery decomposition

## Status
DONE — both `tsc --noEmit` and `vite build` pass; commit created.

## Commit
- `87506f3` refactor(template-gallery): decompose into sub-components

## Files created
- `src/components/template-gallery/types.ts` — `TemplateItem` (renamed from misnamed `TemplateCard`), `AgentStatus`, `TEMPLATES`, `FILTERS`, `agentDotClass`. All exported.
- `src/components/template-gallery/SearchNav.tsx` — top search+nav bar. Props `{ searchQuery, onSearchChange }`. Contains search `Input` + 3 static `<Link>` nav items (Espace de travail / Bibliotheque / Agents).
- `src/components/template-gallery/FilterChips.tsx` — chip row. Props `{ filters, active, onSelect }`.
- `src/components/template-gallery/TemplateCard.tsx` — single card. Props `{ template: TemplateItem, onUse, isPending }`.
- `src/components/template-gallery/CreateTemplateCard.tsx` — dashed "Modele personnalise" `Link` to `/editor` search `{ id: undefined }`. No props.
- `src/components/template-gallery/OrchestratorBanner.tsx` — static bottom banner. No props.
- `src/components/template-gallery/TemplateGalleryView.tsx` — owns `active` + `searchQuery` state, `useTemplates/useCreateDocumentFromTemplate/useGenerateDocument`, `navigate`, `cards` mapping, `filtered`, `handleUseTemplate`, `isPending`. Imports `Template` from `../../schemas`.
- `src/components/template-gallery/index.ts` — barrel re-exporting `TemplateGalleryView` + `./types`.

## Modified
- `src/pages/TemplateGallery.tsx` — slimmed to `import TemplateGalleryView from '../components/template-gallery'` returning `<TemplateGalleryView />`.

## Verification
- `npx tsc --noEmit` → exit 0, no errors.
- `npx vite build` → exit 0, 2461 modules transformed (pre-existing >500kB chunk-size warning only; not introduced here).

## Behavior preservation
- All JSX structure, Tailwind class tokens (DESIGN.md surface/color/shape tokens), and French labels preserved verbatim.
- `agents: []` mapping fallback retained verbatim (with same TODO comment) for the API path.
- No `useX().mutate*` call changed: `createFromTemplate.mutateAsync(...)` and `generateDoc.mutateAsync(...)` unchanged; `disabled`/pending state wired via `isPending` prop.
- `TemplateCard` data interface renamed to `TemplateItem` (internal only; no behavior change).

## Concerns
- The task brief's guidance to use `../hooks` / `../schemas` from inside `template-gallery/` was off by one directory level (that folder is one level deeper than `src/pages/`). Used correct `../../hooks/useQueries` and `../../schemas`; everything else uses `./` for siblings and `../` for `Icon`/`ui/*` as required.
- `isLoading` from `useTemplates()` is declared in the View but unused (as in the original page) — harmless since `noUnusedLocals` is not enabled in tsconfig.
