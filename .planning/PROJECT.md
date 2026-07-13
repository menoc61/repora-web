# Repora

## What This Is

Repora is a self-hosted PWA that automatically generates professional technical specification documents ("cahiers des charges") using a multi-agent AI orchestrator. A user describes a project in plain language, and specialized AI agents (Planner, Writer, UML, Tables, Reviewer) collaboratively produce a structured document with UML diagrams, requirement matrices, and quality review — inside a collaborative block editor. Documents can be exported (PDF/DOCX/MD) and routed to clients for one-click validation via single-use secure links.

## Core Value

A user should be able to describe a project in plain language and get a complete, professional specification document — with diagrams, tables, and a review pass — without ever needing to understand the underlying multi-agent pipeline.

## Business Context

- **Customer**: Technical consultants, business analysts, and dev shops who write specifications for clients
- **Revenue model**: Free / self-hostable (open-source); potential future hosted tier
- **Success metric**: Documents generated end-to-end with all sections populated (not "pending")
- **Strategy notes**: Differentiator is multi-agent orchestration + local-first (BYOK opt-in) + structured client validation loop

## Requirements

### Validated

- ✓ User authentication (JWT) with RBAC (super_admin, admin, redacteur, validateur) — existing
- ✓ Project CRUD with requirements management (functional + non-functional) — existing
- ✓ Onboarding wizard (5-step requirements elicitation: context, functional, non-functional, actors, config, review) — existing
- ✓ Hermes multi-agent pipeline (Planner → Writer → UML → Tables → Reviewer) with SSE streaming — existing
- ✓ Document generation with resume support + fallback content — existing
- ✓ DOCX export (professional document with cover page, TOC, diagrams, tables, callouts) — existing
- ✓ PDF export (via LibreOffice conversion + PDFKit fallback) — existing
- ✓ Markdown export — existing
- ✓ Client validation portal (single-use token, section-by-section accept/reject, mandatory rejection reasons) — existing
- ✓ Conversational assistant for natural language requirements gathering — existing
- ✓ Admin panel (agent configuration, BYOK API key management) — existing
- ✓ Real-time collaborative editing (Y.js + WebSocket) — existing
- ✓ PlantUML diagram generation (use case, sequence, activity, class, deployment) — existing
- ✓ Template gallery with 7 templates — existing
- ✓ Document version history with restore — existing
- ✓ S3/minIO export caching — existing
- ✓ Docker deployment (frontend:3000, backend:8001, db:5434, minio:9000) — existing
- ✓ 97 backend integration tests — existing
- ✓ 8 Ollama models discovered at runtime with tool-call probing — existing

### Active

- [ ] COVER-01: Fix DOCX cover page background images in Docker (path resolution broken — `process.cwd()` going up one level doesn't work in containerized environment)
- [ ] PDF-01: Install LibreOffice in backend Docker image for proper DOCX→PDF conversion (currently falls back to PDFKit)
- [ ] S3-01: Fix S3 service to lazy-init the SDK client once instead of re-importing on every function call
- [ ] TEST-01: Fix 3 failing tests (2 Zod validation error code mismatches, 1 French detection heuristic)
- [ ] CLEAN-01: Delete unused assets (`public/assets/body_bg.png`, `cover.html`, `body.html`, `backcover.html`)
- [ ] CLEAN-02: Remove duplicate export route (`/export/documents/:id` — only `/documents/:id/export` should exist)
- [ ] CACHE-01: Decouple version history from audit logs (dedicated version table instead of storing snapshots in `auditLogs.metadata`)
- [ ] COVER-02: Make DOCX cover page reflect user's document type selection from onboarding config (currently hardcoded "CAHIER DES CHARGES")
- [ ] TEST-02: Add S3 service tests (mocked minIO client)
- [ ] TEST-03: Add export DOCX builder tests (fixture data → assert buffer validity)
- [ ] TEST-04: Add validation portal E2E flow tests
- [ ] TEST-05: Add onboarding wizard API integration tests

### Out of Scope

- Mobile app (native) — responsive PWA sufficient for v1
- Multi-tenancy / SaaS — self-hosted only for now
- Real-time multi-writer collaboration on the same document simultaneously — single-writer with Y.js presence is sufficient
- Full-text search engine (ElasticSearch) — PostgreSQL ILIKE search is adequate
- i18n beyond French — French-first for the target market
- Ollama as inference runtime — llama.cpp used directly (per AGENTS.md)

## Context

Repora is built on Node.js 22 + Express 5 + React 19 + TypeScript + PostgreSQL 17. The AI layer uses the Vercel AI SDK v7 with 5 specialized agents. Default LLM provider is Ollama (local), with BYOK opt-in for cloud models.

### Current State (from codebase mapping)

- **Stack**: React 19 + Vite 5 + TanStack Router + Zustand 5 + shadcn v4 frontend; Node 22 + Express 5 + Drizzle ORM backend
- **Tests**: 97 backend tests (3 failing), 4 frontend test files
- **Infrastructure**: Docker Compose with 4 services (frontend, backend, db, minio) + Ollama on host
- **Pipeline**: Full 5-stage Hermes pipeline with resume, fallback content, quality evaluation, and rescope loop
- **Known issues**: 3 test failures, Docker cover images broken, no LibreOffice in Docker, S3 dynamic imports wasteful, unused assets

## Constraints

- **Tech stack**: Node.js 22 + Express 5 + React 19 + PostgreSQL 17 — no major stack changes without discussion
- **Deployment**: Docker-first — all features must work in Docker Compose deployment
- **Local-first**: Must work fully offline with local Ollama (BYOK is opt-in upgrade, not a dependency)
- **Language**: French — all UI text, generated content, and documentation is in French
- **Performance**: Token streaming must stay real-time; no blocking on full completion
- **Security**: BYOK API keys encrypted at rest (AES-256-GCM); local inference pathway for sensitive data
- **Ollama**: Backend depends on `ollama list` for model discovery; must handle missing Ollama gracefully

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| llama.cpp (not Ollama) as local runtime | AGENTS.md spec — direct llama-server for privacy | — Pending |
| Vercel AI SDK v7 for provider abstraction | Provider-agnostic tool-calling + streaming | ✓ Good |
| Hermes orchestrator over single prompt | Prevents redundancy, contradictions, structural gaps | ✓ Good |
| PlantUML for diagrams | Standard, text-based, renderable via public API | ✓ Good |
| Drizzle ORM over Prisma | Lighter, SQL-first, better migration DX | ✓ Good |
| BlockNote over TipTap directly | Block-based UX better for structured documents | ✓ Good |
| PDF via LibreOffice conversion | Better PDF output than PDFKit alone | ⚠️ Revisit — not installed in Docker |
| Cover images via `../public/assets/` path | Simple in dev but broken in Docker | ⚠️ Revisit — needs Docker-aware path |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-13 after initialization*
