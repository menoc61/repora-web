# Technology Stack — Deep Research

**Project:** Repora — AI-powered multi-agent specification document generator
**Researched:** 2026-07-13
**Mode:** Ecosystem (with feasibility notes for specific upgrades)

## Scope

This research covers four upgrade dimensions for the existing Repora stack:

| Dimension | Current State | Research Goal |
|-----------|--------------|---------------|
| **Multi-Agent AI Orchestration** | Vercel AI SDK v7 + ToolLoopAgent + custom Hermes dispatcher | Best practices for agent isolation, tool context, durability, parallel sub-agents |
| **DOCX/PDF Export Quality** | `docx` v9.7.1 + PDFKit v0.19.1 + planned LibreOffice in Docker | Professional document fidelity, PDF conversion strategy without bloating Docker image |
| **S3/MinIO Integration** | `@aws-sdk/client-s3` v3.700.0 with dynamic imports per function call | Lazy singleton pattern, throughput configuration, resource management |
| **Test Coverage** | Vitest 3.x + supertest 7.x, 97 backend tests (3 failing) | Testcontainers for real DB, MSW for HTTP mocking, coverage targets, CI/CD |

**Constraint:** Must remain compatible with existing Docker Compose deployment, Node 22, Express 5, Drizzle ORM 0.43.x.

---

## 1. Multi-Agent AI Orchestration

### Current Architecture Assessment

Repora uses a custom Hermes orchestrator that dispatches to 5 specialized agents (Planner, Writer, UML, Tables, Reviewer) via the Vercel AI SDK v7 `ToolLoopAgent` with SSE streaming. Each agent is provider-agnostic (local llama.cpp or BYOK). This is architecturally sound — the Vercel AI SDK v7 is the right abstraction layer.

**Confidence: HIGH** — AI SDK v7 is actively maintained (>16M weekly downloads) and the recommended agent framework for TypeScript.

### Recommended Upgrades

| Upgrade | Library | Version | Priority | Why |
|---------|---------|---------|----------|-----|
| ✨ Subagents Pattern | `ai` (built-in) | v7 (already installed) | **Phase 1** | Agent isolation — each subagent gets its own context window, preventing context bloat. The main Hermes agent stays focused on orchestration while Planner/Writer/UML/Tables/Reviewer run as subagents with isolated context. |
| ✨ Tool Context | `ai` (built-in) | v7 | **Phase 1** | Use `runtimeContext` + `toolsContext` instead of ad-hoc context passing. Typed, serializable context flows through `prepareStep` and lifecycle callbacks. Replace any use of deprecated `experimental_context`. |
| ✨ Parallel Execution | `ai` (built-in) | v7 | **Phase 2** | UML and Tables agents can run in parallel since they're independent. Use `Promise.all` with subagents to reduce wall-clock time during generation. |
| ⚠️ WorkflowAgent | `@ai-sdk/workflow` | ^7.0.0 | **Future** | Durable, resumable agent execution for long-running document generation. Each tool call becomes a persisted step. Use when generation spans >30s or needs human-in-the-loop approval. Do NOT migrate today — adds complexity without current need. |

#### Pattern: Subagents for Agent Isolation

```typescript
// === CURRENT PATTERN (works, but context grows unbounded) ===
const result = await agent.stream({ messages: allMessages });

// === RECOMMENDED (each subagent gets its own context) ===
const researchTool = tool({
  description: 'Generate UML diagrams for the specification',
  inputSchema: z.object({
    requirements: z.array(z.object({ id: z.number(), text: z.string() })),
    diagramTypes: z.array(z.enum(['use_case', 'sequence', 'activity', 'class', 'deployment'])),
  }),
  execute: async function* ({ requirements, diagramTypes }, { abortSignal }) {
    const umlSubagent = new ToolLoopAgent({
      model: currentModel,
      instructions: 'You are a UML diagram specialist...',
      tools: { generatePlantUml, renderDiagram, saveDiagram },
    });

    const result = await umlSubagent.stream({
      prompt: `Generate ${diagramTypes.join(', ')} diagrams for these requirements: ${JSON.stringify(requirements)}`,
      abortSignal,
    });

    // Stream progress to the UI
    for await (const message of readUIMessageStream({
      stream: toUIMessageStream({ stream: result.stream }),
    })) {
      yield message;
    }
  },
  // Main agent sees only the summary, not the 100K tokens of diagram reasoning
  toModelOutput: ({ output: message }) => {
    const lastText = message?.parts.findLast(p => p.type === 'text');
    return { type: 'text', value: lastText?.text ?? 'Diagrams generated.' };
  },
});
```

