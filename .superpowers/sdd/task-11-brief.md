# Task 11: Cross-page polish pass (Wave 1)

## Goal
Enforce DESIGN.md tokens + French UI labels across all Wave-1 decomposed files (Tasks 1-10). This is an AUDIT + FIX task, not an extraction.

## Scope (ONLY these files — do NOT touch pre-existing shared primitives like StatusBadge/Button/Icon/ui/*)
- `src/components/editor/*` (EditorCanvas, EditorHeader, InspectorPanel, AgentProgressPanel, OutlineTree, ShareDialog, DiagramPanel, index.ts)
- `src/components/version-history/*`
- `src/components/sharing/*`
- `src/components/onboarding/*`
- `src/components/document-library/*`
- `src/components/workspace-dashboard/*`
- `src/components/template-gallery/*`
- `src/pages/{Editor,VersionHistory,Sharing,OnboardingWizard,DocumentLibrary,WorkspaceDashboard,TemplateGallery}.tsx` (the thin wrappers)

## Authority: DESIGN.md (read `C:\Users\DTA_WORKSTATION\Downloads\REPORA WEB\repora-web\DESIGN.md`)
Available tokens include: `primary`, `primary-container`, `secondary`, `secondary-container`, `secondary-fixed`, `tertiary-fixed`, `on-tertiary-fixed`, `error`, `error-container`, `on-error-container`, `surface*` (surface, surface-container, surface-container-low/high/highest, surface-studio, surface-variant), `on-surface`, `on-surface-variant`, `outline`, `outline-variant`, `ai-vibrant`, `ai-glow`, `status-draft`, `status-review`, `status-final`, `inverse-*`.

## Step 1: Token audit + fix
Grep the scoped files for: (a) raw hex (`#xxx`), (b) non-token Tailwind color utilities: `red-*`, `amber-*`, `green-*`, `emerald-*`, `blue-*`, `purple-*`, `slate-*`, `gray-*`, `yellow-*`.
- White/black tints ON DARK surfaces (`bg-white/10`, `border-white/20`, `text-white/40`, `bg-black/50`) are LEGITIMATE (dark panels) — LEAVE them.
- Replace each non-token color with the NEAREST semantic token, preserving intent:
  - `bg-red-50 border-red-200 text-red-700` → `bg-error-container border-on-error-container text-on-error-container`
  - `text-amber-500` / `text-amber-600` → `text-status-review`
  - `bg-amber-50` → `bg-status-review/10`
  - `text-green-400` → `text-status-final`
  - `bg-emerald-50` → `bg-status-final/10`
  - `bg-blue-50 text-secondary` → `bg-secondary-container text-secondary`
  - `bg-purple-50 text-purple-600` → `bg-tertiary-fixed text-on-tertiary-fixed`
  - `bg-slate-100` → `bg-surface-container-low`; `bg-slate-200` → `bg-surface-container`; `bg-slate-300` → `bg-outline-variant`
- BEFORE using a token class, confirm it exists in the Tailwind theme (`grep` the tailwind config / `tailwind.config.*` / theme file for the token name). If a token you need is NOT mapped, either (a) use the closest mapped token, or (b) add the missing token to DESIGN.md + tailwind config (only if truly missing). Prefer reusing existing mapped tokens.
- DO NOT change layout, spacing, typography, or structure — ONLY color token swaps.

## Step 2: French-label audit
Grep the scoped files for VISIBLE English UI strings (text in JSX, `title=`, `placeholder=`, `aria-label=`). Code comments may stay English. Flag any English UI string; if found and it is user-visible, replace with the correct French equivalent (preserve existing French style: accents, lowercase "etre"/"actifs", etc.). NOTE: pages were already French — this is a verification pass; most should already be French.

## Step 3: Verify
`npx tsc --noEmit` and `npx vite build` — must be clean.

## Step 4: Commit
`git add -A && git commit -m "style: enforce DESIGN.md tokens and French labels across Wave 1"`

## Report
Write full report to `C:\Users\DTA_WORKSTATION\Downloads\REPORA WEB\repora-web\.superpowers\sdd\task-11-report.md` listing EVERY file:line changed and the before→after token. Return ONLY status, commit, one-line build summary, concerns, report path.

## Constraints
- Only color tokens + visible French labels change. No logic/structure/layout changes.
- Preserve semantic intent (amber stays amber-ish via status-review; purple stays purple-ish via tertiary-fixed; etc.).
- Leave white/black tints on dark surfaces untouched.
- tsc + vite build must pass.
