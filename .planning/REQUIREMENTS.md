# Requirements: Repora

**Defined:** 2026-07-13
**Core Value:** A user should be able to describe a project in plain language and get a complete, professional specification document — with diagrams, tables, and a review pass — without ever needing to understand the underlying multi-agent pipeline.

## v1 Requirements

Requirements for the current maintenance/stabilization milestone. Each maps to roadmap phases.

### Export & PDF

- [ ] **EXP-01**: DOCX cover page background images render correctly in Docker (currently path resolution broken — `process.cwd()` going up one level doesn't work in containerized environment)
- [ ] **EXP-02**: PDF export works in Docker via the lightweight PDFKit fallback (LibreOffice intentionally NOT baked in — it stays an optional, mountable upgrade for higher-fidelity PDFs)
- [ ] **EXP-03**: DOCX cover page reflects user's document type selection from onboarding config (currently hardcoded "CAHIER DES CHARGES")

### Infrastructure & Cleanup

- [ ] **INF-01**: S3 service lazy-inits the SDK client once instead of re-importing on every function call
- [ ] **INF-02**: Unused assets removed (`public/assets/body_bg.png`, `cover.html`, `body.html`, `backcover.html`)
- [ ] **INF-03**: Duplicate export route removed (`/export/documents/:id` — only `/documents/:id/export` should exist)
- [ ] **INF-04**: Version history decoupled from audit logs (dedicated version table instead of storing snapshots in `auditLogs.metadata`)

### Testing

- [ ] **TST-01**: Fix 3 failing backend tests (2 Zod validation error code mismatches in documents.test.ts + projects.test.ts, 1 French detection heuristic in negotiate.test.ts)
- [ ] **TST-02**: Add S3 service tests (mocked minIO client)
- [ ] **TST-03**: Add export DOCX builder tests (fixture data → assert buffer validity)
- [ ] **TST-04**: Add validation portal E2E flow tests
- [ ] **TST-05**: Add onboarding wizard API integration tests

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Performance

- **PERF-01**: Profile and optimize Hermes pipeline token usage per section
- **PERF-02**: Add export caching layer (avoid regenerating identical documents)

### Features

- **FEAT-01**: Real-time multi-writer collaboration on the same document simultaneously
- **FEAT-02**: Full-text search across documents (ElasticSearch/Meilisearch)
- **FEAT-03**: i18n support beyond French

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app (native) | Responsive PWA sufficient for v1 |
| Multi-tenancy / SaaS | Self-hosted only for now |
| Ollama as inference runtime | llama.cpp used directly (per AGENTS.md) |
| Real-time chat | Not core to spec-generation value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXP-01 | Phase 1 | Complete |
| EXP-02 | Phase 1 | Complete |
| EXP-03 | Phase 1 | Complete |
| INF-01 | Phase 2 | Pending |
| INF-02 | Phase 2 | Pending |
| INF-03 | Phase 2 | Pending |
| INF-04 | Phase 2 | Pending |
| TST-01 | Phase 3 | Pending |
| TST-02 | Phase 3 | Pending |
| TST-03 | Phase 3 | Pending |
| TST-04 | Phase 3 | Pending |
| TST-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after initial definition*
