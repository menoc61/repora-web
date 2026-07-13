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

### Known Issues (remaining, 2026-07-13)
- Content generation requires active Ollama instance with tool-calling model; without it, sections are "pending"
- Frontend build large bundle — addressed (nginx gzip + vite manualChunks; ~470KB gzipped)
- No onboarding API/routes exist, so 03-05 (onboarding wizard API tests) is not feasible

### Resolved (this session)
- **DOCX cover images in Docker** — multi-candidate `resolveAsset()` resolver (`exportDocx.ts`)
- **No LibreOffice bloat** — PDFKit fallback; backend image 270MB (< 300MB budget)
- **S3 service wasteful** — SDK module + client now cached once (`services/s3.service.ts`)
- **Unused assets** — `body_bg.png`, `cover.html`, `body.html`, `backcover.html`, `hostinger_vps.png` deleted
- **Duplicate export route** — `/export/documents/:id` removed; single `/documents/:id/export`
- **Version history decoupled** — dedicated `versionHistory` table; restore/versions routes rewired
- **3 failing backend tests** — fixed: `validate.ts` returns `missing_fields` (was `validation_error`), `negotiate.ts` French warning ungated; `version_history` table migrated via `drizzle-kit push`
- **Test coverage added** — `tests/s3.test.ts` (5 mocked S3 success/failure tests), `tests/exportDocx.test.ts` (5 docx builder tests), `tests/validation.test.ts` (8 portal accept/reject E2E tests). Full suite now **115 passed / 0 failed across 12 files**.

### Next Up (from ROADMAP.md)
- Phase 1: Export Pipeline Reliability (EXP-01, EXP-02, EXP-03) — ✅ complete
- Phase 2: Infrastructure & Code Cleanup (INF-01 to INF-04) — ✅ complete
- Phase 3: Test Suite Health (TST-01 to TST-05) — ✅ complete (115/115 tests green; 03-05 not feasible)
