# Task 8 Report: DocumentLibrary — extract sub-components + wire `useActivity`

## Status
DONE

## Summary
Decomposed `src/pages/DocumentLibrary.tsx` (381 lines) into presentational sub-components under `src/components/document-library/`, with `DocumentLibraryView` owning all state/hooks/handlers. Wired the previously-hardcoded-empty `activities` to `useActivity()` (GET `/collaboration/activity`).

## Files created
- `src/components/document-library/types.ts` — `STATUS_LABELS`, `BADGE_STATUS`, `initials`, `PAGE_SIZE` (exported).
- `src/components/document-library/FilterBar.tsx` — props `{ department, status, owner, search, ownerFilteredCount, onDepartmentChange, onStatusChange, onOwnerChange, onSearchChange, onClearFilters }`.
- `src/components/document-library/DocumentTable.tsx` — props `{ docs, selectedIds, onToggleSelect, onToggleAll, onExportSingle, onOpenSharing, onOpenHistory }`. Renders `<Table>` only; card wrapper moved to the view.
- `src/components/document-library/Pagination.tsx` — props `{ currentPage, totalPages, onPageChange }`. Renders the footer only.
- `src/components/document-library/ActivityFeed.tsx` — props `{ activities, onViewAll }`. Defensive field fallbacks preserved (`message ?? action ?? description ?? 'Activite recente'`, timestamp fallbacks).
- `src/components/document-library/MetricsPanel.tsx` — props `{ metrics }`.
- `src/components/document-library/DocumentLibraryView.tsx` — owns `navigate`, `setActiveView`, status/search/page/selectedIds/department/owner state, export/create/generate mutations, `useDocuments(filters)`, `useAnalytics`, `useActivity`, all handlers. Composes TopBar + header + FilterBar + (DocumentTable + Pagination wrapped in the original `bg-surface rounded-xl` card) + bento grid (ActivityFeed + MetricsPanel).
- `src/components/document-library/index.ts` — barrel (default + named `DocumentLibraryView`, plus `./types`).

## Files modified
- `src/pages/DocumentLibrary.tsx` — slimmed to `import DocumentLibraryView from '../components/document-library'; export default function DocumentLibrary() { return <DocumentLibraryView /> }`.

## NEW wiring (only behavior change)
- Replaced hardcoded `const activities: ...[] = []` with:
  ```ts
  const { data: activitiesData } = useActivity()
  const activities = (activitiesData as any[]) ?? []
  ```
- `useActivity` is imported from `@/hooks/useQueries`. Empty-state still renders if backend returns none/errors.

## Preservation checks
- All French labels preserved verbatim (no translation): "Espace de travail", "Bibliotheque", "Depot d'entreprise", "Export groupe", "Creer un document", "Filtrer par :", "Departement : Tous", "Statut : Tous", "Proprietaire : Tous", "Rechercher...", "Affichage … Documents", "Effacer les filtres", "Nom du document"/"Statut"/"Departement"/"Proprietaire"/"Modifie"/"Actions", "Aucun document disponible.", "Insights et activite IA", "Journal complet", "Utilisation espace", "Agents actifs", "Score de collaboration", "Aucune activite recente."
- DESIGN.md tokens preserved exactly (all className strings copied verbatim).
- Pre-existing `owner` filter quirk preserved exactly: `documents.filter((d) => owner === 'all' || owner === 'me' || d.author.name.includes(owner))`.
- "Documents" count display preserved exactly via `ownerFiltered.length` → `ownerFilteredCount`.
- Aliasing: `@/` for hooks/components/ui/layout; `./` for sibling files in `document-library/`.
- Single-card DOM structure preserved (table + pagination footer share the original `bg-surface rounded-xl border ... overflow-hidden flex flex-col` wrapper).

## Verification
- `npx tsc --noEmit` → passes (no errors).
- `npx vite build` → succeeds (`✓ built in 9.57s`). The only stderr output is the default >500 kB chunk-size advisory, not an error.

## Commits
- `e8534d6` refactor(document-library): decompose and wire useActivity
- `4957818` fix(document-library): match table class to original

## Concerns
- Minor: `ActivityFeed` and `MetricsPanel` type their data props as `any`/`any[]`, matching the original page's loose typing. No `DocumentFilters`/`Document` types were added to `types.ts` since the schema types are imported directly from `@/schemas` where needed.
- The branch is `wave1-authoring-core` (pre-existing), not `main`; commits landed there as instructed.
