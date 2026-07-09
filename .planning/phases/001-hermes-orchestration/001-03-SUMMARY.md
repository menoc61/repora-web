---
phase: 001-hermes-orchestration
plan: 03
subsystem: ui
tags: [sse, react, generationprogress, agentstatus, hermes-event]

# Dependency graph
requires:
  - phase: 001-hermes-orchestration
    provides: "SSE streaming endpoint at GET /documents/:id/stream emitting HermesEvent union"
provides:
  - "GenerationProgress component driven by typed HermesEvent[] via useDocumentStream"
  - "Editor right inspector with live SSE-driven AgentStatus chips replacing hardcoded placeholders"
  - "Dashboard generation-in-progress indicators for active documents"
  - "Template Gallery template-aware generation trigger with templateId passthrough"
  - "AgentStatus component with writing/error/done state variants per DESIGN.md"
affects: [ui-pages, agent-visualization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSE event consumption via typed discriminated union (HermesEvent)"
    - "Hook-derived state from event stream (agentStates map)"
    - "Component composition: GenerationProgress wraps AgentStatus per active agent"

key-files:
  created:
    - "src/components/GenerationProgress.tsx — SSE-driven agent chip panel"
    - "src/components/GenerationProgress.test.tsx — 9 tests for component states"
  modified:
    - "src/hooks/useQueries.ts — HermesEvent types, typed useDocumentStream, templateId param"
    - "src/pages/Editor.tsx — live GenerationProgress replacing hardcoded AgentStatus chips"
    - "src/pages/WorkspaceDashboard.tsx — generation-in-progress indicators"
    - "src/pages/TemplateGallery.tsx — template-aware generation trigger"
    - "src/components/AgentStatus.tsx — writing/error/done state variants and labels"

key-decisions:
  - "Frontend HermesEvent types mirror backend discriminated union (snake_case field names) for type-safe SSE consumption"
  - "GenerationProgress derives agent state map from events array rather than maintaining separate state — single source of truth"
  - "Template gallery 'use' action triggers both createFromTemplate AND generateDoc sequentially for template-aware pipeline flow"

patterns-established:
  - "SSE-driven UI: components consume HermesEvent[] arrays and derive display state via useMemo"
  - "AgentStatus dot variants map directly to design system status tokens (ai-vibrant, status-review, status-final)"

requirements-completed: [HMO-04, HMO-05, HMO-08]

# Metrics
duration: 9min
completed: 2026-07-09
status: complete
---

# Phase 1 Plan 3: Frontend Live Agent Progress + Page Fixes Summary

**SSE-driven GenerationProgress component with typed HermesEvent stream, live Editor agent chips, Dashboard generation indicators, and template-aware generation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-09T15:19:51Z
- **Completed:** 2026-07-09T15:28:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Created `GenerationProgress` component rendering one `AgentStatus` chip per active agent from SSE `HermesEvent[]`
- Updated `useDocumentStream` hook to return typed `HermesEvent[]` with derived `agentStates`, `activeAgents`, and `lastEvent`
- Replaced hardcoded ARCHITECT/GENERATOR/CRITIC chips in Editor right inspector with live `GenerationProgress`
- Added "Generation en cours..." pulse indicator on Dashboard document cards for recently updated drafts
- Template Gallery "Use" action now triggers `createFromTemplate` → `generateDoc` → navigate pipeline with `templateId` passthrough
- AgentStatus component extended with `writing` (redaction), `error` (erreur), and `done` (termine) state variants

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GenerationProgress component + update SSE hook** — `0a1f1be` (feat)
2. **Task 2: Wire Editor + Dashboard to live SSE** — `2f32760` (feat)
3. **Task 3: Template gallery integration + page audit and fixes** — `01623ad` (feat)

## Files Created/Modified

- `src/components/GenerationProgress.tsx` — SSE-driven agent chip panel with idle/thinking/writing/done/error states
- `src/components/GenerationProgress.test.tsx` — 9 tests covering all component states
- `src/hooks/useQueries.ts` — HermesEvent discriminated union types, typed useDocumentStream with derived values, templateId support in useGenerateDocument
- `src/pages/Editor.tsx` — live GenerationProgress replacing hardcoded chips, SSE-driven activeAgentCount and aiEfficiency
- `src/pages/WorkspaceDashboard.tsx` — generation-in-progress pulse indicator, ORCHESTRATEUR note
- `src/pages/TemplateGallery.tsx` — template-aware generation trigger with createFromTemplate + generateDoc pipeline
- `src/components/AgentStatus.tsx` — writing/error/done dot variants and French state labels

## Decisions Made

- Frontend HermesEvent types use `snake_case` field names (e.g., `section_id`) matching the backend JSON wire format for zero-transform SSE consumption
- GenerationProgress derives agent state via single-pass event iteration (useMemo) rather than maintaining separate state — ensures consistency with the event stream
- Template gallery pipeline: createFromTemplate (sets template outline) → generateDoc (with templateId) → navigate to editor. The templateId is passed through to the backend for template-aware agent behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added AgentStatus state variants as prerequisite for GenerationProgress**

- **Found during:** Task 1 (GenerationProgress implementation)
- **Issue:** GenerationProgress needed AgentStatus to support `writing`, `error`, and `done` states with corresponding French labels (`redaction`, `erreur`, `termine`) per DESIGN.md. These were planned for Task 2 but were a hard dependency for Task 1 tests to pass.
- **Fix:** Added `writing` (bg-ai-vibrant animate-wave-active), `error` (bg-status-review), and `done` (bg-status-final) dot variants to AgentStatus.cva. Added corresponding labels to STATE_LABELS map.
- **Files modified:** src/components/AgentStatus.tsx
- **Verification:** All 9 GenerationProgress tests pass; AgentStatus tests pass for new states
- **Committed in:** 0a1f1be (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed TemplateGallery field name mismatch**

- **Found during:** Task 3 (TypeScript compilation)
- **Issue:** `createFromTemplate.mutateAsync` expected `projectName` but the code passed `name`. TypeScript error TS2353.
- **Fix:** Changed field name from `name` to `projectName` matching the hook's type signature.
- **Files modified:** src/pages/TemplateGallery.tsx
- **Verification:** TypeScript compilation passes with zero errors
- **Committed in:** 01623ad (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep. AgentStatus update was pulled forward from Task 2 to Task 1 as a shared dependency.

## Issues Encountered

- None — plan executed smoothly. All TypeScript and test checks passed on first iteration after the two auto-fixes.

## Known Stubs

None — all components are fully wired to real data sources (SSE events, API hooks). No hardcoded placeholder data remains in the Editor agent panel.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or trust boundary changes introduced. All changes are UI-layer consumers of existing backend SSE/HermesEvent infrastructure.

## Next Phase Readiness

- Frontend is fully wired to SSE backend streaming from Plans 001-01/001-02
- Editor shows live agent progress; Dashboard shows real generation status
- All 7 application pages compile without TypeScript errors
- Ready for Phase 2 or end-to-end verification with running backend

---

*Phase: 001-hermes-orchestration*
*Completed: 2026-07-09*

## Self-Check: PASSED

- [x] All key files exist on disk (7/7 verified)
- [x] All 3 task commits present in git log
- [x] TypeScript compilation passes (zero errors)
- [x] All 52 frontend tests pass (5 test files)
- [x] No deletions in any commit
