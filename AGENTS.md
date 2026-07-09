# AGENT.md — Repora

> Build spec for **Repora**, a free, self-hostable alternative to Kimi Docs / AI-native requirements-doc tools. Repora automatically drafts, structures, diagrams, and validates technical specification documents ("cahiers des charges") through a **tool-calling multi-agent orchestrator ("Hermes")**, running on a **local llama.cpp model by default** with **BYOK streaming to any cloud model** as an opt-in upgrade.

This document is the single source of truth for an autonomous coding agent (or a human dev) building Repora. It merges:
- The functional/technical spec extracted from `CSPH_Cahier_des_Charges_Memoire.md` (the source thesis — TETRATECH SERVICES SARL case study, UPY Master's project), generalized from "cahier des charges generator" into the Repora product.
- The visual system in `DESIGN.md` ("Repora Sovereign"), which is authoritative for every UI decision.
- Local-first AI stack principles (chat UI + private inference + tool-calling agents + automation, running on consumer hardware) — the same philosophy as self-hosted local-AI-stack builds, adapted here to run the *inference engine* as llama.cpp specifically rather than Ollama.

---

## 1. Product Vision

**What Repora is:** a web app where a user describes a project in plain language, and a team of specialized AI agents collaboratively produces a structured, professional specification document — complete with UML diagrams, requirement tables, and a review pass — inside a block-based collaborative editor. The output can be exported (PDF/Word) and routed to a client for one-click validation.

**Why it's different from raw ChatGPT/Claude/Gemini use:**
- No holistic document memory in a bare chatbot → sequential generation causes redundancy, contradictions, structural gaps.
- No native UML/diagram generation.
- No built-in quality/consistency review pass.
- No client-facing validation workflow.

**Why it's different from Notion/Google Docs/Confluence:** those are generic collaboration surfaces with no domain intelligence for requirements engineering — no guided structuring, no automatic consistency checks, no decision-support grounded in the actual needs expressed.

**Core differentiators for Repora:**
1. Multi-agent orchestration, not a single generic prompt.
2. Hybrid inference: local model (llama.cpp) for privacy-sensitive drafting by default, BYOK cloud models opt-in per project/section.
3. Native UML diagram generation (PlantUML pipeline) as first-class output, not an afterthought.
4. A structured client validation loop (single-use secure link, section-by-section accept/reject with mandatory rejection reasons).
5. Free / self-hostable — no vendor lock-in, no forced cloud spend.

---

## 2. Core Principle: "Hermes" — Tool-Calling Orchestrator + Specialized Sub-Agents

Repora's AI layer is not one big prompt. It is an **orchestrator ("Hermes")** that:
- Receives the user's intent (new project brief, a request to regenerate a section, a request for a diagram, etc.).
- Decides which specialized agent(s) to invoke, in what order, and with what tools available to each.
- Every agent is **tool-calling capable** — it doesn't just emit prose, it can call functions (fetch project context, query the requirements DB, run the PlantUML renderer, call the reviewer, write back to the document store) and loop until its sub-task is done.
- Streams intermediate state (agent status, tokens, tool calls) to the frontend in real time so the UI's "Agent Chips" (per `DESIGN.md`) can show live Idle / Thinking / Writing states.

### 2.1 Agent registry

| Agent | Responsibility | Primary tools | Typical model tier |
|---|---|---|---|
| **Orchestrator (Hermes)** | Parses intent, plans the task graph, dispatches to sub-agents, merges results, handles retries/fallbacks | `list_agents`, `dispatch_agent`, `get_project_context`, `get_document_state` | Whichever model the user has active (local or BYOK) |
| **Planner Agent** | Turns a raw brief into a structured document outline (chapters/sections), maps functional modules to sections | `get_project_brief`, `propose_outline`, `save_outline` | Local (llama.cpp) by default — fast, no sensitive leakage needed for outline shape |
| **Writer Agent ("Rédacteur")** | Drafts prose content for a given section, respects tone/register, cites project inputs | `get_section_context`, `get_similar_sections`, `write_section`, `set_section_status` | BYOK preferred for quality, local fallback |
| **UML Agent(s)** | Generates UML diagrams (use case, sequence, activity, class, deployment) as PlantUML source from structured requirements, renders to SVG/PNG | `get_requirements`, `generate_plantuml`, `render_diagram`, `save_diagram` | Split into one agent per diagram family if load requires it (matches the thesis's per-diagram-type case studies) |
| **Tables Agent** | Produces structured tables: functional/non-functional requirement matrices, use-case description tables, cost/estimation tables | `get_requirements`, `build_table`, `save_table` | Local or BYOK, deterministic formatting preferred |
| **Reviewer Agent** | Quality control pass: consistency across sections, contradiction detection, terminology alignment, completeness check against the outline | `get_full_document`, `flag_issue`, `suggest_fix`, `approve_section` | BYOK preferred (needs strongest reasoning) |

Agents are declared with a JSON schema (name, description, tool list, system prompt, allowed model tier) so the orchestrator and the Super Admin panel can enable/disable, reconfigure, or swap models per agent without code changes.

### 2.2 Tool-calling contract

All agents speak the same internal tool-call protocol (OpenAI-style `tools`/`tool_calls`, compatible with both the llama.cpp server's OpenAI-compatible endpoint and BYOK providers):

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_1",
      "type": "function",
      "function": { "name": "generate_plantuml", "arguments": "{\"diagram_type\":\"sequence\",\"requirement_ids\":[12,13]}" }
    }
  ]
}
```

The backend intercepts `tool_calls`, executes the matching nodejs with the vercel ai sdk-side function (DB read/write, PlantUML render, etc.), and returns a `tool` role message with the result, looping until the agent emits a final content message. This loop is provider-agnostic — the same code path drives local llama.cpp and any BYOK model, since both are accessed through one abstraction (§4).

---

## 3. High-Level Architecture (Three-Tier + Agent Layer)

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION — React PWA (Vite)                                 │
│  3-pane shell: Sidebar (280px) | Block Editor (max 800px) |       │
│  AI Inspector (320px)  — see §6 for full UI spec                  │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ REST + SSE/WebSocket
┌───────────────────────────────▼───────────────────────────────────┐
│  APPLICATION — nodejs with the vercel ai sdk (ts)                                      │
│  - Auth (JWT/session), RBAC                                        │
│  - Project / Document / Requirement services                       │
│  - Hermes Orchestrator + Agent Registry                            │
│  - Provider Abstraction Layer (local llama.cpp + BYOK, §4)         │
│  - PlantUML render service                                         │
│  - Export service (PDF/Word)                                       │
└───────────────────────────────┬───────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────┐
│  DATA — PostgreSQL                                                  │
│  users, projects, requirements, documents, sections, diagrams,      │
│  comments, validations, agent_configs, api_keys, audit_logs         │
└─────────────────────────────────────────────────────────────────────┘

           Local inference sidecar: llama.cpp server (OpenAI-compatible
           HTTP API, e.g. `llama-server`), reachable only from the nodejs with the vercel ai sdk
           backend — never exposed directly to the browser.
```

