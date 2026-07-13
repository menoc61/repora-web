# Codebase Concerns

**Analysis Date:** 2026-07-13

## Tech Debt

### Pervasive `as any` and `as unknown` Type Coercion

**Issue:** Both frontend and backend rely heavily on `as any`, `as unknown`, and `Record<string, unknown>` casts instead of proper TypeScript types. This defeats type safety and makes refactoring error-prone.

**Files:**
- `src/api/client.ts` — 11 uses of `as any`, `as unknown`, `as Record<string, unknown>`
- `src/pages/Editor.tsx` — Uses `useState<any>` for editor/collaboration provider instances; `s.map((s: any) => ...` for section iteration
- `src/pages/Assistant.tsx:14` — `useParams({ from: '/assistant/$id' as any })`
- `src/pages/ValidatePortal.tsx:36` — `useParams({ from: '/validate/$token' as any })`
- `src/pages/OnboardingWizard.tsx:5` — `useParams({ from: '/onboarding/$id' as any, strict: false }) as { id?: string }`
- `backend/src/routes/agents.ts` — Multiple `as Record<string, unknown>` casts for metadata
- `backend/src/routes/sharing.ts:47` — `log.metadata as Record<string, unknown>`
- `backend/src/routes/documents.ts` — Heavy `as Array<Record<string, unknown>>` usage for version restore
- `backend/src/ai/pipeline/orchestrate.ts` — Widespread `as Record<string, unknown>` casts throughout pipeline

**Impact:** High. Type errors that would be caught at compile time are silently ignored. Will cause hard-to-debug runtime failures during refactoring.

**Fix approach:** Define and import proper TypeScript interfaces for API responses, route params, database JSON columns, and agent metadata. Replace `useParams({ from: '...' as any })` with typed route definitions from `@tanstack/react-router`.

---

### Empty `types/` Directory

**Issue:** `backend/src/types/` contains only a `.gitkeep` file. No shared TypeScript types are defined, contributing to the pervasive `as any` pattern above.

**File:** `backend/src/types/.gitkeep`

**Impact:** Medium. Forces inline type definitions scattered across files instead of centralized, reusable types.

**Fix approach:** Extract shared interfaces (HermesEvent, DocumentWithSections, AgentConfig) into `backend/src/types/` and re-export from an index barrel.

---

### 1440-Line Seed File

**Issue:** `backend/src/db/seed.ts` is 1,440 lines, mixing test data with PlantUML URL encoding logic and Drizzle ORM operations. Hard to maintain and review.

**File:** `backend/src/db/seed.ts`

**Impact:** Medium. Large files are harder to reason about, and the embedded PlantUML encoding logic (lines 18-36) is tightly coupled to seed data rather than being a reusable utility.

**Fix approach:** Extract PlantUML URL encoding to `backend/src/utils/plantuml.ts`. Split seed data into per-table JSON fixtures loaded by the seed script.

---

### 892-Line useQueries Hook

**Issue:** `src/hooks/useQueries.ts` is 892 lines containing all TanStack React Query hooks for the entire frontend. Monolithic file, single responsibility principle violated.

**File:** `src/hooks/useQueries.ts`

**Impact:** Medium. Difficult to navigate, test, and maintain. Any change to any query requires modifying this single file.

**Fix approach:** Split into domain-specific hooks files: `useAuthQueries.ts`, `useDocumentQueries.ts`, `useProjectQueries.ts`, `useAgentQueries.ts`, etc.

---

### 691-Line Pipeline Orchestration

**Issue:** `backend/src/ai/pipeline/orchestrate.ts` is 691 lines containing all 5 pipeline stages (planner, writer, uml, tables, reviewer) in a single generator function. The resume detection logic (lines 54-110) is tightly coupled with the stage execution.

**File:** `backend/src/ai/pipeline/orchestrate.ts`

**Impact:** Medium. Hard to unit test individual stages. Any Stage 3 (UML) change risks breaking Stage 5 (Reviewer) through shared state.

