---
phase: Backend Code Review
reviewed: 2026-07-09T18:00:00Z
depth: deep
files_reviewed: 35
files_reviewed_list:
  - backend/src/index.ts
  - backend/src/config.ts
  - backend/src/db/schema.ts
  - backend/src/db/index.ts
  - backend/src/db/migrate.ts
  - backend/src/db/migrations/0000_rainy_scarlet_spider.sql
  - backend/src/middleware/auth.ts
  - backend/src/middleware/error.ts
  - backend/src/routes/auth.ts
  - backend/src/routes/projects.ts
  - backend/src/routes/documents.ts
  - backend/src/routes/diagrams.ts
  - backend/src/routes/admin.ts
  - backend/src/routes/export.ts
  - backend/src/routes/validation.ts
  - backend/src/services/auth.service.ts
  - backend/src/services/project.service.ts
  - backend/src/services/document.service.ts
  - backend/src/services/diagram.service.ts
  - backend/src/services/admin.service.ts
  - backend/src/services/audit.service.ts
  - backend/src/ai/hermes.ts
  - backend/src/ai/agents/registry.ts
  - backend/src/ai/agents/planner.ts
  - backend/src/ai/agents/writer.ts
  - backend/src/ai/agents/uml.ts
  - backend/src/ai/agents/tables.ts
  - backend/src/ai/agents/reviewer.ts
  - backend/src/ai/providers/interface.ts
  - backend/src/utils/crypto.ts
  - backend/Dockerfile
  - backend/drizzle.config.ts
  - backend/tsconfig.json
  - docker-compose.yml
  - AGENTS.md
findings:
  critical: 4
  warning: 7
  info: 4
  total: 15
status: resolved
resolved: 2026-07-13T00:00:00Z
resolution_note: >
  All critical and warning findings (CR-01..04, WR-01..06) were fixed against the
  current codebase. WR-07 (rate limiting) intentionally deferred per maintainer
  decision. Info findings (IN-01..04) are non-blocking stubs/divergence notes.
  IN-02 (FK cascade deletes) requires a DB migration and was left as a tracked
  operational item.
---

# Backend Code Review Report

**Reviewed:** 2026-07-09T18:00:00Z
**Depth:** deep (cross-file analysis with call chain tracing)
**Files Reviewed:** 35
**Status:** ⚠️ Issues Found — not merge-ready

## Summary

This review covers the complete Express + Drizzle + JWT backend implementation for Repora (~7200 lines across 35 source files). The architecture is well-structured with clean separation into routes, services, and AI layers. However, the review uncovered **4 critical defects** that render the AI orchestration pipeline non-functional, combined with **7 warnings** around security hardening and missing authorization checks.

The most severe issues are:
- The Hermes orchestrator's output is silently discarded (fire-and-forget with unhandled promise rejections)
- Writer and Reviewer agents will crash at runtime due to an invalid `'byok'` provider type
- Admin agent configuration endpoints lack role-based access control
- The SSE stream emits hardcoded mock data instead of consuming real orchestrator output

These are **not** style preferences or minor refactors — they are defects that will cause runtime failures in production.

---

## Critical Issues

### CR-01: Hermes orchestrator invoked as fire-and-forget — output discarded, unhandled promise rejection risk

**File:** `backend/src/routes/projects.ts:60`
**File:** `backend/src/ai/hermes.ts:50-71`

**Issue:** The `POST /projects/:id/generate` endpoint calls `orchestrateGeneration()` without awaiting or consuming the returned async generator:

```typescript
// routes/projects.ts:60
orchestrateGeneration(req.params.id as string, project.brief || '', result.document_id)
```

`orchestrateGeneration()` returns a `Promise<AsyncGenerator<HermesEvent>>`. The returned promise is never awaited, and the async generator is never iterated. This means:

1. **All AI agent output (Planner → Writer → Reviewer) is silently discarded.** The agents run, produce tokens, make tool calls, and generate document content — but nothing receives or processes these events.
2. **Unhandled promise rejection:** If `orchestrateGeneration` or any `runAgent` call inside it throws (e.g., provider connection failure, invalid model, API error), the rejection is unhandled. In Node.js 22+, unhandled promise rejections **terminate the process**.
3. **The orchestrator's generated content is never saved to the database.** The `saveOutline` and `writeSection` tool calls execute (writing to DB) but their output is never streamed to the frontend.

**Fix:** Either make the generate endpoint an async iterator that streams results via SSE, or decouple via a job queue. The minimal fix:

