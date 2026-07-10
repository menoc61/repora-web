# Task 8: DocumentLibrary — extract sub-components + wire `useActivity`

## Current state
`src/pages/DocumentLibrary.tsx` (381 lines) — document repository: header + bulk-export/create actions, filter bar, document table + pagination, and a bento grid ("Insights et activite IA" + "Utilisation espace"). Imports use `@/` aliases. Hooks used: `useDocuments`, `useExportDocument`, `useCreateProject`, `useGenerateDocument`, `useAnalytics` (metrics). **NEW wiring:** `useActivity` (src/hooks/useQueries.ts:707, `GET /collaboration/activity`) is currently UNUSED; the `activities` array is hardcoded empty at line 121. Wire it.

## Files
Create under `src/components/document-library/`:
- `types.ts` — `STATUS_LABELS` (27-34), `BADGE_STATUS` (36-43), `initials(name)` (45-52), `PAGE_SIZE` (54). Export all. Use `@/schemas` for the `Document`/`DocumentFilters` types if needed.
- `FilterBar.tsx` — filter bar (161-220). Props: `{ department; status; owner; search; ownerFilteredCount: number; onDepartmentChange; onStatusChange; onOwnerChange; onSearchChange; onClearFilters }`.
- `DocumentTable.tsx` — table incl. header + rows + empty state + per-row actions + checkbox selection (222-298). Props: `{ docs: Document[]; selectedIds: Set<string>; onToggleSelect: (id) => void; onToggleAll: (checked: boolean) => void; onExportSingle: (doc) => void; onOpenSharing: (doc) => void; onOpenHistory: (doc) => void }`. Use `Link`/`Icon`/`StatusBadge`/`Button` from `@/` aliases.
- `Pagination.tsx` — pagination controls (299-323). Props: `{ currentPage: number; totalPages: number; onPageChange: (p: number) => void }`.
- `ActivityFeed.tsx` — "Insights et activite IA" widget (327-353). Props: `{ activities: any[]; onViewAll: () => void }`. Keep the existing defensive field fallbacks (`entry.message ?? entry.action ?? entry.description ?? 'Activite recente'` and timestamp fallbacks) — the backend `/collaboration/activity` shape is unknown.
- `MetricsPanel.tsx` — "Utilisation espace" widget (355-376). Props: `{ metrics: any }`.
- `DocumentLibraryView.tsx` — owns: navigate, setActiveView (from `@/stores` useWorkspaceStore), status/search/page/selectedIds/department/owner state, exportMutation, createProject, generateDoc, `useDocuments(filters)`, `useAnalytics` (metrics), **`useActivity` (activities — NEW)**, all handlers (handleNewDocument, handleBulkExport, handleExportSingle, handleClearFilters, toggleSelect). Renders: TopBar + header (125-159) + FilterBar + DocumentTable + Pagination + bento grid (ActivityFeed + MetricsPanel). Wire `const { data: activitiesData } = useActivity()` and `const activities = (activitiesData as any[]) ?? []` to replace the hardcoded-empty `activities` (line 121). Props: none (library root).
- `index.ts` — barrel re-exporting `DocumentLibraryView` (and `./types` if helpful).

Modify: `src/pages/DocumentLibrary.tsx` → thin wrapper:
```tsx
import DocumentLibraryView from '../components/document-library'
export default function DocumentLibrary() {
  return <DocumentLibraryView />
}
```

## Steps
- [ ] Step1: `types.ts`.
- [ ] Step2: `FilterBar`, `DocumentTable`, `Pagination`, `ActivityFeed`, `MetricsPanel` — exact JSX/styles/labels.
- [ ] Step3: `DocumentLibraryView.tsx` owning state + handlers + hooks (incl. NEW `useActivity` wiring replacing empty `activities`). Compose all.
- [ ] Step4: `index.ts` barrel.
- [ ] Step5: Slim `DocumentLibrary.tsx` to wrapper; remove now-unused imports from the page.
- [ ] Step6: Verify `npx tsc --noEmit` and `npx vite build`. Behavior identical (filter, search, paginate, select, export single/bulk, create, sharing/history nav, metrics); AND the activity feed now reads `useActivity()` instead of [] (empty-state still shows if backend returns none/errors).
- [ ] Step7: Commit `git add src/components/document-library src/pages/DocumentLibrary.tsx && git commit -m "refactor(document-library): decompose and wire useActivity"`

## Constraints
- DESIGN.md tokens; French labels preserved exactly.
- No new tests; verification = tsc + vite build.
- Use `@/` alias for hooks/components/ui (consistent with the page); `./` for sibling files.
- Preserve the pre-existing `owner` filter quirk (`documents.filter(d => owner==='all' || owner==='me' || d.author.name.includes(owner))`) and "Documents" count display exactly — do NOT change filter logic.
- Behavior preserved; only the `activities` source changes (wired to `useActivity`).