**Fix approach:** Extract each pipeline stage into its own file under `pipeline/stages/` with a common interface (e.g., `(ctx, documentId) => AsyncGenerator<HermesEvent>`).

---

### Duplicate Version Restore Endpoints

**Issue:** `backend/src/routes/documents.ts` contains two very similar version restore endpoints: `POST /:id/versions/restore` (line 126) and `POST /:id/restore` (line 179). They share ~90% of the same logic but accept different request body shapes.

**Files:** `backend/src/routes/documents.ts` (lines 126-261)

**Impact:** Low-medium. Code duplication — any bug fix or feature change to version restore must be applied in two places.

**Fix approach:** Consolidate into a single endpoint `POST /:id/versions/restore` that accepts either `versionId` or `version` in the request body.

---

### Running Seed on Every Container Start

**Issue:** `backend/docker-entrypoint.sh` (line 27) runs `npx tsx dist/db/seed.js` on every container startup. While the seed is idempotent via `onConflictDoNothing()`, the first step is `TRUNCATE TABLE ... CASCADE` which **destroys all existing data**.

**File:** `backend/docker-entrypoint.sh:27`, `backend/src/db/seed.ts:62-69`

**Impact:** High for production. This pattern is safe for demo deployments but would be catastrophic if someone ran this against a production database.

**Fix approach:** Add a `REPORA_SEED_DISABLED=true` env var check in the seed script. Gate the TRUNCATE behind an explicit `REPORA_SEED_RESET` flag. Only run seed when `NODE_ENV !== 'production'`.

---

### `agent_configs.metadata` JSONB - No Schema Validation

**Issue:** `backend/src/db/schema.ts` defines `metadata: jsonb('metadata')` on `agentConfigs` with no zod validation. Data is read/written with `as Record<string, unknown>` casts throughout `backend/src/routes/agents.ts` (lines 105-156), risking inconsistent shapes.

**Files:** `backend/src/db/schema.ts:101`, `backend/src/routes/agents.ts:105-156`

**Impact:** Medium. Inconsistently shaped metadata objects could cause runtime errors in admin panels and agent tool configuration.

**Fix approach:** Define a zod schema for agent `metadata` and validate on write. Use `z.output<typeof metadataSchema>` for the TypeScript type.

---

## Security Considerations

### Hardcoded Development Secrets as Defaults

**Risk:** `backend/src/config.ts` uses hardcoded fallback values for every secret:
- `JWT_SECRET` defaults to `'dev-secret-change-in-production'`
- `ENCRYPTION_KEY` defaults to `'0123456789abcdef0123456789abcdef'`
- Database URL defaults with hardcoded credentials: `postgres://repora:repora@localhost:5434/repora`
- S3 credentials: `minioadmin` / `minioadmin`

**Files:** `backend/src/config.ts:6-8,15-20`
- `docker-compose.yml:26-27` also passes these as default env vars
- `backend/src/.env.example` shows weak secrets as examples

**Impact:** **Critical.** A production deployment that forgets to set these env vars would have:
- A trivially guessable JWT secret — anyone can forge auth tokens
- A trivially guessable encryption key — stored API keys can be decrypted
- Hardcoded database and S3 credentials

**Current mitigation:** `.env.example` files note that secrets should be changed. The codebase is intended for self-hosted use only.

**Recommendations:**
1. Add a startup check in `backend/src/index.ts` that warns (or refuses to start) if `JWT_SECRET` or `ENCRYPTION_KEY` matches known dev values.
2. For `docker-compose.yml`, use Docker secrets instead of environment variables for sensitive values.
3. Generate a random `ENCRYPTION_KEY` at first startup if not configured.

---

### Weak API Key Encryption

**Risk:** `backend/src/utils/crypto.ts` derives the encryption key using a single SHA-256 hash:
```typescript
const KEY = crypto.createHash('sha256').update(config.encryptionKey).digest()
```
No PBKDF2, scrypt, or argon2 key derivation. No salt. AES-256-GCM is used correctly (random IV, auth tag) but the key derivation is weak.