```typescript
// Option A: Await the orchestrator's completion (blocks the response until done)
projectRouter.post('/:id/generate', requireAuth, async (req, res, next) => {
  try {
    const result = await generateDocument(req.params.id as string, req.user!.userId)
    const project = await getProjectById(req.params.id as string, req.user!.userId)
    
    // Consume the orchestrator — iterate the generator to completion
    const gen = await orchestrateGeneration(req.params.id as string, project.brief || '', result.document_id)
    for await (const event of gen) {
      // Process events (write to DB, emit via WebSocket/SSE)
    }
    
    await logAudit({ userId: req.user!.userId, action: 'document.generated', target: result.document_id })
    res.status(201).json(result)
  } catch (err) { next(err) }
})
```

For the production architecture, the SSE stream endpoint should consume the orchestrator output, not the generate endpoint. The architecture needs a shared event bus or in-memory channel between the generate trigger and the SSE consumer.

---

### CR-02: Writer and Reviewer agents use invalid `'byok'` provider type — guaranteed runtime crash

**File:** `backend/src/ai/agents/registry.ts:62,87`
**File:** `backend/src/ai/providers/interface.ts:4-18`
**File:** `backend/src/ai/hermes.ts:22`

**Issue:** The agent registry defines Writer and Reviewer agents with `defaultProvider: 'byok'`:

```typescript
// registry.ts:62
Writer: {
  defaultProvider: 'byok',  // ← NOT a valid ProviderType
  // ...
},
Reviewer: {
  defaultProvider: 'byok',  // ← NOT a valid ProviderType
  // ...
},
```

But the `ProviderType` union in `providers/interface.ts:4` is:

```typescript
export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google'
```

There is no `'byok'` variant. In `hermes.ts:22`, the value is force-cast:

```typescript
const model = getLanguageModel(agentDef.defaultProvider as ProviderType, agentDef.defaultModel, apiKey)
```

The `as ProviderType` cast suppresses the TypeScript error, but at runtime `getLanguageModel('byok', ...)` hits the `default` case in the switch statement and throws `Error('Unknown provider: byok')`.

**Impact:** Any document generation that reaches the Writer or Reviewer phase will crash with an unhandled promise rejection. Only the Planner agent (which uses `llama_cpp`) would execute.

**Fix:** Replace `'byok'` with a specific provider or add `'byok'` to `ProviderType` and map it to the OpenAI-compatible endpoint:

```typescript
// In providers/interface.ts — Option A: Add 'byok' as a real provider type
export type ProviderType = 'llama_cpp' | 'byok' | 'openai' | 'anthropic' | 'google'

export function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'byok':
      return createOpenAICompatible({ 
        name: 'byok', 
        baseURL: 'https://api.openai.com/v1', 
        apiKey: apiKey || '' 
      })
    // ... rest of cases
  }
}
```

Or Option B: Change the default provider in the registry to `'openai'`:

```typescript
Writer: {
  defaultProvider: 'openai',
  // ...
},
```

---

### CR-03: Admin agent endpoints lack role-based authorization

**File:** `backend/src/routes/admin.ts:24-37`

**Issue:** The `/admin/agents` endpoints only require authentication, not any specific role:

```typescript
// admin.ts:24 — No requireRole
adminRouter.get('/agents', requireAuth, async (req, res, next) => {
  const agents = await listAgents()
  res.json(agents)
})

// admin.ts:31 — No requireRole
adminRouter.patch('/agents/:name', requireAuth, async (req, res, next) => {
  await patchAgent(name, req.body)
  res.json({ ok: true })
})
```

Compare with the metrics and logs endpoints that correctly enforce role checks:

```typescript
adminRouter.get('/metrics', requireAuth, requireRole('admin', 'super_admin'), ...)  // ✓
adminRouter.get('/logs', requireAuth, requireRole('super_admin'), ...)              // ✓
```

Per the AGENTS.md spec, agent configuration management is an **Administrateur Système** or **Super Admin** function. Any authenticated user (including "rédacteur" or "validateur" roles) can currently list and modify all agent configurations, including enabling/disabling agents, changing model IDs, and modifying provider settings.

**Fix:** Add the appropriate role check:

```typescript
adminRouter.get('/agents', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  const agents = await listAgents()
  res.json(agents)
})

adminRouter.patch('/agents/:name', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  await patchAgent(name, req.body)
  res.json({ ok: true })
})
```

---

### CR-04: SSE stream emits hardcoded mock data, never consumes real Hermes output

