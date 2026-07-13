<!-- refreshed: 2026-07-13 -->
# Architecture

**Analysis Date:** 2026-07-13

## System Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION — React SPA (Vite + TanStack Router)                     │
│  [3-pane shell: Sidebar(280px) | Editor(max 800px) | Inspector(320px)] │
│  ┌─────────────────────┬─────────────────────┬──────────────────────┐   │
│  │ pages/ (11 routes)  │ components/ (50+)   │ hooks/ (7 custom)    │   │
│  │ stores/ (zustand)   │ api/client.ts       │ schemas/ (zod)       │   │
│  └─────────┬───────────┴─────────┬───────────┴──────────┬───────────┘   │
│            │ HTTP REST + SSE     │ WebSocket (collab)   │                │
└────────────┼─────────────────────┼──────────────────────┼───────────────┘
             │                     │                      │
┌────────────▼─────────────────────▼──────────────────────▼───────────────┐
│  APPLICATION — Express.js on Node.js (backend/src/index.ts)              │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │
│  │ middleware/     │  │ routes/ (17)     │  │ services/ (16)         │   │
│  │ auth + error   │  │ REST endpoints   │  │ business logic layer   │   │
│  │ + validate     │  │                  │  │                        │   │
│  └────────────────┘  └────────┬─────────┘  └───────────┬────────────┘   │
│                               │                        │                │
│  ┌────────────────────────────▼────────────────────────▼────────────┐   │
│  │  AI LAYER — Hermes Orchestrator (backend/src/ai/)                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐   │   │
│  │  │hermes.ts │ │pipeline/ │ │agents/  │ │tools/    │ │providers│   │   │
│  │  │runner    │ │orchestrate│ │registry │ │document  │ │interface│   │   │
│  │  │+ events  │ │+negotiate│ │5 agents │ │diagram   │ │6 types  │   │   │
│  │  └──────────┘ └──────────┘ └─────────┘ └──────────┘ └────────┘   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                              │                                            │
│  ┌───────────────────────────▼──────────────────────────────────────────┐ │
│  │  COLLABORATION — WebSocket (backend/src/collaboration/ws.ts)          │ │
│  │  Yjs CRDT + y-websocket for real-time multi-user editing             │ │
│  │  Notification broadcast channel for generation status updates        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────────────┐
│  DATA — PostgreSQL + Drizzle ORM                                           │
│  Tables: users, projects, requirements, documents, sections, diagrams,     │
│          comments, validations, templates, agent_configs, api_keys,       │
│          audit_logs, assistant_sessions                                    │
│                                                                            │
│  STORAGE: S3-compatible (MinIO) for exports + local uploads/ for diagrams │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE — Docker Compose                                           │
│  frontend(:3000) ← nginx ←→ backend(:8001) ←→ postgres(:5434) + minio(:9000) │
│  External: llama.cpp (:8080) / Ollama (:11434) for local inference          │
└────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Router | SPA routing, auth guards, lazy loading | `src/router.tsx` |
| Zustand Stores | Client state (auth, settings, workspace, generation sessions) | `src/stores/` |
| API Client | HTTP+REST + SSE streaming helper | `src/api/client.ts` |
| Custom Hooks | Data fetching wrappers (React Query) + WebSocket collab | `src/hooks/` |
| Page Components | Route-level components (Editor, Dashboard, Library, etc.) | `src/pages/` |
| Layout Components | Sidebar, TopBar, RootLayout wrapper | `src/layout/` |
| Express Routes | REST endpoint handlers, 17 route modules | `backend/src/routes/` |
| Services | Business logic layer, wraps DB queries + external APIs | `backend/src/services/` |
| Auth Service | JWT token creation/verification + bcrypt password hashing | `backend/src/services/auth.service.ts` |
| Hermes Orchestrator | Multi-agent pipeline runner, event streaming, model discovery | `backend/src/ai/hermes.ts` |
| Pipeline Orchestrate | 5-stage generation pipeline with resume detection | `backend/src/ai/pipeline/orchestrate.ts` |
| Agent Registry | Declares 5 agents with system prompts, tools, model defaults | `backend/src/ai/agents/registry.ts` |
| Agent Tools | Document read/write, diagram save, review, table tool functions | `backend/src/ai/tools/` |
| Provider Interface | LLM provider abstraction (6 providers) | `backend/src/ai/providers/interface.ts` |
| Pipeline Negotiate | Quality evaluation + rescope loop breaker | `backend/src/ai/pipeline/negotiate.ts` |
| Collaboration WS | Yjs WebSocket server for real-time editing | `backend/src/collaboration/ws.ts` |
| DB Schema | 13 PostgreSQL tables defined via Drizzle ORM | `backend/src/db/schema.ts` |
| Config | Centralized env-based configuration | `backend/src/config.ts` |