**Files:** `backend/src/utils/crypto.ts:5`, `backend/src/services/auth.service.ts` (stores encrypted keys in `apiKeys` table)

**Impact:** High if `ENCRYPTION_KEY` is compromised. The static key derivation makes it feasible to brute-force weak encryption keys.

**Recommendations:** Use `crypto.scryptSync()` or `crypto.pbkdf2Sync()` with a random salt stored alongside the encrypted data.

---

### JWT Token in localStorage

**Risk:** The auth token is persisted in localStorage via `zustand/persist` with the key `repora-auth` (`src/stores/index.ts:113`). localStorage is accessible to any JavaScript running on the same origin, making it vulnerable to XSS attacks.

**Files:** `src/stores/index.ts:101-116`

**Impact:** High. Any XSS vulnerability in the frontend (e.g., through `ReactMarkdown` rendering in `src/pages/ValidatePortal.tsx:330`) would expose the JWT token.

**Recommendation:** Use httpOnly cookies for token storage. The backend already has cookie support via CORS credentials config (`backend/src/index.ts:40`).

---

### WebSocket Authentication via Query Parameter

**Risk:** The collaboration WebSocket server authenticates via `token` query parameter (`backend/src/collaboration/ws.ts:149`):
```typescript
const token = url.searchParams.get('token')
```
Query parameters are commonly logged by proxies, load balancers, and server access logs.

**File:** `backend/src/collaboration/ws.ts:149`

**Impact:** Medium. Tokens may leak into infrastructure logs.

**Recommendations:** Authenticate WebSocket connections via the `Sec-WebSocket-Protocol` header or a separate upgrade handshake message after connection.

---

### Unauthenticated Notification WebSocket

**Risk:** The `/notifications` WebSocket endpoint (`backend/src/collaboration/ws.ts:142-145`) accepts connections without any authentication:
```typescript
if (url.pathname === '/notifications') {
  notificationClients.add(ws)
  ws.on('close', () => notificationClients.delete(ws))
  return
}
```
Anyone who can reach the server can subscribe to all broadcast notifications.

**File:** `backend/src/collaboration/ws.ts:142-145`

**Impact:** Medium. Notification payloads can contain document IDs and decision data. An attacker could monitor document activity.

**Recommendation:** Require JWT authentication for the notification endpoint, or scope notifications to the authenticated user's projects.

---

### SQL Injection via Unsafe TRUNCATE

**Risk:** `backend/src/db/seed.ts:68` uses `queryClient.unsafe()` with string interpolation:
```typescript
await queryClient.unsafe(`TRUNCATE TABLE ${t} CASCADE`)
```
While `tableNames` is hardcoded and not user-controllable, the pattern is risky if the seed file is ever modified.

**File:** `backend/src/db/seed.ts:62-68`

**Impact:** Low (current implementation) but the unsafe pattern is a code smell.

---

### `.env` Files Committed to Repository

**Risk:** Both `repora-web/.env` and `repora-web/backend/.env` exist in the working directory. While `.env` files are in `.gitignore` (verified by being absent from git status), their existence indicates that real secrets are stored on disk.

**Files:** `.env`, `backend/.env`

**Impact:** Low-medium. Local development risk only, but accidental `git add --force` could commit secrets.

---

## Performance Bottlenecks

### Sequential Pipeline Agent Calls

**Problem:** The generation pipeline in `orchestrate.ts` runs all stages sequentially: Planner → Writer (per section) → UML → Tables → Reviewer. The Writer stage alone makes one LLM call per section (potentially with rescope retries). For a document with 15 sections and 3 rescope attempts, this is 45 sequential LLM calls.

**File:** `backend/src/ai/pipeline/orchestrate.ts` (lines 397-570, the Writer loop)

**Cause:** The architecture requires each stage to complete before the next can start (writer needs planner's outline, UML needs writer's content, etc.).