**File:** `backend/src/routes/documents.ts:15-45`

**Issue:** The `GET /documents/:id/stream` endpoint emits simulated mock events instead of relaying actual Hermes orchestrator output:

```typescript
// Simulate streaming events — in production, this relays Hermes fullStream
const events = [
  { type: 'token', token: '# Document Outline\n\n' },
  { type: 'token', token: '## 1. Introduction\n\n' },
  { type: 'agent_status', agent: 'Planner', status: 'writing' },
  { type: 'section_complete', section_id: 'placeholder', title: 'Introduction' },
  // ...hardcoded mock data
]

for (const event of events) {
  res.write(`data: ${JSON.stringify(event)}\n\n`)
  await new Promise(r => setTimeout(r, 300))
}
```

The spec (AGENTS.md §2) and the backend design doc clearly describe that this endpoint should relay Hermes `fullStream` events — agent status changes, token deltas, tool calls, and results. The mock events use a hardcoded `section_id: 'placeholder'` that doesn't correspond to any real section in the database.

Combined with CR-01 (orchestrator output discarded), the entire streaming pipeline is non-functional: the orchestrator produces content that nobody reads, and the SSE endpoint sends fake content that the frontend cannot use.

**Fix:** Bridge the orchestrator's async generator to the SSE stream. This requires a shared mechanism (in-memory event bus, or the stream endpoint triggering the orchestration):

```typescript
documentRouter.get('/:id/stream', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string)
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    
    // Trigger orchestration and relay events to SSE
    const gen = await orchestrateGeneration(doc.projectId, doc.outline?.brief || '', req.params.id as string)
    
    for await (const event of gen) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
    
    res.end()
  } catch (err) { next(err) }
})
```

Note: This requires resolving the disconnected architecture where the generate endpoint creates a document and the stream endpoint should drive the generation. Consider whether the stream endpoint should trigger generation or whether a background job queue should manage this.

---

## Warnings

### WR-01: No input validation on any API endpoint

**Files:** All route handlers (`routes/auth.ts`, `routes/projects.ts`, `routes/documents.ts`, `routes/diagrams.ts`, `routes/admin.ts`, `routes/validation.ts`)

**Issue:** Despite Zod v4 being included as a dependency (`package.json:26`), no request validation is performed on any API endpoint. All routes destructure values directly from `req.body` without checking types, formats, or presence:

```typescript
// routes/auth.ts:13 — email and password are never validated
const { name, email, password } = req.body
const result = await registerUser(name, email, password)
```

If `password` is undefined, `bcrypt.hash(undefined, 12)` throws a TypeError. If `email` is missing, the DB constraint violation surfaces as a raw 500. There's no validation for:
- Email format validity
- Minimum password length
- Required field presence
- String length limits (DoS via enormous strings)
- Project name length
- Diagram type enum validation (free-form string stored directly)

**Fix:** Add Zod validation schemas to all routes. Example for auth:

```typescript
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)
    const result = await registerUser(name, email, password)
    res.status(201).json(result)
  } catch (err) { 
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'validation_error', err.message))
    }
    next(err) 
  }
})
```

---

### WR-02: `patchAgent` doesn't set `updatedAt`, silently succeeds on missing agent

**File:** `backend/src/services/admin.service.ts:23-25`
**File:** `backend/src/routes/admin.ts:31-37`

**Issue:** The `patchAgent` function has two defects:

1. **No `updatedAt` update:** The `updated_at` timestamp column is not set during updates:
```typescript
export async function patchAgent(name: string, data: Partial<typeof agentConfigs.$inferInsert>) {
  await db.update(agentConfigs).set(data).where(eq(agentConfigs.agentName, name))
}
```

2. **No 404 on missing agent:** If the agent name doesn't exist, the update silently succeeds (affects 0 rows), and the route returns `{ ok: true }` — a false positive.

3. **Oversized update surface:** The `Partial<typeof agentConfigs.$inferInsert>` type allows setting `id`, `agentName`, `createdAt`, and other fields that should not be patchable.

**Fix:**
```typescript
export async function patchAgent(name: string, data: { provider?: string; modelId?: string; enabled?: boolean; temperature?: number }) {
  const result = await db.update(agentConfigs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agentConfigs.agentName, name))
  if (result.count === 0) throw new AppError(404, 'not_found', 'Agent not found')
  return { ok: true }
}
```

---

### WR-03: Missing ownership authorization checks on document and diagram routes

