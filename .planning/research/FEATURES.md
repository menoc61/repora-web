# Feature Landscape

**Domain:** AI-powered multi-agent specification document generation
**Researched:** 2026-07-13
**Comparison set:** Kimi Docs (K2.6), Notion AI (3.6), Google Docs (Gemini 2026), Claude Projects/Artifacts, ChatGPT Canvas

---

## Table Stakes

Features users expect in any AI document generation tool in 2025–2026. Missing these = product feels incomplete or amateur.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| 1 | **Natural-language document generation** | Every competitor (Kimi Docs, Notion AI, Google Gemini, Claude, ChatGPT Canvas) offers this. User types a prompt → AI produces structured output. Without it, you're not an AI doc tool. | Medium | Repora has this via the onboarding wizard → planner pipeline. The UX should also support ad-hoc single-shot generation (not just the 5-step wizard). |
| 2 | **Long document support (10K+ words)** | Kimi Docs explicitly markets 10,000-word generation. Claude handles 200K tokens. Spec docs routinely run 20-50 pages. Repora must handle this without context degradation or token limits. | High | The multi-agent pipeline with section-level generation naturally scales. Needs testing at 50+ sections. |
| 3 | **Multi-format export (PDF, DOCX, MD)** | Every tool exports to at least PDF and DOCX. Kimi adds PPT and Excel. Notion exports to PDF/MD. This is non-negotiable for deliverable handoff. | Medium | Repora has PDF (via LibreOffice + PDFKit fallback), DOCX, and MD. PDF-01 (LibreOffice in Docker) is blocking proper PDF output. |
| 4 | **Format conversion (import → cleanup → export)** | Kimi Docs makes this a headline feature: PDF → editable DOCX, PPT → Word, Excel → report. Users expect to upload a messy brief and get a clean spec. | Medium | Not explicit in Repora's current scope. The onboarding wizard collects requirements but doesn't accept uploaded briefs for restructuring. |
| 5 | **Persistent project context / knowledge base** | Claude Projects, Notion AI, and Google Gemini all maintain a persistent knowledge base across sessions. Without it, every generation starts from zero. | Medium | Repora has project-level context via requirements tables. Could be strengthened: allow uploading reference PDFs/DOCXs as project knowledge. |
| 6 | **Block-based or structured document editing** | Notion's block editor, Claude's Artifacts, ChatGPT Canvas all provide structured editing. Plain text editing in a spec tool is unacceptable in 2026. | Medium | Repora uses BlockNote. Existing and good. The block hover, presence cursors, and AI inline assist (per DESIGN.md) need implementation. |
| 7 | **Real-time collaborative editing** | Google Docs built the expectation. Notion and others now support it. Multiple writers on the same spec is a baseline expectation. | High | Repora has Y.js + WebSocket collaboration (validated). The in-memory Yjs documents risk data loss on server restart (see CONCERNS.md). |
| 8 | **Version history with restore** | Every document tool has this. Spec docs change frequently; the ability to revert is table stakes. | Low | Repora has this (validated). The audit-log coupling is a tech debt item (CACHE-01). |
| 9 | **Template gallery** | Starting from a blank page is painful. Templates reduce the activation barrier. Kimi has "Make one like this." Notion has page templates. | Low | Repora has 7 templates (validated). The gallery UI in the onboarding flow needs polish. |
| 10 | **AI-powered review / editing suggestions** | Google Gemini offers "Match writing style" and polish suggestions. Notion AI offers inline rewrite. Kimi offers expert comments. Without this, the AI feels like a one-shot generator, not a writing partner. | Medium | Repora's Reviewer agent does a full consistency pass post-generation. Missing: inline per-section rewrite during editing. The Reviewer is batch, not interactive. |
| 11 | **Markdown / rich text paste support** | Users copy from other tools. The editor must handle rich paste, code blocks, tables, lists, and links from Word/MD sources. | Low | BlockNote handles most of this. Needs testing with French-spec formatting (bullet styles, numbering). |
| 12 | **Browser-based (PWA)** | Users won't install native apps for a web tool. PWA with offline capability is expected. | Medium | Repora is a React PWA (validated). Offline support is not explicitly scoped but should be considered for consultants without reliable internet. |

---

## Differentiators

Features that set a product apart. Not expected from every tool, but valued enough to drive adoption.

### Strategic Differentiators (Repora Already Has These)