**Improvement path:**
1. Parallelize section writing within the Writer stage by running independent sections concurrently.
2. Implement a cancellation token so users can abort mid-generation without waiting.
3. Add a configurable parallelization factor.

---

### In-Memory Generation State

**Problem:** Generation state is stored in a `Map<string, GenerationState>` (`backend/src/ai/hermes.ts:351`). If the server restarts mid-generation, all progress is lost.

**File:** `backend/src/ai/hermes.ts:351-358`

**Cause:** The state map is in-process memory with no persistence layer.

**Improvement path:** Persist generation state and events to the database (audit_logs table or a dedicated `generation_events` table). On restart, replay or resume from the persisted state.

---

### SSE Stream Depends on In-Memory Queue

**Problem:** The SSE streaming endpoint (`GET /documents/:id/stream`) reads from the in-memory `generationStates` map. If the generation completes before the client connects, the client receives all buffered events instantly, which defeats the streaming UX benefit.

**Files:** `backend/src/ai/hermes.ts:419-451`, `backend/src/routes/documents.ts:33-69`

**Improvement path:** Use a message queue (or Redis pub/sub) for event distribution so multiple concurrent stream consumers are supported and events are not lost on reconnect.

---

### Documentation Export Re-renders on Every Request

**Problem:** `GET /documents/:id/export` (`backend/src/routes/documents.ts:79-107`) attempts S3 cache but on cache miss generates the full DOCX/PDF document synchronously. The `exportDocx.ts` service is 491 lines and runs the entire document layout engine on every miss.

**Files:** `backend/src/routes/documents.ts:79-107`, `backend/src/services/exportDocx.ts`

**Improvement path:** Generate exports asynchronously with a progress notification. Pre-generate exports after document completion rather than lazily on first download request.

---

## Known Bugs

### Duplicate `import` in hermes.ts

**Symptom:** `backend/src/ai/hermes.ts` imports `orchestrateGeneration` at line 14 (`export { orchestrateGeneration } from './pipeline/orchestrate'`) and again at line 361 (`import { orchestrateGeneration } from './pipeline/orchestrate'`). The first is a re-export barrel; the second is a direct import used by `initiateGeneration()`. While this works, it's confusing and the re-export at line 14 serves no purpose since `initiateGeneration()` is exported from the same file.

**File:** `backend/src/ai/hermes.ts:14,361`

---

### `orchestrate()` Generator Not Actually Async

**Symptom:** `orchestrateGeneration()` in `orchestrate.ts:182-189` wraps `orchestrate()` in a `Promise<AsyncGenerator>` return, but `orchestrate()` (line 189) is not declared `async` — it's a regular generator function that yields async generators from `runAgent`. The `await` on line 375 in `initiateGeneration()` (`const gen = await orchestrateGeneration(...)`) suggests it expects a Promise.

**File:** `backend/src/ai/pipeline/orchestrate.ts:189,375`

---

### Version Restore May Silently Lose Data

**Symptom:** `backend/src/routes/documents.ts` version restore (`POST /:id/versions/restore`, line 126) deletes all existing sections (`await db.delete(sections).where(eq(sections.documentId, id))` at line 158) and re-inserts from audit log metadata. If the audit log metadata is missing or malformed, sections are silently lost with no rollback.

**File:** `backend/src/routes/documents.ts:156-168,236-247`

---

### Writer Agent Zero-Output Handling May Lose Context

**Symptom:** In `orchestrate.ts`, when the Writer agent produces zero output without calling tools (line 502-518), the code saves an empty section with status 'draft' and moves on. The section remains empty in the UI with no user-visible error.

**File:** `backend/src/ai/pipeline/orchestrate.ts:501-520`

---

## Fragile Areas

### Hermes Orchestrator — No Central Error Recovery Strategy