**File:** `backend/src/routes/documents.ts:8-12, 48-53`
**File:** `backend/src/services/diagram.service.ts:6-13`
**File:** `backend/src/routes/diagrams.ts:8-12`

**Issue:** The document and diagram routes do not verify that the authenticated user owns the project that the document belongs to:

```typescript
// documents.ts:8 — no owner check
documentRouter.get('/:id', requireAuth, async (req, res, next) => {
  const doc = await getDocument(req.params.id as string)  // No owner verification
  res.json(doc)
})
```

Compare with `project.service.ts` where every function checks `ownerId` against the authenticated user. The document and diagram services lack equivalent checks, meaning any authenticated user can:
- Read any document (and its sections) by ID
- Create validation tokens for any document
- Create diagrams on any project

**Fix:** Add project ownership checks to document and diagram services:

```typescript
// In document.service.ts
export async function getDocument(id: string, userId: string) {
  const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')
  
  // Verify ownership through the project
  const [project] = await db.select({ ownerId: schema.projects.ownerId })
    .from(schema.projects).where(eq(schema.projects.id, doc.projectId)).limit(1)
  if (!project || project.ownerId !== userId) throw new AppError(404, 'not_found', 'Document not found')
  
  // ... rest of function
}
```

---

### WR-04: Public default encryption key if `ENCRYPTION_KEY` not set

**File:** `backend/src/config.ts:8`
**File:** `backend/src/utils/crypto.ts:5`

**Issue:** The `config.ts` default encryption key is a publicly known string:

```typescript
encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
```

This value is visible in the source code. If a production deployment fails to set `ENCRYPTION_KEY`, all BYOK API keys encrypted with this default are trivially decryptable by anyone who reads the source. The key derivation in `crypto.ts:5` uses SHA-256 of this string, which produces a deterministic, known 32-byte key.

Additionally, the key derivation uses raw `crypto.createHash('sha256')` instead of a proper key derivation function (PBKDF2, scrypt). While this is acceptable if the input is a high-entropy key (not a password), the `'0123456789abcdef0123456789abcdef'` default is zero-entropy.

**Fix:** 
1. Remove the default or add a loud warning at startup if `ENCRYPTION_KEY` is not set:
```typescript
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === '0123456789abcdef0123456789abcdef') {
  console.error('FATAL: ENCRYPTION_KEY must be set in production. Using default is a security vulnerability.')
  process.exit(1)
}
```

2. Consider using a proper KDF for the encryption key if the input is a passphrase rather than a fixed-length key.

---

### WR-05: Database agent configurations never consumed by orchestrator

**File:** `backend/src/ai/hermes.ts:22`
**File:** `backend/src/services/admin.service.ts:14-21`

**Issue:** The Hermes orchestrator always uses hardcoded defaults from the agent registry:

```typescript
// hermes.ts:22 — always uses registry defaults
const model = getLanguageModel(agentDef.defaultProvider as ProviderType, agentDef.defaultModel, apiKey)
```

The `agent_configs` table stores per-agent provider, model, temperature, and enabled/disabled state. The admin API allows modifying these via `PATCH /admin/agents/:name`. But the orchestrator never reads from this table — it only consults `AGENT_REGISTRY` in `registry.ts`.

This means:
- Changing an agent's model via the admin API has no effect
- Disabling an agent via the admin API has no effect
- The admin agent configuration UI shows settings that are decorative

**Fix:** Make the orchestrator read agent configs from the database:

```typescript
export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  const agentDef = AGENT_REGISTRY[agentName]
  if (!agentDef) throw new Error(`Unknown agent: ${agentName}`)
  
  // Load dynamic config from database
  const [dbConfig] = await db.select().from(agentConfigs)
    .where(eq(agentConfigs.agentName, agentName)).limit(1)
  
  if (dbConfig && !dbConfig.enabled) {
    yield { type: 'agent_status', agent: agentName, status: 'skipped' }
    return
  }
  
  const provider = (dbConfig?.provider || agentDef.defaultProvider) as ProviderType
  const modelId = dbConfig?.modelId || agentDef.defaultModel
  const model = getLanguageModel(provider, modelId, apiKey)
  // ... rest of function
}
```

---

### WR-06: Docker image includes devDependencies in production

**File:** `backend/Dockerfile:3-6, 10-11`

**Issue:** The Dockerfile's builder stage installs all dependencies (including devDependencies like `typescript`, `tsx`, `@types/*`, `drizzle-kit`):