## Pattern Overview

**Overall:** Layered architecture (Presentation → Application → Data) with an integrated AI agent layer.

The frontend is a React SPA communicating with the backend via HTTP REST (TanStack React Query), Server-Sent Events (generation streaming), and WebSocket (collaborative editing + notifications). The backend follows a classic n-tier pattern: Routes → Middleware → Services → DB, with the AI pipeline running as a separate internal layer orchestrated by Hermes.

**Key Characteristics:**
- **Frontend: SPA with file-system-like routing** — `@tanstack/react-router` with route-level code-splitting via `lazy()` imports for heavy pages (Editor, ExportPreview, OnboardingWizard, Assistant).
- **Backend: Express.js with manual DI** — Services are plain TypeScript modules; dependencies are imported directly (no IoC container). The AI layer uses lazy dynamic `import()` inside tool `execute()` functions to avoid circular imports.
- **AI Pipeline: AsyncGenerator-based streaming** — Every pipeline stage (Planner → Writer → UML → Tables → Reviewer) yields typed `HermesEvent` objects consumed via `for await...of`. Events are broadcast to SSE clients and buffered in an in-memory `Map<string, GenerationState>`.
- **Real-time collaboration: Yjs CRDT** — Document state is managed via Yjs on the server with `y-websocket` sync protocol. Awareness protocol for presence cursors.
- **State management: hybrid** — Server state via TanStack React Query, client state via Zustand with `persist` middleware (localStorage for auth token, settings, generation sessions).
- **Docker-first deployment** — All services run in containers with health checks and dependency ordering.

## Layers

**Presentation (Frontend):**
- Purpose: Browser UI — block editor, document navigation, agent inspector
- Location: `src/`
- Contains: Pages, components, hooks, stores, API client, schemas
- Depends on: Backend REST + SSE + WebSocket endpoints
- Used by: End users via browser

**Application (Backend — Routes + Services):**
- Purpose: HTTP API, business logic, auth, file export
- Location: `backend/src/routes/` + `backend/src/services/`
- Contains: 17 route modules, 16 service modules, middleware (auth, validation, error handling)
- Depends on: Database (Drizzle ORM), S3 (MinIO), PlantUML server
- Used by: Frontend SPA

**AI Layer (Hermes Orchestrator):**
- Purpose: Multi-agent document generation pipeline with LLM orchestration
- Location: `backend/src/ai/`
- Contains: Orbit runner (`hermes.ts`), pipeline orchestration (`pipeline/orchestrate.ts`), agents (`agents/`), tools (`tools/`), provider interface (`providers/interface.ts`), context state (`context.ts`), quality negotiation (`pipeline/negotiate.ts`)
- Depends on: Database, LLM providers (local llama.cpp/Ollama or BYOK), PlantUML renderer, `ai` SDK (`vercel/ai-sdk`)
- Used by: `/ai/generate` route, `/documents/:id/stream` SSE endpoint

**Data Layer:**
- Purpose: Persistence
- Location: `backend/src/db/`
- Contains: Drizzle schema (`schema.ts`), DB client (`index.ts`), migrations, seed script
- Depends on: PostgreSQL, optional S3-compatible storage

**Collaboration Layer:**
- Purpose: Real-time multi-user editing
- Location: `backend/src/collaboration/ws.ts`
- Contains: Yjs WebSocket server with sync protocol, awareness, auth, notification broadcast
- Depends on: HTTP server, auth service

## Data Flow

### Primary Request Path — Document Generation

1. User clicks "Generate" in Editor → `POST /api/projects/:id/generate` invoked via `useGenerateDocument()` mutation (`src/hooks/useQueries.ts`)
2. Backend route handler → calls `initiateGeneration()` (`backend/src/ai/hermes.ts`)
3. Pipeline starts in background — `orchestrateGeneration()` (`backend/src/ai/pipeline/orchestrate.ts`) runs 5 stages sequentially:
   - **Stage 1: Planner** — calls `runAgent('Planner', ...)` → LLM generates outline JSON → `createSectionsFromOutline()` persists to `sections` table
   - **Stage 2: Writer** — iterates each section, calls `runAgent('Writer', ...)` → LLM writes prose → `writeSection` tool persists to DB
   - **Stage 3: UML** — calls `runAgent('UML', ...)` → LLM generates PlantUML source → `saveDiagram` tool renders via PlantUML server → image URLs injected into section content
   - **Stage 4: Tables** — calls `runAgent('Tables', ...)` → LLM generates requirement matrices → `saveRequirementSection` tool persists as sections with order >= 100
   - **Stage 5: Reviewer** — calls `runAgent('Reviewer', ...)` → LLM audits all sections → flags/suggests/approves via tools → updates document status to `reviewed`