| # | Feature | Value Proposition | Complexity | Competitive Context |
|---|---------|-------------------|------------|---------------------|
| D1 | **Multi-agent orchestrator (Hermes)** with specialized agents (Planner, Writer, UML, Tables, Reviewer) | No competitor offers spec generation with *role-specialized agents* doing a handoff workflow. Kimi has Agent Swarm (300 parallel agents) but they are general-purpose, not domain-specialized. Claude has Sub-agents but no built-in spec pipeline. This is Repora's primary moat. | Very High | Kimi K2.6 Agent Swarm (300 general agents); Claude Code sub-agents (generic); BMAD/GSD (SDD frameworks, not products). Repora is the only *product* with a baked-in spec-writing agent team. |
| D2 | **Native UML diagram generation** (use case, sequence, activity, class, deployment) | Competitors can generate diagrams (Notion AI image generation, Claude SVG artifacts) but none generate PlantUML *from requirements* as a first-class document output. Kimi may generate charts but not UML. | High | Notion AI can generate "diagrams and flowcharts" via image gen; Claude creates SVG artifacts. Neither produces UML from structured requirements. Repora's PlantUML pipeline is purpose-built for specs. |
| D3 | **Client validation portal** (single-use token, section-by-section accept/reject, mandatory rejection reasons) | Uniquely bridges the gap between "draft written" and "client approved." No competitor offers a structured validation workflow. This is a genuine product innovation for consultants. | Medium | No competitor has anything like this. Kimi/Notion/Google/Claude all stop at "here's your document." The validation loop is Repora's strongest B2B differentiator. |
| D4 | **Self-hostable + local-first inference** (llama.cpp default, BYOK opt-in) | For defense, government, and enterprise clients who cannot send sensitive spec data to cloud AI APIs. Kimi/Notion/Google/Claude are all cloud-only or hybrid at best. | Medium | Ollama/llama.cpp self-hosting exists in the ecosystem but no spec-doc tool offers it. Repora's local-first stance is a compliance-driven differentiator for sensitive industries. |
| D5 | **Onboarding Wizard (5-step requirements elicitation)** → structured requirements DB → generated document | The wizard pre-structures the user's thinking before generation begins. Competitors accept a prompt and generate. Repora guides the user through Context → Functional Reqs → Non-Functional → Actors → Config before generating. This produces better, more complete specs. | Medium | Google's "Help me create" and Kimi's "Make one like this" are simpler. Repora's structured elicitation produces more rigorous outputs. |
| D6 | **Agent status transparency** (Agent Chips with Idle/Thinking/Writing states) vs black-box generation | Claude streams tokens but doesn't show "Planner is thinking → Writer is drafting Section 3 → UML Agent is building a sequence diagram." Repora's SSE streaming with agent-level status creates trust and reduces user anxiety during long generations. | Low | Streaming is universal; showing *which agent is doing what* is not. This builds confidence in the process. |

### Differentiators Repora Could Add

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D7 | **Ad-hoc AI editing within the block editor** (inline rewrite, expand, summarise per section) | Currently the Reviewer does a batch quality pass. Adding per-section AI commands ("Rewrite this in formal tone", "Expand the technical requirements", "Summarize this paragraph") makes the editor feel alive. Kimi and Notion AI both offer inline AI actions. | Medium | BlockNote supports slash commands. Wire the AI SDK to allow section-level tool calls from the editor. Low risk, high perception value. |
| D8 | **Reference document upload** (upload a PDF/DOCX brief → AI extracts requirements → populates the wizard) | Currently users type requirements manually in the wizard. Letting them upload an existing RFP, brief, or draft and having the Planner agent extract structured requirements would cut onboarding time by 80%. | Medium | Kimi's key feature is format conversion. This is the spec-domain equivalent. |
| D9 | **Multi-model selection per agent** (choose Claude for Reviewer, local model for Planner) | Notion Agent now lets users pick Claude Sonnet 5, GPT, Gemini, or Grok per session. Repora should expose this at the agent level in the Admin panel. The provider abstraction layer already supports it — needs UI. | Low | The LLM provider layer already supports per-agent configuration. The Admin panel needs a model selector per agent row. |
| D10 | **"Deep Research" mode** (web-search augmented requirements research) | Notion has Research Mode. Kimi has Deep Research (10K-word reports). Repora should offer a mode where the Planner agent web-searches for industry standards, regulations, or best practices before generating the outline. | Medium | Requires connecting a web search tool (Tavily/Exa/Perplexity) to the Planner agent's toolset. |
| D11 | **Pre-built spec templates for regulated industries** (GDPR, ISO 27001, SOC 2, etc.) | Repora's template gallery has 7 templates. Adding industry-standard compliance spec templates would attract enterprise consulting clients who write the same compliance docs repeatedly. | Low-Medium | Templates are defined as JSON outlines. Adding new ones is content work, not engineering. |
| D12 | **Side-by-side diff view for version comparison** | Kimi Docs highlights side-by-side diffs. Repora's version history stores snapshots but doesn't show what changed between versions visually. For spec documents, knowing what changed between draft v3 and v4 is critical for review. | Medium | The version restore endpoint exists. A diff component comparing two section versions is needed. |