**Key benefit:** Subagents prevent context bloat in the main Hermes agent. Each subagent's exploration (100K+ tokens of diagram reasoning) is summarized to a few hundred tokens for the orchestrator.

**Key caveat:** Subagents add latency. Only use when the task is complex enough to justify the overhead. Simple section writing does NOT need subagent isolation.

#### Pattern: runtimeContext for Shared Orchestration State

```typescript
// Instead of passing project ID through prompt injection:
const agent = new ToolLoopAgent({
  model: currentModel,
  instructions: 'You are the Hermes orchestrator...',
  tools: { plannerTool, writerTool /* ... */ },
  runtimeContext: {     // <-- typed, serializable, available in prepareStep
    projectId: project.id,
    documentId: document.id,
    generationPhase: 'planning' as const,
    userId: user.id,
  },
});

// In prepareStep, context is available:
prepareStep: async ({ context }) => {
  // context.runtimeContext.projectId — no need to extract from prompt
  // context.toolsContext — per-tool scoped values
  return { context: { ...context, updated: true } };
},
```

#### Version Considerations

| Concern | Assessment |
|---------|------------|
| AI SDK v7 is current? | Yes. v7 is the major release for production agents. Repora is already on v7. |
| `ToolLoopAgent` stable? | Yes. It's the recommended default. `WorkflowAgent` is the new durable variant. |
| `runtimeContext` deprecated? | No — it's the replacement for `experimental_context` in v7. Actively maintained. |
| `readUIMessageStream` stable? | Yes, part of AI SDK v7 subagent streaming support. |
| `toModelOutput` stable? | Yes, part of v7 for controlling what the orchestrator sees. |

---

## 2. DOCX/PDF Export Quality

### Current Architecture Assessment

DOCX generation uses `docx` v9.7.1 (latest) with a builder service. PDF conversion is via PDFKit (fallback) with LibreOffice planned for Docker. The known issue is that LibreOffice is NOT installed in the Docker image (PDF-01 in PROJECT.md). Cover images are broken in Docker (COVER-01).

**Confidence: HIGH** for DOCX library choice (docx is the standard). **MEDIUM** for PDF strategy (multiple viable approaches).

### DOCX Library: Keep & Optimize

`docx` v9.7.1 is the latest version and the right choice. No upgrade needed. Focus on **usage quality**:

| Pattern | Current | Recommended | Impact |
|---------|---------|-------------|--------|
| Document Styles | Unknown/inline | Declarative `styles.paragraphStyles` + `styles.characterStyles` | Professional headers, consistent fonts, working TOC |
| Numbering (Lists) | Unknown | Proper `LevelFormat.BULLET` with numbering config | Real Word lists, not unicode bullets |
| Cover Page | Broken in Docker | Use header/footer + section breaks with proper image path resolution | Fixes COVER-01 |
| Image Embedding | Unknown | `ImageRun` with `type` parameter, base64 or buffer | Working diagrams in DOCX |
| TOC | Unknown | `TableOfContents` requires `HeadingLevel` styles, NOT custom styles | Working table of contents |

**Critical rules from the docx library ecosystem (verified against actual usage):**
- `const { Document, Packer, Paragraph, TextRun, HeadingLevel, TableOfContents, AlignmentType, LevelFormat, UnderlineType, ImageRun } = require('docx')` — correct named exports
- Styles must use exact style IDs like `"Heading1"`, `"Heading2"` for TOC to work
- `outlineLevel` in paragraph properties is required for heading styles to appear in TOC
- Images require `ImageRun` with `type` parameter (`"png"`, `"jpg"`, etc.)
- Numbering requires `LevelFormat.BULLET` constant, NOT the string `"bullet"`
- Each numbering reference creates an INDEPENDENT list — use unique references per section

