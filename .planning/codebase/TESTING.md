# Testing Patterns

**Analysis Date:** 2026-07-13

## Test Framework

**Runner:**
- **Vitest** v3.1.1 (frontend), v3.0.0 (backend)
- Config (frontend): embedded in `vite.config.js` under `test` key
- Config (backend): `backend/vitest.config.ts`

**Config — Frontend** (`vite.config.js`):
```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test-setup.ts',
}
```

**Config — Backend** (`backend/vitest.config.ts`):
```ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      PORT: '0',
      DATABASE_URL: 'postgres://repora:repora@localhost:5434/repora',
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
```

**Assertion Library:**
- Vitest built-in `expect` (runs globally via `globals: true`)
- `@testing-library/jest-dom` for DOM matchers like `toBeInTheDocument()`

**Run Commands:**
```bash
npm test              # vitest run (frontend)
cd backend && npm test  # vitest run (backend)
npm run dev:backend   # dev mode (not test)
```

## Test File Organization

**Location:**
- **Backend**: All tests in `backend/tests/` directory (integration test suite, separate from source)
- **Frontend**: Tests are co-located with source files:
  - `src/stores/index.test.ts` — alongside `src/stores/index.ts`
  - `src/schemas/index.test.ts` — alongside `src/schemas/index.ts`
  - `src/components/GenerationProgress.test.tsx` — alongside component
  - `src/components/AgentStatus.test.tsx` — alongside component

**Naming:**
- Backend: `backend/tests/<feature>.test.ts` — e.g. `auth.test.ts`, `projects.test.ts`, `documents.test.ts`, `export.test.ts`, `negotiate.test.ts`, `hermes-tools.test.ts`, `hermes-context.test.ts`, `template-generation.test.ts`, `public.test.ts`
- Frontend: `<ComponentName>.test.tsx` for components, `<module>.test.ts` for modules

**Structure:**
```
backend/tests/
  setup.ts                    # Test seed + app bootstrap
  auth.test.ts                # Auth integration tests
  projects.test.ts            # Project CRUD tests
  documents.test.ts           # Document API tests
  export.test.ts              # Export endpoint tests
  public.test.ts              # Public endpoint tests (healthz, models, templates, validate)
  negotiate.test.ts           # Pipeline negotiation unit tests
  hermes-tools.test.ts        # AI tool extraction TDD tests
  hermes-context.test.ts      # Context type tests
  template-generation.test.ts # Template merge tests
src/
  stores/index.test.ts        # Store unit tests
  schemas/index.test.ts       # Zod schema validation tests
  components/
    AgentStatus.test.tsx      # Component unit tests
    GenerationProgress.test.tsx # Component unit tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

describe('POST /auth/register', () => {
  it('creates a new user and returns token', async () => {
    // ...
  })
  it('returns 409 for duplicate email', async () => {
    // ...
  })
})
```

**Patterns:**
- **Setup/teardown**: `beforeAll` to bootstrap app + seed, `afterAll` for cleanup
- **Per-test isolation**: `beforeEach` creates fresh user/project for each test
- **Unique data generation**: `randomEmail()` helper that uses `Date.now()` + random suffix to avoid collisions
- **Cleanup tracking**: `testUserIds` array collects created user IDs; `afterAll` iterates and calls `cleanupTestUser(id)` for each
- **`expect` chains**: Status code assertions via supertest `.expect(200)`, then body assertions via `expect(res.body).toHaveProperty('id')`
- **Error code testing**: `expect(res.body.error.code).toBe('email_exists')`

**Helpers:**
```typescript
// backend/tests/setup.ts — exports shared test utilities
export function getApp() { return app }
export { db, schema }
export async function cleanupTestUser(userId: string) { ... }

// backend/tests/auth.test.ts — local helpers
function randomEmail() {
  return `test-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

// src/components/GenerationProgress.test.tsx — event factory
const makeEvent = (overrides: Partial<HermesEvent> = {}): HermesEvent =>
  ({ type: 'agent_status', agent: 'Planner', status: 'thinking', ...overrides }) as HermesEvent
```

## Mocking

**Framework:** No explicit mocking framework (no `vi.mock`, `vi.spyOn`) found in tests.

**Patterns:**
- Backend tests run against a **real Express app** with a **real database** (PostgreSQL via `postgres` + Drizzle). The `setup.ts` seeds test data with deterministic UUIDs.
- Supertest (`request(app)`) used to perform actual HTTP requests through the middleware stack
- No HTTP or database mocking — tests exercise the full integration path
- Dynamic imports used in hermes-tools.test.ts and hermes-context.test.ts to import modules that may not exist yet (TDD red-green approach)

**What to Mock:**
- Integration tests: nothing mocked — real DB, real app instance
- Unit tests (schema validation, store tests): no mocks needed — pure function testing
- Hermes/agent tests: designed to validate tool shape (not execution), so `tool.inputSchema` is checked structurally without running `execute()`

**What NOT to Mock:**
- External services (LLM providers) — integration tests skip endpoints that depend on external AI
- Database — shared test DB used for all integration tests

## Fixtures and Factories

**Test Data:**
```typescript
// backend/tests/setup.ts — Full seed with deterministic UUIDs
const [admin, jean, client, sarah, marcus, elena] = await db.insert(users).values([
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Admin Repora', ... },
  // ... more seed users
])

// src/components/GenerationProgress.test.tsx — Factory function
const makeEvent = (overrides: Partial<HermesEvent> = {}): HermesEvent =>
  ({ type: 'agent_status', agent: 'Planner', status: 'thinking', ...overrides }) as HermesEvent