---

## Anti-Features

Features to explicitly NOT build. Attempting them would dilute focus or create maintenance burden without proportional value.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| A1 | **Fully autonomous generation with no human review** (trust the AI end-to-end) | The #1 failure mode in AI content tools (see Anti-Slop Framework). Every case study shows AI-generated specs need human review. Building "generate and ship" features would undermine trust in the validation portal. | Keep the Reviewer agent as a quality gate. Always show generation status and allow edit before validation. Never auto-publish to the client portal. |
| A2 | **Multi-tenant SaaS billing / subscription management** | Per PROJECT.md: out of scope. Adding Stripe billing, plan tiers, usage limits, and tenant isolation adds 6+ months of engineering with zero differentiation for a self-hosted product. | Self-host only. If a hosted tier ever materializes, it's a separate conversation. |
| A3 | **Native mobile apps (iOS/Android)** | PWA covers mobile use. Native apps add 2x build overhead per platform. Consultants work on laptops, not phones, for spec writing. | Keep the PWA responsive. Test on iPad/tablet. Do not invest in native app builds. |
| A4 | **Full-text search engine (ElasticSearch/MeiliSearch)** | PostgreSQL ILIKE with FTS is adequate for the document volumes Repora handles (hundreds, not millions of docs). Adding a search engine adds infrastructure complexity. | Use PostgreSQL full-text search if ILIKE becomes insufficient. |
| A5 | **i18n / localization beyond French and English** | Target market is French-speaking consultants. Adding Spanish/German/Japanese would multiply UI strings, translations, and RTL support with no current audience. | French-first. English for code/API. Do not build an i18n framework expecting 10 languages. |
| A6 | **Real-time multi-writer simultaneous editing** | Repora already has Y.js collaboration. Adding Google-Docs-level multi-cursor with presence for ALL users simultaneously is a massive UX and infrastructure investment (persistent Yjs backend, conflict resolution, presence awareness). | Current single-writer-with-presence is sufficient. The collaboration is for consulting teams of 2-3, not Notion-scale workspaces. |
| A7 | **General-purpose website builder / app builder** | Kimi K2.5 markets website generation from prompts. This is a fundamentally different product (Vercel/Replit competitor). Building it would split Repora's identity. | Stay focused on spec documents. If users want to build a prototype from the spec, export to a dev tool. |
| A8 | **Slack/Teams/Slack connector for notifications** | Notion AI Connectors integrate Slack and Google Drive. For Repora's use case (consultant → client), notifications should happen via email (validation link sent to client). Adding chat connectors over-engineers the notification system. | Email notifications for validation portal invites. Keep it simple. |
| A9 | **AI image generation (DALL-E/Midjourney integration)** | Notion AI offers image gen for diagrams. Repora already generates UML diagrams from requirements. Adding general-purpose image generation (for covers, illustrations) is a nice-to-have that opens a moderation can of worms. | Stick with PlantUML for diagrams. Cover images can be uploaded by the user. |
| A10 | **"AI block" reusable pattern (Notion-style repeatable AI component)** | Notion AI Blocks are powerful but require a component system for embedding AI queries inside documents. BlockNote doesn't natively support this, and building it adds significant complexity for a feature most spec writers won't use. | Keep AI interaction at the section and document level, not the inline block level. |

---

## Feature Dependencies

```
Table Stakes:
  Block-based editing (T6) ← BlockNote integration (existing)
  Multi-format export (T3) ← DOCX builder + PDF renderer (existing, needs Docker fix)
  Version history (T8) ← Dedicated version table (CACHE-01) blocks full reliability
  Real-time collab (T7) ← Yjs persistence layer (currently in-memory, at risk)

Differentiators:
  Multi-agent pipeline (D1) ← All 5 agents working (existing)
  → UML diagrams (D2) ← Requirements DB + PlantUML renderer (existing)
  → Client validation portal (D3) ← Document generation + secure token flow (existing)
  
  Inline AI editing (D7) ← BlockNote + AI SDK tool calls (needs new integration)
  Reference doc upload (D8) ← PDF/DOCX parsing pipeline (needs new service)
  Multi-model selection (D9) ← Admin panel model selector UI (minor extension)
  Deep Research mode (D10) ← Web search tool integration (new tool)

Pipeline Order (Mandatory):
  Requirements collection → Onboarding wizard → Planner → Writer → UML → Tables → Reviewer
  Any attempt to parallelize Writer sections depends on: section-independence analysis
```

