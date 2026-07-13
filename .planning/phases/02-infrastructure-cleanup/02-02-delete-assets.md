# 02-02: Delete unused assets

**Requirement:** INF-02
**Goal:** Remove dead assets so the image carries only what the DOCX builder uses.

**Facts:** `public/assets/` contains `cover_bg.png`, `backcover_bg.png` (USED by
`services/exportDocx.ts`), plus `body_bg.png`, `cover.html`, `body.html`, `backcover.html`,
`hostinger_vps.png` (UNUSED — grep finds zero references in code).

**Files:** `public/assets/body_bg.png`, `public/assets/cover.html`, `public/assets/body.html`,
`public/assets/backcover.html`, `public/assets/hostinger_vps.png`
(also `dist/assets/*` copies if present — `dist` is gitignored).

**Changes:** Delete the 5 unused files. Confirm no remaining references via grep.

**Verification:** grep for each filename returns nothing; `npx tsc --noEmit` clean;
DOCX export still builds (cover uses `cover_bg.png`/`backcover_bg.png`).
