# SDD Progress Ledger — Wave 1: Authoring Core

Branch: wave1-authoring-core
Baseline (pre-Wave-1 working tree): fec96e17978bb2f55c119fc7536da0262b4a64fc
Plan: docs/superpowers/plans/2026-07-10-repora-authoring-core.md

## Tasks

Task 1: complete (commits 2ba9d39 + baseline fec96e1, review: extraction clean ✅; "scope creep" finding adjudicated as pre-existing prior-session diagram code, not introduced by task; implementer transparency gap = Minor note)
Task 2: complete (commit defce77, review: Approved; all 5 components extracted, behavior preserved; Minor: dead imports + StrictMode effect nitpick)
Task 3: complete (commit 70b72c2 DiagramPanel extracted; follow-up fix invalidates ['diagram', id]; review: extraction Approved, refresh-needs-fix adjudicated as pre-existing empty-source no-op, fix applied). NOTE: Generer button is a known placeholder (frontend sends source:'' so backend stores empty rendered_url; real UML rendering happens via Hermes saveDiagram during generation).
Task 4: complete (commit 85445a7, review: Approved; barrel created, orchestrator slimmed, dead AgentStatus/relativeTime removed)
Task 5: complete (commit 6343196, review: Approved; VersionHistory decomposed into 5 sub-components + types + barrel; retentionDays prop addition is correct/necessary, dead useNavigate removed)
Task 6: complete (commit 42b540b Sharing decomposed + 7b6c3xx parity fix: Retirer button now gated on removeCollabMutation.isPending; review: Approved, hooks preserved exactly, structural-only)
Task 7: complete (commit 3aaee84, review: Approved; wizard decomposed into 5 steps + ActorModal + View; hooks/api wiring preserved exactly; pre-existing generating-unread noted, not introduced)
Task 8: complete (commits e8534d6 + 4957818 + 2c4b-partiy fix; review: Approved; useActivity wired (empty-state fallback kept), table-class fix, status-filter page-reset removed for exact parity; @/ vs ../ import convention noted cosmetic)
Task 9: complete (commit 5d1fa00, review: Approved; workspace decomposed into 7 sub-components + activity util; onOpen navigate redundancy benign/idempotent; inert inner key noted cosmetic)
Task 10: complete (commit 87506f3, review: Approved; template-gallery decomposed into 6 sub-components + View; TemplateItem rename applied, import depth corrected; isPending label nuance cosmetic)
Task 11: complete (commit 8fa97e8, review: Approved; DESIGN.md token enforcement across Wave-1 files (red->error-container, amber->status-review, green->status-final, purple->tertiary-fixed, slate->surface-*, blue->secondary-container); French audit clean; #2563EB functional CSS value left; out-of-scope primitives untouched; all mapped tokens verified in tailwind.config.js)
FINAL REVIEW (commit 8fa97e8, whole branch fec96e1..HEAD): READY TO MERGE. Decomposition integrity OK (6/7 pages are 1-line View wrappers; Editor is deliberate orchestrator delegating to 6 sub-components). Hook audit: useAcceptChanges(VersionHistory) correct, useActivity(DocumentLibrary) wired, useProjects(WorkspaceDashboard) correct, useDiagram/useCreateDiagram(Editor) per-id refresh correct, all useX imports resolve. Build: tsc+vite green. Residual minors: useApplyPatch dead export (harmless), onOpenProject setActiveView('editor')+navigate /onboarding (faithful to original), #2563EB functional CSS value. None blocking.