This mirrors the thesis's three-tier design (présentation / application / données) with the agent layer folded into the application tier, and swaps the thesis's Ollama-based local runtime for **llama.cpp directly** (`llama-server`) per project requirement, keeping the same rationale: sensitive project data can be processed without ever leaving the deployment.

---

## 4. LLM Provider Layer — Local llama.cpp + BYOK Streaming

A single internal interface, e.g. `ModelProvider.stream_chat(messages, tools, model_config) -> generator`, is implemented once per backend:

- **`LlamaCppProvider`** — talks to a local `llama-server` instance over its OpenAI-compatible `/v1/chat/completions` endpoint (`stream: true`). Default provider, zero configuration, zero API cost, data never leaves the box. Any GGUF model the operator has downloaded can be swapped in via config (no code change) — a Hermes-family tool-calling model (or any function-calling-capable GGUF) is the recommended default given the orchestrator's tool-use needs.
- **`BYOKProvider`** — generic streaming client for any OpenAI-compatible or provider-native streaming chat endpoint (OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, or any other endpoint the user points it at). The user supplies their own API key, stored encrypted at rest (§7), and picks it per-project or per-agent from the Admin panel.
- Both providers implement the exact same streaming + tool-call interface, so the Orchestrator, Planner, Writer, UML, Tables, and Reviewer agents are **provider-agnostic** — an Admin can pin "Reviewer Agent → BYOK/Claude" and "Planner Agent → local llama.cpp" independently.
- Streaming is relayed to the browser via Server-Sent Events (or WebSocket) so the UI can render tokens live and flip Agent Chip status Idle → Thinking → Writing in real time.
- Config surface (Admin panel, per thesis §II.2.2 "Administrateur Système"): temperature, top-p, presence penalty, max tokens per section, enable/disable per agent, choice of provider per agent.