**Why fragile:** Each pipeline stage in `orchestrate.ts` has its own error handling strategy with varying levels of recovery. Some stages produce fallback content, others skip silently. There is no unified rollback or partial-completion reporting. A failure in the Writer stage after 10 sections have been written leaves the document in an inconsistent state (`orchestrate.ts:152-157`).

**Files:** `backend/src/ai/pipeline/orchestrate.ts` (entire file)

**Test coverage:** Nearly zero. No tests for the orchestration flow, only isolated tool tests.

**Safe modification:** Add a pipeline transaction / state-machine abstraction. Each stage should report completion status to a central coordinator that can decide to continue, retry, or abort with a meaningful error.

---

### Fail-Silent Error Handling Pattern

**Why fragile:** The codebase uses bare `catch {}` blocks that silently swallow errors throughout both backend and frontend. Examples:
- `backend/src/ai/hermes.ts:245-247` — DB read failure silently uses defaults
- `backend/src/ai/pipeline/orchestrate.ts:478` — DB read failure silently falls back to stream content
- `backend/src/routes/documents.ts:318` — comment listing silently returns `unknown[]`
- `src/api/client.ts:117-118` — SSE JSON parse errors silently ignored

**Files:** Multiple files throughout codebase

**Safe modification:** At minimum log swallowed errors with `console.warn`. For critical paths, throw or return structured error objects.

---

### Process-Level Error Suppression

**Why fragile:** `backend/src/index.ts:31-36` installs global handlers that silently suppress unhandled rejections and uncaught exceptions:
```typescript
process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled rejection (ignored):', ...)
})
process.on('uncaughtException', (err) => {
  console.warn('[Process] Uncaught exception (ignored):', ...)
})
```
This means any async error anywhere in the application — from S3 failures to LLM provider crashes — is silently consumed and never propagated to the caller.

**File:** `backend/src/index.ts:31-36`

**Safe modification:** Remove these handlers in development mode. In production, use them to gracefully drain connections and shut down rather than silently continuing in an unknown state.

---

### Tool-Calling Probe May Crash Startup

**Why fragile:** `backend/src/index.ts:70-83` calls `discoverOllamaModel()` and `probeToolSupport()` during server startup. If Ollama is not running (common during development), the probe fails gracefully with a warning, but the timeout blocks startup for up to 5 seconds (`enumerateOllamaModels()` line 141 uses `timeout: 5000`).

**Files:** `backend/src/index.ts:70-83`, `backend/src/ai/hermes.ts:137-160`

**Safe modification:** Make model probing fully non-blocking with a startup timeout. Allow the server to start without AI capabilities and probe in the background.

---

## Scaling Limits

### Single-Process Architecture

**Current:** The backend runs as a single Node.js process. All generation events, WebSocket collaboration, and HTTP requests share the same event loop.

**Limit:** Under concurrent document generation requests, the event loop will be blocked by CPU-intensive operations (PlantUML rendering, DOCX generation, JSON parsing). With Express 5's async routing, multiple generation pipelines can run concurrently but share the same memory space — the `generationStates` Map is global state.

**Scaling path:** 
1. Extract generation workers into a separate process with a message queue (Bull/BullMQ + Redis).
2. Use cluster mode for horizontal scaling across CPU cores.
3. For true horizontal scaling, extract WebSocket collaboration into a separate service with a shared Yjs backend.

### In-Memory Yjs Documents

**Current:** Yjs documents for collaboration are stored in an in-memory Map (`backend/src/collaboration/ws.ts:15`). If the server restarts, all document editing state is lost.

**Limit:** The Yjs documents will grow unbounded with editing history. No cleanup mechanism for stale documents.

**Scaling path:** Implement a Yjs persistence backend (e.g., `y-leveldb` or a PostgreSQL-based document store). Add a TTL-based cleanup for inactive documents.

---

## Test Coverage Gaps

### Massive Untested Surface

**Total tests:** 13 test files across both frontend (3 component/store tests) and backend (10 integration tests).

