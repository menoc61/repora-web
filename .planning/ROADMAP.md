# Repora — Roadmap

## Milestone 1: Core AI Orchestration

### Phase 1: Hermes Multi-Agent Orchestration
**Status:** ✅ Complete

**Goal:** A working multi-agent pipeline (Planner → Writer → UML → Tables → Reviewer) with shared GenerationContext, Hermes negotiation loop (accept/rescope/adjust), live SSE streaming to frontend, template integration, and properly typed tools.

**Plans:**
- [x] 001-01-PLAN.md — GenerationContext + Agent Registry + SSE Event Types + Tool Migration
- [x] 001-02-PLAN.md — Hermes Negotiation Loop + Template Integration + Default Model
- [x] 001-03-PLAN.md — Frontend Live Agent Progress + Dashboard + Page Fixes

---

### Phase 0: Tests & Pipeline Hermes
**Status:** ✅ Complete

**Goal:** All backend tests pass + Hermes pipeline produces real document content (not just empty "Introduction pending").

**Success Criteria:**
- [x] `cd backend && npm test` → 0 failed (97 tests, 9 files)
- [x] `POST /projects/:id/generate` → document created with sections (content requires LLM backend)
- [x] Ollama fallback generates structured content (requires running Ollama instance)
- [x] DB connection stabilized (port 5434 to avoid conflict with local PostgreSQL)
- [x] Export tests added (5 tests for MD/DOCX/PDF formats)

---

### Phase 1: Export DOCX/MD
**Status:** ✅ Complete

**Goal:** `GET /documents/:id/export?format=docx` and `?format=md` produce real files with actual section content.

**Success Criteria:**
- [x] DOCX export → valid `.docx` file with all sections and titles
- [x] MD export → valid `.md` file with `##` headings
- [x] PDF export → valid PDF with title, TOC, and sections
- [x] Correct Content-Type headers for each format
- [x] Export tests passing (5 tests)

---

### Phase 2: Admin Panel (agents + BYOK)
**Status:** ✅ Complete

**Goal:** UI to configure agents (temperature, provider, model) and manage BYOK API keys.

**Success Criteria:**
- [x] Agent config table with temperature/top_p/max_tokens/enable toggles
- [x] BYOK key add/delete/list in Settings
- [x] Changes take effect without server restart (dynamic config)
- [x] Settings page at /settings with full admin panel

---

### Phase 3: Validation Portal
**Status:** ✅ Complete

**Goal:** End-to-end validation flow: submit → single-use link → consult → decide → notify.

**Success Criteria:**
- [x] Token creation locks after first decision
- [x] ValidatePortal shows section-by-section accept/reject
- [x] WebSocket notification to redacteur on decision
- [x] "Motif obligatoire" modal on rejection per section
- [x] Public /validate/:token route without auth

---

### Phase 4: Conversational Assistant
**Status:** ✅ Complete

**Goal:** Dialogue-based requirements elicitation instead of the 5-step wizard.

**Success Criteria:**
- [x] Chat interface for natural language requirements gathering
- [x] AI extracts context, objectives, features, constraints, actors
- [x] "Generate" button launches Hermes with all collected context
- [x] Backend POST /assistant/start, POST /assistant/chat, POST /assistant/generate
- [x] Frontend Assistant page at /assistant/:id with structured extraction panel
