# Repora — State

---
GSD_INIT: 2026-07-13
GSD_SOURCE: .planning/PROJECT.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md
---

## Current Phase: Milestone 1 — Stabilization (GSD-managed)

Phases 0-4 (below) are historical context. New work is managed through GSD (PROJECT.md, REQUIREMENTS.md, ROADMAP.md).

### Historical Phases (complete)

All 5 phases (0-4) were completed:

### Phase 0: Tests & Pipeline ✅
- 97/97 backend tests passing across 9 test files
- DB connection stabilized (port 5434 to avoid local PostgreSQL conflicts)
- Docker pg_hba.conf configured for remote access
- `test-db.mjs` temp file removed

### Phase 1: Export ✅
- PDF export via pdf-lib
- DOCX export via docx library
- MD export via markdown builder
- 5 export tests added

### Phase 2: Admin Panel ✅
- Settings page with agent configuration table
- BYOK API key management (add/delete/list)
- Dynamic config without server restart

### Phase 3: Validation Portal ✅
- ValidatePortal page with section-by-section accept/reject
- Mandatory reason modal on rejection
- WebSocket notifications on decision
- Single-use token with lock after first decision

### Phase 4: Conversational Assistant ✅
- Backend: POST /assistant/start, POST /assistant/chat, POST /assistant/generate
- Frontend: Assistant page at /assistant/:id with chat interface
- Structured extraction panel (context, features, constraints, actors)
- Hermes integration via "Generate" button

### Docker
- All 3 services running (frontend:3000, backend:8001, db:5434)
- DB healthcheck passing
- Backend auto-migration + seed on startup

### Known Issues (current state, 2026-07-13)
- **3 failing backend tests** (was 97/97): 2 Zod validation error code mismatches (documents.test.ts, projects.test.ts) + 1 French detection heuristic (negotiate.test.ts)
- **DOCX cover images broken in Docker** — `exportDocx.ts:368` uses `path.resolve(process.cwd(),'..')` which doesn't resolve correctly in containerized environment
- **No LibreOffice in backend Docker** — PDF export falls back to PDFKit (lower quality)
- **S3 service wasteful** — re-imports SDK on every function call instead of lazy-init once
- **Unused assets** — `public/assets/body_bg.png`, `cover.html`, `body.html`, `backcover.html`
- **Duplicate export route** — `/export/documents/:id` vs `/documents/:id/export`
- **Version history coupled to audit logs** — snapshots stored in `auditLogs.metadata`
- Content generation requires active Ollama instance with tool-calling model; without it, sections are "pending"
- Frontend build has large bundle (1.5MB main chunk) — consider code-splitting

### Next Up (from ROADMAP.md)
- Phase 1: Export Pipeline Reliability (EXP-01, EXP-02, EXP-03)
- Phase 2: Infrastructure & Code Cleanup (INF-01 to INF-04)
- Phase 3: Test Suite Health (TST-01 to TST-05)
