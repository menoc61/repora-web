# Phase 2: Infrastructure & Code Cleanup — Context

**Goal:** Reduce architecture debt identified during stabilization — fix S3 client
initialization, remove dead assets and a duplicate export route, and decouple
version history from the audit-log table.

**Depends on:** Phase 1 (complete)
**Requirements:** INF-01, INF-02, INF-03, INF-04
**Plans:** 4 (02-01 .. 02-04)

## Investigation summary (file-level facts)

- **S3 (`services/s3.service.ts`):** `_client` is already cached at module scope, but
  `ensureBucket`/`uploadExport`/`downloadExport` each re-run `await import('@aws-sdk/client-s3')`.
  The dynamic import should be cached once so the module is resolved a single time.
  The dynamic import is intentional (package only installed in Docker, not local dev).
- **Export routes (DUPLICATE):** Two endpoints serve the same job:
  - `routes/export.ts` mounted at `/export` → `GET /export/documents/:id`
  - `routes/documents.ts` `GET /:id/export` (mounted at `/documents`) — **canonical**
  Frontend (`src/hooks/useQueries.ts:616`) and tests (`backend/tests/export.test.ts`)
  both call `/documents/:id/export`. `routes/export.ts` is the dead duplicate.
- **Unused assets (`public/assets/`):** grep across `.{ts,tsx,js,jsx,vue,html,json}`
  finds **no references** to `body_bg.png`, `cover.html`, `body.html`, `backcover.html`,
  `hostinger_vps.png`. The DOCX builder only consumes `cover_bg.png` + `backcover_bg.png`
  (`services/exportDocx.ts:378,520`). All 5 unused files should be deleted.
- **Version history (`routes/documents.ts` + `db/schema.ts`):** Snapshots are currently
  stuffed into `auditLogs.metadata` (actions `document.version_backup` / `version_restored`),
  and `GET /:id/versions` lists *all* audit rows for the doc (line 109-124). Restore reads
  `versionLog.metadata.sections` (lines 136-168, 210-251). No dedicated table exists.
  Decouple: add `versionHistory` table; write/read snapshots there; stop embedding section
  payloads in `auditLogs.metadata`.

## Success criteria (must be TRUE)

1. S3 service initializes the client + module once; exports still cache to minIO.
2. Unused assets deleted; build passes; no dangling references.
3. Single export route `/documents/:id/export`; duplicate removed.
4. Version history in dedicated `versionHistory` table, not `auditLogs.metadata`.