**Test files:**
- `backend/tests/auth.test.ts` — Basic auth flow
- `backend/tests/documents.test.ts` — Document CRUD
- `backend/tests/projects.test.ts` — Project CRUD
- `backend/tests/export.test.ts` — Export functionality
- `backend/tests/public.test.ts` — Public endpoints
- `backend/tests/hermes-context.test.ts` — Agent context
- `backend/tests/hermes-tools.test.ts` — Tool execution
- `backend/tests/negotiate.test.ts` — Writer negotiation
- `backend/tests/template-generation.test.ts` — Template generation
- `src/stores/index.test.ts` — Zustand stores
- `src/schemas/index.test.ts` — Zod schemas
- `src/components/AgentStatus.test.tsx` — AgentStatus component
- `src/components/GenerationProgress.test.tsx` — GenerationProgress component

**Untested areas (High priority):**
| Area | Risk | Files |
|------|------|-------|
| Pipeline orchestration | Pipeline failures produce broken documents | `backend/src/ai/pipeline/orchestrate.ts` (691 lines) |
| UML diagram service | Diagram generation silently fails | `backend/src/services/diagram.service.ts` (202 lines) |
| Outline service | Bad outlines cascade to Writer/UML stages | `backend/src/services/outline.service.ts` (190 lines) |
| Collaboration WebSocket | Collab failures = data loss for concurrent editors | `backend/src/collaboration/ws.ts` (177 lines) |
| Export DOCX | Export formatting breaks without notice | `backend/src/services/exportDocx.ts` (491 lines) |
| All route handlers except auth/docs/projects | 14 route files with 0 tests | `backend/src/routes/*.ts` |
| All hook files | Frontend data fetching logic untested | `src/hooks/*.ts` (7 files) |
| EditorCanvas component | Core editor UI untested | `src/components/editor/EditorCanvas.tsx` (340 lines) |
| Onboarding wizard | Complex multi-step flow untested | `src/components/onboarding/*.tsx` |

---

## Dependencies at Risk

### PlantUML Public Server Dependency

**Risk:** The default PlantUML rendering URL is `https://www.plantuml.com/plantuml` (`backend/src/config.ts:12`). This sends document data to a third-party service with no confidentiality guarantees. For on-prem/self-hosted deployments, a local PlantUML server should be configured.

**File:** `backend/src/config.ts:12`

**Impact:** Medium. Document content (potentially confidential requirements) is encoded in the URL and sent to an external service.

**Fix:** Change the default to `http://localhost:8080/plantuml` and document how to set up a local PlantUML server. The `PLANTUML_SERVER_URL` env var is configurable but users may not know to change it.

### @ai-sdk Dependencies — Rapidly Evolving APIs

**Risk:** The AI provider SDKs (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`) at version `^3.0.0` and the core `ai` SDK at `^7.0.0` are relatively new libraries with fast-moving APIs. Minor version bumps may introduce breaking changes.

**Files:** `backend/package.json:17-22`

**Impact:** Low-medium. Major refactoring may be needed to upgrade AI SDKs.

---

## Missing Critical Features

### No Server-Side Token Blacklist

**Problem:** JWT tokens cannot be revoked. `POST /auth/logout` (`backend/src/routes/auth.ts:29-33`) simply returns `{ ok: true }` with no server-side invalidation. If a token is compromised, the only recourse is to wait for it to expire (`JWT_EXPIRES_IN` defaults to `7d`).

**Blocks:** Secure user session management. An admin cannot force-logout a compromised user.

### No Rate Limiting

**Problem:** No rate limiting on any endpoint. `/auth/login` and `/auth/register` are particularly vulnerable to brute-force attacks. `/agents/:name/test` can be called repeatedly, triggering expensive LLM calls.

**Blocks:** Production readiness against credential stuffing and resource exhaustion attacks.

### No Request Body Size Limits

**Problem:** `express.json()` is used without a `limit` option (`backend/src/index.ts:41`). An attacker could send massive JSON payloads to exhaust server memory.

---

*Concerns audit: 2026-07-13*