### PDF Conversion: WASM LibreOffice over Native Install

**The 2026 game-changer:** `@matbee/libreoffice-converter` provides headless LibreOffice compiled to WebAssembly. No native dependencies, no `apt-get install libreoffice`, no 500MB Docker image bloat.

| Approach | Image Size | Speed | Complexity | Verdict |
|----------|-----------|-------|-----------|---------|
| `apt-get install libreoffice` in Docker | +500MB | 5-30s first call, ~3s subsequent | Low (just apt) | ⚠️ Current plan, bloats image |
| **`@matbee/libreoffice-converter` WASM** | +150MB (WASM files) | ~35ms after init | Medium (worker converter) | ✅ **RECOMMENDED** |
| Gotenberg sidecar container | +200MB (separate container) | 2-10s | Low (HTTP call) | ✅ Alternative |
| pdfbro (Rust-native) | +150MB | ~100ms | Low (HTTP call) | ✅ Good but newer |
| PDFKit only | 0MB | Fast | Already have it | ❌ Poor quality, keep as fallback only |

**Recommendation:** Use `@matbee/libreoffice-converter` v2.6.0 for the primary PDF conversion path. Keep PDFKit as fallback for when WASM is unavailable.

```bash
npm install @matbee/libreoffice-converter@^2.6.0
```

```typescript
import { createWorkerConverter } from '@matbee/libreoffice-converter/server';

// Singleton — initialize once, reuse for all conversions
let converter: Awaited<ReturnType<typeof createWorkerConverter>> | null = null;

async function getConverter() {
  if (!converter) {
    converter = await createWorkerConverter();
  }
  return converter;
}

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  try {
    const c = await getConverter();
    return await c.convert(docxBuffer, { outputFormat: 'pdf' });
  } catch (err) {
    console.warn('[PDF] WASM conversion failed, falling back to PDFKit:', (err as Error).message);
    return fallbackToPdfkit(docxBuffer);
  }
}
```

**Docker impact:** The WASM files (~150MB) need to be included in the Docker image or mounted as a volume. Add to the backend Dockerfile:
```dockerfile
# Install LibreOffice WASM files
COPY --from=node:22-alpine /app/node_modules/@matbee/libreoffice-converter/dist/wasm/ /app/node_modules/@matbee/libreoffice-converter/dist/wasm/
```

Or better: let npm install them. They're part of the package.

### JSON-to-DOCX Bridge (Nice-to-Have)

`@json-to-office/json-to-docx` v0.19.0 is a new library (first published March 2026) that generates DOCX from JSON definitions. This is **interesting but not recommended for v1** because:

- **Pro:** LLM-friendly — AI agents can emit JSON document definitions instead of raw docx API calls
- **Pro:** Schema-validated via TypeBox
- **Con:** Young library (0.x, first published 3 months ago)
- **Con:** Adds another abstraction layer on top of `docx`
- **Con:** Limited component types (13) — may not support all Repora's complex layouts

**Verdict:** Monitor. If the library matures to 1.0, it could simplify the Writer agent's output formatting. For now, keep direct `docx` usage.

---

## 3. S3/MinIO Integration

### Current Architecture Assessment

The S3 service (`backend/src/services/s3.service.ts`) uses **dynamic imports per function call** — every `uploadExport`, `downloadExport`, and `ensureBucket` re-imports `@aws-sdk/client-s3` via `await import('@aws-sdk/client-s3' as string)`. The client itself is lazily initialized (correct), but the imports are wasteful (incorrect).

**Confidence: HIGH** — this is a clear performance bug confirmed by AWS SDK team docs.

### Recommended Fix: Static Imports + Lazy Singleton

```typescript
import { config } from '../config'
import { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

let _client: S3Client | null = null
let _available: boolean | null = null

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: true,
      // Performance config (from AWS SDK best practices):
      requestHandler: {
        httpsAgent: { maxSockets: 50 },
        requestTimeout: 5_000,
      },
      cacheMiddleware: true,  // Only if not adding custom middleware
    })
  }
  return _client
}
```

