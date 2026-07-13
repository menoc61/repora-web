# Roadmap: Repora

## Overview

This milestone stabilizes the existing Repora codebase: fixing export pipeline reliability (Docker cover images, LibreOffice PDF conversion, document-type-aware covers), cleaning up infrastructure debt (S3 client init, unused assets, duplicate routes, version history decoupling), and bringing the test suite to green with comprehensive coverage for the critical paths. The journey takes the app from "3 tests failing, broken Docker exports" to "all tests green, exports work in Docker, architecture debt reduced."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Export Pipeline Reliability** - Fix DOCX cover images in Docker, keep PDF export light (PDFKit fallback, no LibreOffice bloat), make cover reflect document type
- [ ] **Phase 2: Infrastructure & Code Cleanup** - Fix S3 client init, remove unused assets and duplicate routes, decouple version history from audit logs
- [ ] **Phase 3: Test Suite Health** - Fix 3 failing tests and add coverage for S3, DOCX export, validation portal, and onboarding

## Phase Details

### Phase 1: Export Pipeline Reliability
**Goal**: Documents export correctly in Docker with proper cover pages and high-quality PDF output
**Depends on**: Nothing (first phase)
**Requirements**: EXP-01, EXP-02, EXP-03
**Success Criteria** (what must be TRUE):
  1. DOCX cover page background images render in Docker deployment (not just local dev)
  2. PDF export produces valid output in Docker via the lightweight PDFKit fallback (LibreOffice optional/mountable for higher fidelity)
  3. DOCX cover page title matches the user's document type selection from onboarding
**Plans**: 3 plans

Plans:
- [ ] 01-01: Fix DOCX cover image path resolution for Docker (use `__dirname`-based asset resolution instead of `process.cwd()` going up a level)
- [ ] 01-02: Add LibreOffice to backend Dockerfile and configure PDF export to use it
- [ ] 01-03: Make DOCX cover page reflect document type from onboarding config (pass `documentType` through export pipeline)

### Phase 2: Infrastructure & Code Cleanup
**Goal**: Reduce architecture debt — fix S3 client initialization, remove dead code, decouple version history
**Depends on**: Phase 1
**Requirements**: INF-01, INF-02, INF-03, INF-04
**Success Criteria** (what must be TRUE):
  1. S3 service initializes the client once (no dynamic re-import per call) and exports still cache to minIO
  2. Unused assets (`body_bg.png`, `cover.html`, `body.html`, `backcover.html`) are deleted and build passes
  3. Only one export route exists (`/documents/:id/export`); duplicate removed
  4. Version history stored in dedicated table, not in `auditLogs.metadata`
**Plans**: 4 plans

Plans:
- [ ] 02-01: Refactor S3 service to lazy-init client once at module load
- [ ] 02-02: Delete unused assets and verify no references remain
- [ ] 02-03: Remove duplicate export route and consolidate to single endpoint
- [ ] 02-04: Create version history table and migrate snapshots out of audit logs

### Phase 3: Test Suite Health
**Goal**: All tests green with comprehensive coverage for critical export/validation/onboarding paths
**Depends on**: Phase 2
**Requirements**: TST-01, TST-02, TST-03, TST-04, TST-05
**Success Criteria** (what must be TRUE):
  1. `npm test` passes with 0 failures (was 3 failing)
  2. S3 service has mocked tests covering success + failure paths
  3. DOCX export builder has fixture-based tests asserting buffer validity
  4. Validation portal has E2E tests covering accept/reject flow
  5. Onboarding wizard has API integration tests covering all 5 steps
**Plans**: 5 plans

Plans:
- [ ] 03-01: Fix 3 failing tests (Zod error codes + French detection heuristic)
- [ ] 03-02: Add S3 service tests with mocked minIO client
- [ ] 03-03: Add DOCX export builder tests with fixture data
- [ ] 03-04: Add validation portal E2E flow tests
- [ ] 03-05: Add onboarding wizard API integration tests

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Export Pipeline Reliability | 0/3 | Not started | - |
| 2. Infrastructure & Code Cleanup | 0/4 | Not started | - |
| 3. Test Suite Health | 0/5 | Not started | - |
