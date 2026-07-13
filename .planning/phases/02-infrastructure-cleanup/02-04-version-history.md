# 02-04: Dedicated version-history table

**Requirement:** INF-04
**Goal:** Store document version snapshots in a dedicated `versionHistory` table instead of
embedding section payloads in `auditLogs.metadata`.

**Files:**
- `backend/src/db/schema.ts` — add `versionHistory` table.
- `backend/src/services/document.service.ts` — add `createVersion`, `listVersions`,
  `getVersion` helpers.
- `backend/src/routes/documents.ts` — rewire `GET /:id/versions`, `POST /:id/versions/restore`,
  `POST /:id/restore` to use `versionHistory`; snapshot current state on `PATCH /:id` save;
  stop writing section payloads into `auditLogs.metadata`.

**Schema (`versionHistory`):**
- `id` uuid pk, `documentId` fk→documents, `version` int, `sections` jsonb (array of
  `{id,title,content,order,status}`), `documentStatus` text, `createdBy` fk→users (nullable),
  `label` text (nullable), `createdAt` timestamp.

**Behavior:**
- `createVersion(docId, userId, sections, status, label?)` computes `max(version)+1` and inserts.
- `PATCH /:id` saves sections, then calls `createVersion` with the resulting state.
- `GET /:id/versions` lists `versionHistory` desc.
- Restore (both endpoints) snapshots current state as a new version first, then applies the
  target version's sections + `documentStatus`; logs a lightweight `document.version_restored`
  audit event (no section payload).

**Migration:** New table is picked up by `drizzle-kit push` at deploy (docker-entrypoint).
**Verification:** `npx tsc --noEmit` clean; Phase 3 adds tests; no code path writes version
sections into `auditLogs.metadata`.