**Why this matters (from AWS SDK official docs):**
- Repeated imports re-resolve the module graph, consuming CPU and memory
- The SDK caches credentials, middleware, and socket pools per client instance — creating (or re-importing) a new client discards these caches
- `forcePathStyle: true` is required for MinIO — keep it
- `maxSockets: 50` handles the expected parallel workload (document generation + diagram uploads)
- Stream responses MUST be fully read to prevent socket exhaustion — the current `downloadExport` already reads the full stream, which is correct

**Additional recommendation:** Add graceful degraded mode detection at module init:

```typescript
async function checkAvailability(): Promise<boolean> {
  if (_available !== null) return _available
  try {
    const client = getClient()
    await client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }))
    _available = true
  } catch {
    _available = false
    console.warn('[S3] MinIO/S3 not available — exports will not be cached')
  }
  return _available
}
```

---

## 4. Test Coverage

### Current Architecture Assessment

- **Test runner:** Vitest 3.x — excellent choice, keep it
- **HTTP testing:** supertest 7.x — correct for Express 5
- **Coverage:** 97 backend integration tests (3 failing)
- **Gaps identified in PROJECT.md:** S3 service, DOCX builder, validation portal, onboarding wizard
- **No CI/CD pipeline** detected

**Confidence: HIGH**

### Recommended Test Infrastructure

| Tool | Version | Purpose | Priority |
|------|---------|---------|----------|
| `vitest` | ^3.0.0 (keep) | Test runner | Already installed |
| `supertest` | ^7.0.0 (keep) | HTTP integration testing | Already installed |
| `@testcontainers/postgresql` | ^10.23.0 | Real PostgreSQL in Docker for integration tests | **Phase 1** |
| `testcontainers` | ^10.23.0 | Container lifecycle management | **Phase 1** |
| `msw` | ^2.x | HTTP mocking for third-party APIs (PlantUML, LLM providers) | **Phase 2** |
| `@faker-js/faker` | ^9.x | Realistic test data generation | **Phase 1** |
| `@playwright/test` | ^1.x | E2E browser tests (validation portal) | **Phase 2** |

```bash
npm install -D @testcontainers/postgresql@^10 testcontainers@^10 msw@^2 @faker-js/faker@^9
```

