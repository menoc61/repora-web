# 02-03: Remove duplicate export route

**Requirement:** INF-03
**Goal:** Consolidate to a single export endpoint `/documents/:id/export`.

**Facts:** `routes/export.ts` (`GET /documents/:id` mounted at `/export` → `/export/documents/:id`)
is a duplicate of `routes/documents.ts` `GET /:id/export`. Frontend + tests use the
`documents.ts` route. The `export.ts` variant also omits `userId`/`role` when calling
`exportDocument`, so the canonical route is strictly more correct.

**Files:** `backend/src/routes/export.ts` (delete), `backend/src/index.ts` (remove import
line 13 + `app.use('/export', exportRouter)` line 52).

**Changes:** Delete `routes/export.ts`; remove its import and mount in `index.ts`.
`routes/documents.ts` `GET /:id/export` remains as the sole export endpoint.

**Verification:** grep confirms no remaining reference to `exportRouter`/`routes/export`;
`npx tsc --noEmit` clean; frontend export path unchanged.