4. Each agent yields `HermesEvent` events — buffered in `GenerationState` and broadcast to SSE listeners
5. Frontend subscribes via `GET /documents/:id/stream` SSE endpoint → `useDocumentStream()` hook processes events → `AgentProgressPanel` renders live status

### Resume Flow (Partial Generation)

1. `detectResumeStage()` (`backend/src/ai/pipeline/orchestrate.ts:54`) inspects DB state — checks for outline, section content, diagrams, and stored `_pipelineStage`
2. Returns the correct resume stage (`planner | writer | uml | tables | reviewer`)
3. Pipeline skips completed stages and resumes from the detected stage

### Collaborative Editing Flow

1. User opens Editor → `useCollabStatus()` hook connects WebSocket to `/collab/:docId?token=JWT`
2. Yjs document state synced via `y-protocols/sync` — server holds authoritative `Y.Doc`
3. Awareness protocol broadcasts presence (cursors, selection) to all clients in the room
4. Changes broadcast to all connected clients via WebSocket

### Validator Portal Flow

1. Project owner generates validation link → `POST /validate/:documentId` → creates `validations` row with single-use `validatorToken`
2. Client visits `/validate/:token` (public route, no auth required)
3. `ValidatePortal` page renders read-only document content
4. Client validates/rejects section by section — rejection requires mandatory reason
5. Decision persisted to `validations` table with `section_reasons` JSON

**State Management:**
- **Server state** managed via TanStack React Query — cached, staleTime 30s, retry 1
- **Client state** managed via Zustand with `persist` middleware — `repora-auth` and `repora-settings` and `repora-generations` localStorage keys
- **Generation state** maintained in-memory in `backend/src/ai/hermes.ts` — `Map<string, GenerationState>` per documentId, buffered events, listener set for SSE broadcast
- **Yjs document state** in-memory on server per room — `Map<string, Y.Doc>` in `backend/src/collaboration/ws.ts`

## Key Abstractions

**HermesEvent (Discriminated Union):**
- Purpose: Typed streaming events from the AI pipeline to the frontend
- Examples: `backend/src/ai/hermes.ts:16-61`
- Pattern: TypeScript discriminated union with 9 variants — `agent_status`, `token`, `tool_call`, `tool_result`, `section_complete`, `context_updated`, `generation_error`, `done`

**AgentDefinition:**
- Purpose: Declarative agent configuration with system prompt, tools, and model defaults
- Examples: `backend/src/ai/agents/registry.ts:13-20`
- Pattern: Interface with `name`, `description`, `systemPrompt`, `defaultModel`, `defaultProvider`, `tools`

**ModelProvider (ProviderType):**
- Purpose: LLM provider abstraction for agnostic model access
- Examples: `backend/src/ai/providers/interface.ts:6`
- Pattern: `createProvider()` factory returns SDK client; `getLanguageModel()` returns model instance — 6 providers: `llama_cpp`, `ollama`, `openai`, `anthropic`, `google`, `openrouter`, `byok`

**GenerationContext:**
- Purpose: Shared in-memory state passed across pipeline stages
- Examples: `backend/src/ai/context.ts:42-68`
- Pattern: Plain interface with mutable fields — `outline`, `completedSections`, `diagrams`, `tables`, `metadata`, `rescopeCount`

**AppError:**
- Purpose: Structured HTTP error with status code, error code, and message
- Examples: `backend/src/middleware/error.ts:3-12`
- Pattern: Custom Error subclass thrown by services/middleware → caught by centralized `errorHandler`

## Entry Points

**Frontend:**
- Location: `src/main.tsx`
- Triggers: Browser load → `ReactDOM.createRoot` renders `RouterProvider`
- Responsibilities: Bootstraps React app, applies global CSS, mounts root layout

**Backend:**
- Location: `backend/src/index.ts`
- Triggers: Server start via `tsx src/index.ts` or Docker entrypoint
- Responsibilities: Express app setup (CORS, JSON parsing), route mounting (17 routers), error handler, model discovery (`discoverOllamaModel`), S3 bucket initialization (`ensureBucket`), HTTP + WebSocket server creation