```ts
class ModelProvider(Protocol):
    def stream_chat(self, messages: list[dict], tools: list[dict], **cfg) -> Iterator[dict]: ...

class LlamaCppProvider(ModelProvider):
    base_url: str = "http://localhost:8080/v1"   # llama-server
    ...

class BYOKProvider(ModelProvider):
    base_url: str          # e.g. https://api.openai.com/v1, https://api.anthropic.com/v1, ...
    api_key: str           # user-supplied, encrypted at rest
    ...
```

---

## 5. Data Model (PostgreSQL)

Derived from the thesis's MLD (Modèle Logique de Données), generalized for Repora:

- **users** — id, name, email, password_hash, role (`redacteur` / `validateur` / `admin` / `super_admin`)
- **projects** — id, owner_id, name, brief, status, created_at
- **requirements** — id, project_id, type (`functional` / `non_functional`), text, source_actor
- **documents** — id, project_id, status (`draft`/`in_review`/`validated`/`rejected`), outline (JSON)
- **sections** — id, document_id, order, title, content, status, generated_by_agent, model_used
- **diagrams** — id, project_id, type (`use_case`/`sequence`/`activity`/`class`/`deployment`), plantuml_source, rendered_url
- **comments** — id, section_id, author_id, text, resolved (bool)
- **validations** — id, document_id, validator_token (single-use secure link), decision, section_reasons (JSON), decided_at
- **agent_configs** — id, agent_name, provider (`llama_cpp`/`byok`), model_id, temperature, top_p, max_tokens, enabled
- **api_keys** — id, user_id, provider, encrypted_key, created_at
- **audit_logs** — id, user_id, action, target, timestamp

---

## 6. Actors & Permissions (from thesis §II.2.2, generalized)

| Actor | Scope |
|---|---|
| **Rédacteur** (writer/analyst) | Creates/edits projects, enters requirements, triggers agent generation, reviews drafts, submits for validation. Full access to editor canvas + generation tools + version history. |
| **Validateur** (client) | Access via single-use secure link → read-only portal. Views document section by section, clicks Validate/Reject; rejection requires a mandatory reason per contested section. |
| **Administrateur Système** | Configures LLM parameters (temperature, top-p, presence penalty), sets per-section token budgets, enables/disables agents, edits system prompts, selects providers (local/BYOK) per agent. |
| **Super Admin** | Everything above, plus user account management, BYOK API key configuration, system logs & usage metrics, backups/maintenance. |

---

## 7. Non-Functional Requirements

Carried over directly from the thesis's NFR list — these are binding constraints, not suggestions:

- **Performance** — document/diagram generation completes in a "reasonable" time; stream tokens rather than block on full completion.
- **Security** — BYOK keys encrypted at rest (e.g. Fernet/libsodium, never logged); local llama.cpp path exists specifically so sensitive project data can stay fully on-prem/offline.
- **Availability** — app must be reachable without interruption for active editing sessions.
- **Reliability** — Reviewer Agent's consistency pass exists specifically to bound hallucination/contradiction risk.
- **Maintainability** — modular agent registry; new agents/providers plug in without touching the orchestrator core.
- **Ergonomics** — simple, intuitive UI (see DESIGN.md — "Functional Minimalism").
- **Portability** — standard PWA, runs in any modern browser.
- **Scalability** — architecture must support adding agents and users without redesign; llama.cpp sidecar can be scaled/replaced independently of the nodejs with the vercel ai sdk app.

---

## 8. Frontend — React, Driven by `DESIGN.md`

`DESIGN.md` ("Repora Sovereign") is the **authoritative source** for every color, font, spacing, and shape token below — do not invent new values, pull from its front-matter.

### 8.1 Layout shell
Fixed-fluid hybrid 3-pane desktop-first grid:
- **Left Sidebar** — fixed `280px` (`spacing.sidebar-width`). Document navigation + workspace switcher.
- **Central Editor** — fluid, max-width `800px`, centered. BlockNote-based collaborative block editor.
- **Right Inspector** — fixed `320px` (`spacing.inspector-width`). Agent controls, collaboration presence, block settings.

Gutters: `24px` (`spacing.gutter`). Layout margins: `24px`–`32px` (6x–8x of the 4px base unit).