```dockerfile
FROM node:22-alpine AS builder
RUN npm ci                    # installs ALL deps including devDeps
COPY . .
RUN npm run build             # uses TypeScript compiler

FROM node:22-alpine AS runner
COPY --from=builder /app/node_modules ./node_modules  # copies ALL node_modules
```

The production image carries ~200MB of unnecessary dev dependencies (TypeScript, type definitions, build tools, drizzle-kit).

**Fix:** Use `npm ci --omit=dev` in the runner stage if a separate install is needed, or better, only copy the production dependencies:

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev          # install only production deps
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

### WR-07: No rate limiting on auth endpoints

**File:** `backend/src/routes/auth.ts:11-25`

**Issue:** The `POST /auth/login` and `POST /auth/register` endpoints have no rate limiting, making them vulnerable to:
- Brute force password guessing
- Account enumeration (though error messages are consistent, the 409 vs 401 timing differs)
- Registration spam

**Fix:** Add rate limiting middleware:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // 20 attempts per window
  message: { error: { code: 'too_many_requests', message: 'Too many attempts, please try again later' } },
})

authRouter.use('/login', authLimiter)
authRouter.use('/register', authLimiter)
```

---

## Info

### IN-01: Individual agent files are empty re-exports

**Files:** `backend/src/ai/agents/planner.ts`, `writer.ts`, `uml.ts`, `tables.ts`, `reviewer.ts`

Each file is a single line:
```typescript
export { AGENT_REGISTRY } from './registry'
```

These files are dead code stubs. The spec describes each agent having its own tools, system prompt, and model configuration. Currently, all agent definitions live in `registry.ts` with no per-file module separation. If the intent is to keep a modular file structure for future per-agent logic, these files serve as directory placeholders. Consider removing them until each agent has its own dedicated implementation.

---

### IN-02: No cascade deletes on foreign keys

**File:** `backend/src/db/migrations/0000_rainy_scarlet_spider.sql:111-120`

All foreign key constraints use `ON DELETE no action`. Deleting a project requires manually deleting all related records (documents, sections, diagrams, requirements, comments, validations) first. This is an operational concern for cleanup workflows. Consider adding `onDelete: 'cascade'` at the ORM schema level for child tables.

---

### IN-03: Spec requires Fernet/libsodium, implementation uses AES-256-GCM

**File:** `backend/src/utils/crypto.ts:4`
**Reference:** `AGENTS.md:171`

The AGENTS.md spec (section 7, Security) requires BYOK keys encrypted with "Fernet/libsodium". The implementation uses AES-256-GCM with SHA-256 key derivation. While AES-256-GCM is cryptographically sound and arguably more widely available in Node.js built-ins, the divergence from spec should be documented. The SHA-256 key derivation is acceptable if the input is a high-entropy key, but not if it's a user-memorable passphrase.

---

### IN-04: Empty `types/` directory — no shared TypeScript types

**File:** `backend/src/types/.gitkeep`

The `types/` directory is empty (contains only `.gitkeep`). There are no shared type definitions exported for use by the frontend. Zod schemas are not shared between frontend and backend as the spec envisioned. Consider extracting shared API types (user shapes, project shapes, document shapes) into this directory for type-safe frontend-backend communication.

---

## Assessment

| Criterion | Status |
|---|---|
| **Architecture / Separation of concerns** | ✅ Well-structured: routes → services → DB/AI layers |
| **Plan alignment** | ⚠️ Partial — core structure matches, but orchestrator pipeline is disconnected |
| **Error handling** | ⚠️ Basic — AppError pattern exists, but input validation is absent |
| **Security** | ❌ 3 critical issues (RBAC gap, crypto default key, provider misconfiguration) |
| **Production readiness** | ❌ Orchestrator will crash on Writer/Reviewer dispatch |
| **Test coverage** | 🔲 Not reviewed (no test files in scope) |

**Decision: NOT MERGE-READY**

The following must be fixed before this code ships:

1. **CR-01** — Fire-and-forget orchestrator (silent data loss, crash risk)
2. **CR-02** — Invalid `'byok'` provider type (Writer/Reviewer agents crash)
3. **CR-03** — Missing RBAC on admin agent endpoints (authorization bypass)
4. **CR-04** — SSE mock data instead of real orchestrator output (pipeline disconnected)
5. **WR-03** — Missing owner checks on document/diagram routes (authorization gap)
6. **WR-05** — DB agent configs unused by orchestrator (admin UI is decorative)

---

_Reviewed: 2026-07-09T18:00:00Z_
_Reviewer: gsd-code-reviewer (deep analysis)_
_Depth: deep_
