# Task 11 Report — Cross-page DESIGN.md token + French-label audit/fix (Wave 1)

**Commit:** `8fa97e8` — style: enforce DESIGN.md tokens and French labels across Wave 1
**Status:** DONE_WITH_CONCERNS
**tsc:** clean (exit 0)  **vite build:** clean (exit 0; only a non-fatal chunk-size warning)

## Scope applied
Only the Wave-1 decomposed files were edited. Shared primitives (`ui/*`, `StatusBadge`, `Icon`, `Button`, `Toast.tsx`, `src/pages/{Infrastructure,Settings}.tsx`) were NOT edited even when they contained non-token colors.

## Token availability verification (tailwind.config.js)
All tokens referenced below are confirmed mapped in `tailwind.config.js` (extend.colors):
- `error`, `error-container`, `on-error-container`, `secondary`, `secondary-container`, `tertiary-fixed`, `on-tertiary-fixed`, `status-review`, `status-final`, `surface-container`, `surface-container-low`, `outline-variant`.
- `tertiary-fixed` (#d3e4fe) and `on-tertiary-fixed` (#0b1c30) ARE mapped (config lines 38, 42), as are the fixed/status tokens already in use.
- `shadow-{color}` utilities are generated from the color palette, so `hover:shadow-surface-container/50` is valid.

## Every file:line changed (before → after token)

### document-library
- `MetricsPanel.tsx:25` — `text-green-400` → `text-status-final`

### onboarding
- `ReviewStep.tsx:38` — `text-amber-600 font-body-sm flex items-center gap-1` → `text-status-review font-body-sm flex items-center gap-1`
- `ReviewStep.tsx:69` — `text-amber-600 font-body-sm flex items-center gap-1` → `text-status-review font-body-sm flex items-center gap-1`
- `OnboardingWizardView.tsx:195` — `text-amber-500 mb-4 block mx-auto` → `text-status-review mb-4 block mx-auto`
- `OnboardingWizardView.tsx:255` — `bg-red-50 border border-red-200 rounded text-red-700 font-body-sm flex items-start gap-2` → `bg-error-container border border-on-error-container rounded text-on-error-container font-body-sm flex items-start gap-2`
- `NonFunctionalStep.tsx:59` — `hover:text-red-500` → `hover:text-error`
- `ActorsStep.tsx:49` — `hover:text-red-500` → `hover:text-error`
- `FunctionalStep.tsx:55` — `hover:text-red-500` → `hover:text-error`

### sharing
- `Toggle.tsx:5` — `after:border-gray-300` → `after:border-outline-variant`

### template-gallery
- `types.ts:12` — `bg-blue-50 text-secondary` → `bg-secondary-container text-secondary`
- `types.ts:13` — `bg-emerald-50 text-status-final` → `bg-status-final/10 text-status-final`
- `types.ts:14` — `bg-amber-50 text-status-review` → `bg-status-review/10 text-status-review`
- `types.ts:15` — `bg-purple-50 text-purple-600` → `bg-tertiary-fixed text-on-tertiary-fixed`
- `types.ts:16` — `bg-slate-100 text-on-surface` → `bg-surface-container-low text-on-surface`
- `TemplateGalleryView.tsx:25` — `bg-blue-50 text-secondary` → `bg-secondary-container text-secondary`

### workspace-dashboard
- `DocumentCard.tsx:21` — `hover:shadow-slate-200/50` → `hover:shadow-surface-container/50`
- `DocumentCard.tsx:36` — `bg-slate-200` → `bg-surface-container`
- `DocumentCard.tsx:37` — `bg-slate-300` → `bg-outline-variant`
- `ActivityFeed.tsx:21` — `bg-slate-200` → `bg-surface-container`
- `ActivityFeed.tsx:23` — `bg-slate-200` → `bg-surface-container`
- `ActivityFeed.tsx:24` — `bg-slate-100` → `bg-surface-container-low`
- `ActivityFeed.tsx:26` — `bg-slate-100` → `bg-surface-container-low`

### version-history
- `VersionCard.tsx:42` — `bg-gray-200` → `bg-surface-container`
- `AcceptChangesBar.tsx:64` — `bg-gray-200` → `bg-surface-container`

## Left intentionally unchanged (justification)
- `editor/EditorCanvas.tsx:106` — `color: '#2563EB'`: raw hex, but it is a runtime **data value** passed to a collaboration-cursor library as an actual CSS color (equals the `ai-vibrant` token). Replacing it with the token *name* would break rendering; the value already semantically matches `ai-vibrant`. Left as-is.
- White/black tints (`bg-white`, `border-white`, `after:bg-white`, `bg-black/50`, etc.) left untouched per brief (legitimate dark/structural usage).
- Out-of-scope `Toast.tsx` still contains `bg-red-50 text-red-600 border-red-200` (shared primitive — not in brief scope).
- `src/pages/{Infrastructure,Settings}.tsx` contain non-token colors but are NOT in the brief's page list → not edited.

## French-label audit
Grep of `title=`, `placeholder=`, `aria-label=`, and JSX text across all scoped files found **no English user-visible strings**. All placeholders/titles/labels are French (e.g. "Rechercher...", "Retour a la bibliotheque", "Export groupe"). Template/agent demo names (`Go-To-Market Strategy`, `Market Analyst`, `Copy Catalyst`, etc.) are proper-noun product/agent brand names, not leaked UI labels — left as-is, consistent with existing data style.

## Concerns
1. `editor/EditorCanvas.tsx:106` raw hex `#2563EB` intentionally left because it is a functional CSS color value, not a Tailwind utility (see above). Token-equivalent but not class-mapped.
2. `Toast.tsx` and `Infrastructure.tsx`/`Settings.tsx` retain non-token colors but are outside the Wave-1 scope; a follow-up pass on shared primitives would be needed to fully tokenize the app.
3. Template/agent demo names remain English (proper nouns) — acceptable, but flag for product owner if French naming is required.