### Vitest Configuration Overhaul

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Pool: forks for DB test isolation (safer than threads with DB connections)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,  // parallel forks for speed
      },
    },
    isolate: true,  // fresh module graph per file
    globals: false,  // explicit imports preferred
    testTimeout: 60_000,  // Testcontainers cold start needs this
    hookTimeout: 60_000,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/db/migrations/**',
        'src/test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/types/**',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 65,
        lines: 70,
      },
    },
  },
})
```

### Testcontainers + Drizzle Integration Pattern

This is the recommended pattern for integration tests that hit a real PostgreSQL database:

```typescript
// src/test/db.ts — shared test database helper
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../db/schema'

let container: StartedPostgreSqlContainer
let sql: postgres.Sql
let db: ReturnType<typeof drizzle>

export async function setupTestDb() {
  container = await new PostgreSqlContainer('postgres:17-alpine')
    .withReuse()  // reuse across runs for fast local iteration
    .start()

  sql = postgres(container.getConnectionUri())
  db = drizzle(sql, { schema })

  // Run migrations against the test DB
  await migrate(db, { migrationsFolder: './src/db/migrations' })

  return { db, sql, container }
}

export async function teardownTestDb() {
  await sql?.end()
  await container?.stop()
}

export async function cleanDb() {
  // Truncate all tables in dependency order
  const tables = ['validations', 'comments', 'diagrams', 'sections', 'documents',
                  'assistant_sessions', 'agent_configs', 'requirements', 'templates',
                  'api_keys', 'audit_logs', 'projects', 'users']
  for (const table of tables) {
    await sql.unsafe(`TRUNCATE TABLE ${table} CASCADE`)
  }
}
```

### Test Patterns by Layer

| Layer | Tool | Pattern | Tests to Write |
|-------|------|---------|---------------|
| **Unit (Services)** | `vitest` + `vi.mock()` | Isolate business logic, mock DB + external APIs | Auth service, crypto utils, diagram service |
| **Integration (API)** | `supertest` + Testcontainers | Real DB, full HTTP cycle | All route handlers, middleware, error handling |
| **Integration (Export)** | `vitest` + `docx` buffer assertions | Fixture data → `Packer.toBuffer()` → assert buffer validity | DOCX builder (TEST-03) |
| **Integration (S3)** | `vi.mock()` or `@testcontainers/minio` | Mock/minio client assertions | S3 service (TEST-02) |
| **Contract** | `vitest` + Zod schemas | Assert response shape matches schema | Every public endpoint |
| **E2E (Portal)** | Playwright | Browser-based validation flow | Validation portal (TEST-04) |
| **E2E (Wizard)** | Playwright + supertest | Full onboarding flow | Onboarding wizard (TEST-05) |

### Key Test Repairs

| Failing Test | Root Cause | Fix |
|-------------|------------|-----|
| 2 Zod validation error code mismatches | Error code string doesn't match tested value | Update tests to match actual error codes, or standardize error codes in validation middleware |
| 1 French detection heuristic | Edge case in language detection | Fix the heuristic or adjust the test fixture |

### CI/CD Pipeline

No CI detected. Add GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: repora_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run test
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/repora_test
```

---

## 5. Infrastructure & Observability (New Recommendations)

These aren't in the original question but emerged from the research as important gaps:

| Area | Current | Recommended | Why |
|------|---------|-------------|-----|
| **Structured Logging** | `console.log` / `console.warn` | `pino` ^9.x | Production logging with levels, JSON output, Docker-friendly. **Pino over Winston** because it's faster, has less overhead, and integrates well with Express (pino-http). |
| **Audit Logging** | Custom `audit_logs` table | Keep — already correct for compliance | Add structured audit events instead of generic log entries |
| **Error Tracking** | None | `@sentry/node` or `@opentelemetry/instrumentation-http` | Phase 2 — not urgent for self-hosted, but needed for hosted SaaS |
| **Health Checks** | `GET /healthz` → `{ status: 'ok' }` | Add DB connectivity + LLM provider checks | Currently checks nothing real |
| **Rate Limiting** | None | `express-rate-limit` ^7.x | Protect API endpoints from abuse, especially LLM generation (cost) |

### Logging Recommendation

```bash
npm install pino@^9 pino-http@^10 pino-pretty@^13
```

```typescript
// backend/src/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    censor: '[REDACTED]',
  },
})
```

---

## 6. Recommendations Summary

### Phase 1 (Immediate, High-Impact)

| Upgrade | Effort | Risk | Confidence |
|---------|--------|------|------------|
| Fix S3 dynamic imports → static imports + lazy singleton | 1 hour | Low | **HIGH** (confirmed bug) |
| Fix 3 failing tests (error codes + French detection) | 2 hours | Low | **HIGH** |
| Add Testcontainers + real DB integration tests | 8 hours | Medium | **HIGH** |
| Add structured logging (Pino) | 4 hours | Low | **HIGH** |
| Add GitHub Actions CI pipeline | 2 hours | Low | **HIGH** |
| DOCX export: fix cover image path for Docker | 2 hours | Low | **HIGH** (fixes COVER-01) |

### Phase 2 (Medium-Term)

| Upgrade | Effort | Risk | Confidence |
|---------|--------|------|------------|
| Convert PDF to `@matbee/libreoffice-converter` WASM | 8 hours | Medium | **HIGH** (eliminates Docker LibreOffice dependency) |
| Subagents pattern for Hermes orchestrator | 16 hours | Medium | **MEDIUM** (improves context management, adds complexity) |
| Parallel agent execution (UML + Tables) | 4 hours | Low | **HIGH** (independent tasks, safe to parallelize) |
| Add MSW for HTTP mocking in tests | 4 hours | Medium | **HIGH** |
| Playwright E2E tests for validation portal | 8 hours | Medium | **HIGH** (covers TEST-04, TEST-05) |
| Contract tests with Zod schemas | 4 hours | Low | **HIGH** (prevents response-shape regressions) |

### Phase 3 (Future)

| Upgrade | Effort | Risk | Confidence |
|---------|--------|------|------------|
| Migrate to `WorkflowAgent` for durable generation | 24 hours | High | **MEDIUM** (only if generation runs exceed function timeouts) |
| `@json-to-office/json-to-docx` integration | 8 hours | Medium | **LOW** (library too young, v0.x) |
| Sentry / OpenTelemetry integration | 8 hours | Low | **HIGH** (needed for hosted SaaS) |
| Rate limiting on LLM generation endpoints | 2 hours | Low | **HIGH** |

---

## 7. Alternatives Explicitly Not Recommended

| Library | Why Not |
|---------|---------|
| **Prisma** (instead of Drizzle) | Heavier, slower migration DX, harder to containerize. Drizzle 0.43.0 is correct. |
| **Ollama npm client** (instead of `@ai-sdk/openai-compatible`) | The `ai` SDK's OpenAI-compatible provider is the correct abstraction. Direct Ollama client bypasses the provider layer. |
| **Puppeteer for PDF** (instead of LibreOffice) | Massive Chrome bundle in Docker (+300MB), slower, worse DOCX→PDF fidelity than LibreOffice. |
| **Jest** (instead of Vitest) | Vitest is faster (ESM-native, Vite-backed), has better TypeScript integration, and the same API. Jest 30 is viable but offers no advantage for a greenfield project. |
| **Winston** (instead of Pino) | Pino is 5x faster, has better ESM support, and `pino-http` is a first-class Express middleware. Winston has more plugins but higher overhead. |

---

## 8. Sources & Confidence

| Source | Area | Confidence |
|--------|------|-----------|
| [AI SDK v7 Agents: Overview](https://ai-sdk.dev/v7/docs/agents/overview) | AI Orchestration | **HIGH** (official docs) |
| [AI SDK v7 Subagents](https://ai-sdk.dev/v7/docs/agents/subagents) | AI Orchestration | **HIGH** (official docs) |
| [AI SDK v7 WorkflowAgent](https://ai-sdk.dev/v7/docs/agents/workflow-agent) | AI Orchestration | **HIGH** (official docs) |
| [AI SDK v7 Workflow Patterns](https://ai-sdk.dev/v7/docs/agents/workflows) | AI Orchestration | **HIGH** (official docs) |
| [AWS SDK v3 Effective Practices](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/EFFECTIVE_PRACTICES.md) | S3 | **HIGH** (official docs) |
| [AWS SDK v3 Parallel Workloads](https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/performance/parallel-workloads-node-js.md) | S3 | **HIGH** (official docs) |
| [docx npm package v9.7.1](https://www.npmjs.com/package/docx) | Export | **HIGH** (package registry) |
| [docx.js.org docs](https://docx.js.org/api/modules.html) | Export | **HIGH** (library docs) |
| [`@matbee/libreoffice-converter` v2.6.0](https://www.npmjs.com/package/@matbee/libreoffice-converter) | PDF | **HIGH** (package registry, WASM approach) |
| [`@json-to-office/json-to-docx` v0.19.0](https://www.npmjs.com/package/@json-to-office/json-to-docx) | Export | **MEDIUM** (young library, v0.x) |
| [Testcontainers PostgreSQL Guide (QASkills 2026)](https://qaskills.sh/blog/testcontainers-postgresql-node-complete-guide) | Testing | **HIGH** (verified against official testcontainers docs) |
| [Vitest + Express Guide (2026)](https://sanjewa.com/blogs/testing-express-apis-like-a-senior-engineer-2027/) | Testing | **MEDIUM** (blog, but matches official docs) |
| [Testing Node.js API with Vitest (2026)](https://nodewire.net/test-nodejs-api-jest-vitest/) | Testing | **MEDIUM** (blog, well-researched) |
| [Drizzle ORM Testing patterns](https://qaskills.sh/skills/thetestingacademy/drizzle-orm-testing) | Testing | **MEDIUM** (community guide) |
| [Vercel AI SDK v7 changelog](https://vercel.com/changelog/ai-sdk-7) | AI Orchestration | **HIGH** (official) |

---

*Last updated: 2026-07-13*