**Router:**
- Location: `src/router.tsx`
- Triggers: Navigation events
- Responsibilities: Defines route tree (16 routes), auth guards (public path detection, `requireAuth` redirect), lazy-loaded page components, search param validation

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. All LLM calls are async I/O (HTTP to ollama/llama.cpp/BYOK). No worker threads used. Yjs document state is single-process in-memory — does not scale horizontally without additional coordination.
- **Global state:** In-memory `generationStates` Map in `backend/src/ai/hermes.ts:351` — per-document generation event buffers. In-memory `docs` Map and `rooms` Map in `backend/src/collaboration/ws.ts:15-33` — Yjs documents and WebSocket room sets. These are process-local and lost on server restart.
- **Circular imports:** Avoided via lazy `import()` inside tool `execute()` functions (e.g., `backend/src/ai/tools/document.ts:24`). The `hermes.ts` file re-exports `orchestrateGeneration` from `pipeline/orchestrate.ts` (line 361).
- **Model discovery:** Ollama model enumeration done at startup via CLI + HTTP fallback. Tool-support probed eagerly for default model, lazily for others. Name-based heuristic fallback for unprobed models.
- **Process safety:** Global `unhandledRejection` and `uncaughtException` handlers in `backend/src/index.ts:31-36` prevent one flaky provider call from crashing the server.

## Anti-Patterns

### Route Handler Logic in Index

**What happens:** All route mounting is done inline in `backend/src/index.ts:46-62` with `app.use('/path', router)` statements — 17 route mounts in a flat list.
**Why it's wrong:** Every new route requires editing the central server file. No route discovery or conventions-based loading.
**Do this instead:** Use a routes index pattern — collect all route modules in `backend/src/routes/index.ts` and mount them in a loop. See `src/components/editor/index.ts` for the barrel-export pattern already used in the frontend.

### In-Memory Generation State (Process-Local)

**What happens:** `generationStates` Map in `backend/src/ai/hermes.ts:351` holds all active generation buffers in memory. Lost on server restart or process crash.
**Why it's wrong:** Any in-progress generation is lost when the server restarts. SSE clients reconnecting mid-generation cannot recover the event stream.
**Do this instead:** Persist checkpoint events to the `audit_logs` or a dedicated `generation_events` table, allowing SSE replay on reconnect.

### Process-Level Error Catch-Alls

**What happens:** `unhandledRejection` and `uncaughtException` are silently caught with `console.warn` in `backend/src/index.ts:31-36`.
**Why it's wrong:** Silently swallowing process-level errors makes debugging impossible and can leave the process in an inconsistent state.
**Do this instead:** Log the full error with stack trace, then crash and restart via the Docker restart policy (which is already `unless-stopped`).

## Error Handling

**Strategy:** Centralized Express error handler with typed `AppError` class.

**Patterns:**
- Services throw `AppError(statusCode, code, message)` — caught by `errorHandler` middleware
- Async route handlers wrapped in `try/catch` with `next(err)` forwarding
- Validation errors caught by `validate` middleware → `AppError(400, 'validation_error', ...)`
- Auth errors thrown by `verifyToken` → `AppError(401, 'invalid_token', ...)`
- Pipeline errors caught in `orchestrateGeneration` → yields `generation_error` event → fallback content generated
- Process errors logged with `console.warn` (see anti-pattern above)

## Cross-Cutting Concerns

**Logging:** Raw `console.log` / `console.warn` throughout — no structured logging library. Hermes events prefixed `[Hermes]`, collaboration events `[WS]`, process events `[Process]`.

**Validation:** Zod schemas for runtime validation — `backend/src/validation/schemas.ts` for request bodies, `backend/src/middleware/validate.ts` for Express middleware wrapper. Frontend shares Zod schemas via `src/schemas/index.ts`.

**Authentication:** JWT-based with Bearer token in `Authorization` header. `requireAuth` middleware verifies token and attaches `req.user`. Public routes (`/login`, `/signup`, `/validate/:token`) bypass auth. Token stored in localStorage via `persist` middleware in Zustand.

**Authorization:** Role-based via `requireRole(...roles)` middleware — supports `redacteur`, `validateur`, `admin`, `super_admin` roles. Frontend has `RequireRole` component (`src/components/RequireRole.tsx`).

---

*Architecture analysis: 2026-07-13*