```

**Location:**
- Backend: `backend/tests/setup.ts` — main test seed with 6 users, 5 projects, 7 documents, 7 sections, 2 diagrams, comments, requirements, validations, templates, agent configs, API keys, audit logs
- Frontend: no centralized fixtures — test data created inline

## Coverage

**Requirements:** None enforced — no coverage thresholds found in vitest configs.

**View Coverage:**
```bash
npx vitest run --coverage   # (would need @vitest/coverage-v8 or similar installed)
```

Coverage reporting not configured in either `vite.config.js` or `backend/vitest.config.ts`.

## Test Types

**Unit Tests:**
- **Zod schema validation** (`src/schemas/index.test.ts`): Tests valid/invalid inputs for `DocumentSchema`, `UserSchema`, `MetricsSchema`
- **Zustand store logic** (`src/stores/index.test.ts`): Tests `useAuthStore`, `useWorkspaceStore`, `useSettingsStore` initial state, actions, resets
- **Pipeline negotiation** (`backend/tests/negotiate.test.ts`): Tests `acceptHandoff`, `rescopeHandoff`, `adjustContext`, `evaluateWriterOutput` with pure logic assertions
- **Template merge** (`backend/tests/template-generation.test.ts`): Tests `mergeTemplateWithOutline` edge cases
- **React component rendering** (`src/components/AgentStatus.test.tsx`): Tests all state rendering variants
- **React component event processing** (`src/components/GenerationProgress.test.tsx`): Tests event-to-state mapping, stall detection, completion summary

**Integration Tests:**
- **Auth API** (`backend/tests/auth.test.ts`): Full register/login/logout flow with DB roundtrip
- **Project CRUD** (`backend/tests/projects.test.ts`): Create, read, update, delete projects; list requirements
- **Document operations** (`backend/tests/documents.test.ts`): Get, update, version history, comments, validation tokens
- **Export endpoint** (`backend/tests/export.test.ts`): Markdown, DOCX, PDF formats; error handling
- **Public endpoints** (`backend/tests/public.test.ts`): Health check, models listing, templates CRUD, validation portal
- **Tool shape validation** (`backend/tests/hermes-tools.test.ts`): Verifies tool module exports have correct Zod inputSchema shapes with `.describe()` on fields

**E2E Tests:** Not used — no Playwright, Cypress, or other E2E framework detected.

## Common Patterns

**Async Testing (Backend Integration):**
```typescript
// Pattern: await supertest request + expect status + expect body
const res = await request(app)
  .post('/auth/register')
  .send({ name: 'Test User', email: randomEmail(), password: 'testpass123' })
  .expect(201)

expect(res.body).toHaveProperty('token')
expect(res.body).toHaveProperty('user')
```

**Async Testing (Frontend):**
```typescript
// Pattern: render component + assert DOM content
render(<GenerationProgress events={events} isStreaming={true} />)
expect(screen.getByText('Planner')).toBeInTheDocument()
expect(screen.getByText('reflexion')).toBeInTheDocument()
```

**Error Testing:**
```typescript
// Pattern: trigger error + assert error.code
const res = await request(app)
  .post('/auth/login')
  .send({ email: 'nobody@nowhere.dev', password: 'testpass123' })
  .expect(401)

expect(res.body.error.code).toBe('invalid_credentials')

// Pattern: 400 on validation failure
const res = await request(app)
  .post(`/projects/${projectId}/requirements`)
  .set('Authorization', `Bearer ${token}`)
  .send({})
  .expect(400)

expect(res.body.error.code).toBe('missing_fields')
```

**Schema Validation Testing:**
```typescript
const result = DocumentSchema.safeParse(doc)
expect(result.success).toBe(true)

const result = DocumentSchema.safeParse({})
expect(result.success).toBe(false)
```

**Cleanup Pattern:**
```typescript
// Pattern: collect created IDs + cleanup in afterAll
const testUserIds: string[] = []

afterAll(async () => {
  for (const id of testUserIds) {
    await cleanupTestUser(id)
  }
})
```

**TDD Red-Green Pattern (Backend):**
- `hermes-context.test.ts` and `hermes-tools.test.ts` explicitly state they are the RED phase of TDD
- Tests use `await import()` to dynamically load modules that may not exist yet
- Tests validate the structural shape of exports (presence, type, schema fields) rather than behavior
- Pattern: `(await import('../src/ai/context')).createContext(...)` — dynamic import allows test file to load even before module exists

## Setup Files

**Frontend** (`src/test-setup.ts`):
```typescript
import '@testing-library/jest-dom'
```

**Backend** (`backend/tests/setup.ts`):
- Seeds database with deterministic test data (6 users, 5 projects, 7 documents, sections, diagrams, etc.)
- Imports and bootstraps the Express app in `beforeAll`
- Exports `getApp()`, `db`, `schema`, and `cleanupTestUser()`
- Handles missing database gracefully: `try/catch` with `'Database unavailable — skipping seed.'`

## Current Test Coverage (File Counts)

| Area | Test Files | Lines of Test Code |
|------|-----------|-------------------|
| Backend integration | 9 files (`backend/tests/*.test.ts`) | ~1,350 lines |
| Frontend stores | 1 file (`src/stores/index.test.ts`) | 146 lines |
| Frontend schemas | 1 file (`src/schemas/index.test.ts`) | 144 lines |
| Frontend components | 2 files (`*Component*.test.tsx`) | 173 lines |

---

*Testing analysis: 2026-07-13*