---

## MVP Recommendation (for "what to build next" prioritization)

### Immediate Priority (Current Bugs Blocking Existing Value)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Fix PDF-01 (LibreOffice in Docker) | PDF export is table stakes and currently falls back to inferior PDFKit |
| P0 | Fix COVER-01 (DOCX cover page paths) | Broken in Docker = DOCX export broken in production deployment |
| P0 | Fix 3 failing tests (TEST-01) | Failing CI erodes confidence in all features |

### Next: Fill Table-Stakes Gaps (Weeks 1-3)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P1 | **Reference document upload** (D8) | Biggest UX gap vs Kimi Docs. Users shouldn't retype their brief. |
| P1 | **Inline AI editing** (D7) | Per-section rewrite/polish makes the editor feel alive. Notion and Kimi both have this. |
| P1 | **Model selector per agent** (D9) | Admin panel extension. Low effort, high power-user value. |
| P2 | **Side-by-side version diff** (D12) | Version history exists but you can't *see* what changed. Essential for review workflow. |

### Next: Build Differentiator Moat (Weeks 4-8)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P2 | **Deep Research mode** (D10) | Differentiator that competitors can't easily replicate in the spec domain |
| P2 | **Industry compliance templates** (D11) | Locks in enterprise consulting users |
| P3 | **Parallelize Writer stage sections** | Performance optimization for the pipeline. Richer documents generate faster. |

### Defer Indefinitely

| Feature | Reason |
|---------|--------|
| Multi-tenant SaaS billing (A2) | Outside product scope |
| Native mobile apps (A3) | PWA is adequate; consultants use laptops |
| Full-text search engine (A4) | PostgreSQL ILIKE is sufficient |
| i18n beyond French + English (A5) | Target market is French-speaking |
| AI image generation (A9) | UML diagrams cover the diagram use case |
| Notion-style AI blocks (A10) | Section-level AI is sufficient for spec docs |

---

## Competitive Positioning Summary

```
                     General-purpose docs             Spec-document domain
                     ─────────────────────             ────────────────────

High autonomy      Kimi K2.6 Agent Swarm                [GAP]
(300 sub-agents)   Notion AI Agent                      [No pure-play
                    Claude Projects + Skills              spec generator exists]
                    Google Gemini
                           │
                           │ All produce "a document"     All produce "a draft"
                           │ but NOT a validated spec    but NOT a validated spec
                           │ with client sign-off        with client sign-off
                           │
Low autonomy        ─────────────────────             ────────────────────
(manual drafting)   Traditional Word/Google Docs        Repora ← HERE
                                                        (Post-validation portal)
                                                        Multi-agent pipeline
                                                        UML + requirements tables
                                                        Client validation loop
```

**Repora occupies a unique position:** it's the only tool that covers the *full lifecycle* from requirements elicitation → spec generation → quality review → client validation. Every competitor stops at "here's your document." Repora continues to "here's your client's signed-off approval."

---

## Sources

- Kimi Docs feature page (kimi.com/features/docs) — HIGH confidence, official source
- Kimi K2.5 release notes (kimi.com/ai-models/kimi-k2-5) — HIGH confidence, official source
- Kimi K2.6 Agent overview (kimi.com/help/agent/agent-overview) — HIGH confidence, official source
- Notion AI product page (notion.com/product/ai) — HIGH confidence, official source
- Notion Agent documentation (notion.com/help/notion-agent) — HIGH confidence, official source
- Notion 3.6 release (notion.com/releases/2026-07-01) — HIGH confidence, official source
- Google Gemini Docs update (workspace.google.com/blog, March 2026) — HIGH confidence, official source
- Claude Projects documentation (support.claude.com) — HIGH confidence, official source
- Claude Artifacts documentation (support.claude.com) — HIGH confidence, official source
- Anti-Slop Framework (jawhnycooke.ai/blog/anti-slop-framework) — MEDIUM confidence, practitioner expertise
- AI Engineering Pitfalls (huyenchip.com, 2025) — HIGH confidence, established expert
- SDD tool landscape comparisons (Medium/Reenbit, May 2026) — MEDIUM confidence, practitioner analysis
- Cowork Forge multi-agent analysis (dev.to, Jan 2026) — MEDIUM confidence, vendor comparison
