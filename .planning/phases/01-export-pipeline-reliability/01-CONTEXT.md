# Phase 1: Export Pipeline Reliability - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Source:** Codebase analysis (brownfield)

<domain>
## Phase Boundary

This phase makes document export work correctly in the Docker deployment:
- DOCX cover page background images render in Docker (currently missing because `public/assets` is not copied into the image and the asset path resolves wrong in-container)
- PDF export uses LibreOffice conversion (currently falls back to PDFKit because LibreOffice is absent in the `node:22-alpine` image)
- DOCX cover title reflects the user's selected document type from onboarding (currently hardcoded "CAHIER DES CHARGES")
</domain>

<decisions>
## Implementation Decisions

### Asset path resolution
- Cover/back-cover background images (`cover_bg.png`, `backcover_bg.png`) live at **repo-root** `public/assets/` (shared with the frontend build), NOT under `backend/`.
- In dev, backend `cwd = backend/`, so `path.resolve(process.cwd(), '..')` = repo root → resolves correctly.
- In Docker, backend `cwd = /app`, so `path.resolve(process.cwd(), '..')` = `/` → path broken.
- Fix: copy `public/assets` into the image at `/app/public/assets` AND resolve assets from `process.cwd()`-relative path with a fallback, OR a robust multi-candidate resolver.

### LibreOffice in Docker
- `docxToPdf.ts` already detects LibreOffice at `/usr/bin/libreoffice`, `/usr/local/bin/libreoffice` (and Windows paths).
- `export.service.ts:72` uses `isLibreOfficeAvailable()` and falls back to `generatePdfFallback` (PDFKit) otherwise.
- `node:22-alpine` cannot easily install LibreOffice (not in main apk repos). Switch base to `node:22-bookworm-slim` and `apt-get install` a headless LibreOffice writer package.

### Cover title from documentType
- `exportDocx.ts` already receives `documentType?` (line 24) and uses it to select the template (line 299: `getTemplate(doc.config.documentType || 'cahier_des_charges')`).
- `docTemplates.ts` defines `id` + `name` per template: `cahier_des_charges` → "Cahier des Charges", `rapport_technique` → "Rapport Technique", `spec_fonctionnelle` → "Specification Fonctionnelle".
- Cover title (lines 385-390) is hardcoded "CAHIER DES / CHARGES". Replace with an uppercase mapping of the template name.

### the agent's Discretion
- Exact LibreOffice package selection (writer-only vs full) and image size tradeoffs
- Whether to also fix the PDF fallback cover title (pdfFallback.ts:47 hardcodes "CAHIER DES CHARGES") — out of strict scope but should be consistent
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `backend/src/services/exportDocx.ts` — cover image load (line 368, 509), `PROJECT_ROOT` (line 14), hardcoded title (385-390), `documentType` param (24), template selection (299)
- `backend/src/services/docxToPdf.ts` — LibreOffice detection (`findLibreOffice`, `isLibreOfficeAvailable`, `convertDocxToPdf`)
- `backend/src/services/export.service.ts` — `exportDocument` PDF branch (lines 71-94) choosing LibreOffice vs fallback
- `backend/src/utils/docTemplates.ts` — `DOCUMENT_TEMPLATES` with `id`/`name` mapping
- `backend/Dockerfile` — `node:22-alpine`, copies only `dist` (no `public`)
- `public/assets/cover_bg.png`, `public/assets/backcover_bg.png` — the actual background images
</canonical_refs>

<specifics>
## Specific Ideas

- Add `COPY public/assets ./public/assets` to Dockerfile so `/app/public/assets/cover_bg.png` exists.
- Replace `PROJECT_ROOT = path.resolve(process.cwd(), '..')` with a resolver that checks `process.cwd()/public/assets` first, then `../public/assets`.
- Switch Dockerfile base to `node:22-bookworm-slim`; install `libreoffice-writer` (or `libreoffice`) headless.
- Add a `coverTitleFor(documentType)` helper mapping template id → uppercase French title.
</specifics>

<deferred>
## Deferred Ideas

- Making the PDF fallback (pdfFallback.ts) cover title dynamic too (consistency nice-to-have, not blocking Phase 1 success criteria)
- Code-splitting the 1.5MB frontend bundle (separate concern, Phase 2/3 territory)
</deferred>

---
*Phase: 01-export-pipeline-reliability*
*Context gathered: 2026-07-13 via codebase analysis*