### 8.2 Visual system
- **Colors**: `primary` (`#000000` / deep navy per brand narrative — treat `primary-container` `#131b2e` as the "Deep Navy" anchor described in DESIGN.md's prose), `secondary`/`ai-vibrant` (`#0058be` / `#2563EB`) as the single AI-action accent color for anything agent-generated or agent-triggered. Background default `surface-studio` `#F8FAFC` (light mode only for v1).
- **Typography**: Geist for headings (`display-lg`, `headline-lg`, `headline-md`), Inter for body/editor text (`body-lg`/`body-md`/`body-sm`), JetBrains Mono for all agent metadata, timestamps, status labels, and system/tool-call traces (`label-md`/`label-sm`) — this is a deliberate design signal that mono = "the machine is talking."
- **Shape**: 4px (`0.25rem`) radius on buttons/inputs/chips; 8px (`0.5rem`) on panels/cards. Never sharp corners, never "consumer-rounded."
- **Elevation**: no dramatic shadows — tonal layers + 1px `#E2E8F0` borders for surfaces; a single subtle ambient shadow (`0 4px 20px -2px rgba(15,23,42,0.08)`) reserved for floating AI toolbars/context menus. Active/selected state = 2px AI Blue left-accent border, not elevation.

### 8.3 Key components to build
- **Agent Chips** — small `label-sm` mono chips, one per active agent, each with a color-coded status dot: Idle / Thinking / Writing. This is the live view into the Hermes orchestrator's dispatch state.
- **Wave Progress** — slim 4px-height progress bars, AI Blue, for parallel agent tasks (e.g. Planner + Tables running concurrently).
- **Block Editor (BlockNote)** — block hover state `#F1F5F9`; presence cursors = thin vertical line + top-aligned `label-sm` collaborator name; AI Inline Assist = floating translucent bar with 1px AI Blue border at end of block.
- **Status Badges** — small-caps mono, low-opacity (10–15%) backgrounds: gray = draft, amber = review, emerald = final (maps directly to `status-draft`/`status-review`/`status-final` tokens).
- **Tree View** (sidebar document nav) — high-density list, 4px vertical padding, chevron-based nesting.
- **Validator Portal** — a stripped-down, read-only render of the block editor (no inspector, no agent chips) behind the single-use secure link, with a persistent Validate/Reject bar and a required-reason modal on rejection per section.

---

## 9. Backend — nodejs with the vercel ai sdk API Surface (functional modules → endpoints)

Mapped directly from the thesis's functional module list (§II.2.1):

| Module | Endpoints (indicative) |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users (admin) | `GET/POST/PATCH/DELETE /admin/users` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id` |
| Document generation | `POST /projects/:id/generate` (dispatches Hermes), `GET /documents/:id`, `GET /documents/:id/stream` (SSE) |
| Diagram generation | `POST /projects/:id/diagrams`, `GET /diagrams/:id`, `POST /diagrams/:id/export` |
| Validation | `GET /validate/:token` (public, read-only), `POST /validate/:token/decision` |
| Export | `GET /documents/:id/export?format=pdf|docx` |
| Admin (agents/providers) | `GET/PATCH /admin/agents`, `GET/POST/DELETE /admin/api-keys` |
| Audit/metrics (super admin) | `GET /admin/logs`, `GET /admin/metrics` |

---

## 10. Deployment

Docker-first, matching the thesis's containerization approach:

```yaml
services:
  frontend:      # React PWA, static build served via nginx or Vite preview
  backend:       # nodejs with the vercel ai sdk + Hermes orchestrator
  db:            # postgres:17
  llama-server:  # local inference sidecar, OpenAI-compatible endpoint, GGUF model volume-mounted
```

CI/CD pipeline stages (per thesis §II.6.1): test → verify env vars/secrets (incl. BYOK key presence, never their values) → build (incl. Docker images) → deploy.

---

## 11. Roadmap (from thesis "Perspectives," reframed for Repora v-next)

- Broaden UML coverage to the full diagram family (class, use case, sequence, activity, component, deployment, state).
- Conversational assistant mode to guide requirements elicitation interactively, not just batch generation.
- Real-time multi-writer collaboration on the same document.
- Pluggable model catalog UI so BYOK providers beyond the initial set can be added by config, not code.

---

## 12. Source Notes

- Functional/actor/NFR/architecture spec generalized from the uploaded thesis (`CSPH_Cahier_des_Charges_Memoire.md`), a Master's project on AI-assisted specification-document generation (multi-agent, hybrid cloud/local architecture) — reframed here from its "cahier des charges" domain into the general-purpose Repora product.
- Visual system: `DESIGN.md` ("Repora Sovereign") — authoritative, do not deviate without updating that file first.
- Local-first inference stack philosophy (chat + private data + coding/automation agents on local hardware, cloud as opt-in) cross-checked against the referenced local-AI-stack build video as a sanity check on the local/BYOK split — Repora's specific deviation from that video is using **llama.cpp directly** (`llama-server`) rather than Ollama as the local runtime.
