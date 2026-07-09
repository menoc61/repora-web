# Repora Backend Design

> Express + Drizzle ORM + Vercel AI SDK 7 backend for the Repora document platform.
> Wires all frontend pages with real data, Hermes multi-agent orchestrator, BYOK provider layer.

## Architecture Overview

```
Frontend (Vite SPA)  ←→  Nginx (/api proxy)  ←→  Express Backend (:3001)  ←→  PostgreSQL (:5432)
                                                          ↓
                                              llama-server (:8080) [optional local inference]
```

Monorepo structure: `repora-web/backend/` alongside the existing `repora-web/src/` frontend.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| HTTP framework | Express.js | Mature, SSE-friendly, REST + streaming |
| ORM | Drizzle ORM | TypeScript-native, Drizzle Kit migrations, Zod-compatible types |
| Auth | JWT (jsonwebtoken + bcrypt) | Stateless, matches frontend's Bearer token pattern |
| AI SDK | `ai@^7` + `@ai-sdk/*` packages | Unified provider abstraction, tool calling, streaming |
| Database | PostgreSQL 17 | Matches AGENTS.md data model, JSON support for outlines/reasons |
| Validation | Zod v4 | Already used by frontend, shared schemas possible |

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Express app bootstrap
│   ├── config.ts             # Env vars (DB, JWT secret, llama.cpp URL)
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (11 tables)
│   │   ├── index.ts          # DB connection + drizzle instance
│   │   └── migrations/       # Drizzle Kit generated
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification → req.user
│   │   └── error.ts          # Global error handler
│   ├── routes/
│   │   ├── auth.ts           # POST /auth/login|register|logout, GET /auth/me
│   │   ├── projects.ts       # CRUD /projects, POST /projects/:id/generate
│   │   ├── documents.ts      # GET /documents/:id, GET /documents/:id/stream (SSE)
│   │   ├── diagrams.ts       # GET/POST diagrams
│   │   ├── admin.ts          # agents, metrics, logs
│   │   ├── export.ts         # PDF/DOCX export
│   │   └── validation.ts     # GET/POST /validate/:token
│   ├── services/
│   │   ├── auth.service.ts   # Password hashing, JWT sign/verify
│   │   ├── project.service.ts
│   │   ├── document.service.ts
│   │   ├── diagram.service.ts
│   │   ├── export.service.ts
│   │   └── audit.service.ts
│   ├── ai/
│   │   ├── hermes.ts         # Hermes orchestrator
│   │   ├── agents/
│   │   │   ├── registry.ts   # Agent definitions + tool schemas
│   │   │   ├── planner.ts
│   │   │   ├── writer.ts
│   │   │   ├── uml.ts
│   │   │   ├── tables.ts
│   │   │   └── reviewer.ts
│   │   └── tools/
│   │       └── index.ts      # Tool implementations (DB read/write, PlantUML)
│   └── utils/
│       ├── crypto.ts         # Encryption for BYOK API keys
│       └── plantuml.ts       # PlantUML renderer
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── Dockerfile
```

## Database Schema (Drizzle ORM)

### users
- `id: uuid` PK default gen_random_uuid()
- `name: text` not null
- `email: text` not null unique
- `password_hash: text` not null (bcrypt)
- `role: text` not null default 'redacteur' — enum: redacteur | validateur | admin | super_admin
- `created_at: timestamp` default now()

### projects
- `id: uuid` PK
- `owner_id: uuid` FK → users.id
- `name: text` not null
- `brief: text`
- `status: text` default 'draft'
- `created_at: timestamp` default now()
- `updated_at: timestamp` default now()

### requirements
- `id: uuid` PK
- `project_id: uuid` FK → projects.id
- `type: text` not null — enum: functional | non_functional
- `text: text` not null
- `source_actor: text`
- `created_at: timestamp` default now()

### documents
- `id: uuid` PK
- `project_id: uuid` FK → projects.id
- `status: text` default 'draft' — enum: draft | in_review | validated | rejected
- `outline: jsonb`
- `created_at: timestamp` default now()
- `updated_at: timestamp` default now()

### sections
- `id: uuid` PK
- `document_id: uuid` FK → documents.id
- `order: integer` not null
- `title: text` not null
- `content: text` default ''
- `status: text` default 'draft'
- `generated_by_agent: text`
- `model_used: text`
- `created_at: timestamp` default now()
- `updated_at: timestamp` default now()

### diagrams
- `id: uuid` PK
- `project_id: uuid` FK → projects.id
- `type: text` not null — enum: use_case | sequence | activity | class | deployment
- `plantuml_source: text`
- `rendered_url: text`
- `created_at: timestamp` default now()

### comments
- `id: uuid` PK
- `section_id: uuid` FK → sections.id
- `author_id: uuid` FK → users.id
- `text: text` not null
- `resolved: boolean` default false
- `created_at: timestamp` default now()

### validations
- `id: uuid` PK
- `document_id: uuid` FK → documents.id
- `validator_token: text` not null unique (crypto.randomUUID)
- `decision: text` — enum: validated | rejected
- `section_reasons: jsonb` — { section_id: reason }
- `decided_at: timestamp`
- `created_at: timestamp` default now()

### agent_configs
- `id: uuid` PK
- `agent_name: text` not null unique
- `provider: text` not null — enum: llama_cpp | byok
- `model_id: text`
- `temperature: real` default 0.7
- `top_p: real` default 0.9
- `max_tokens: integer` default 4096
- `enabled: boolean` default true
- `updated_at: timestamp` default now()

### api_keys
- `id: uuid` PK
- `user_id: uuid` FK → users.id
- `provider: text` not null — e.g. openai, anthropic, google
- `encrypted_key: text` not null (Fernet/libsodium)
- `created_at: timestamp` default now()

### audit_logs
- `id: uuid` PK
- `user_id: uuid` FK → users.id
- `action: text` not null
- `target: text`
- `metadata: jsonb`
- `timestamp: timestamp` default now()

## API Routes (Express)

### Auth (no auth required for login/register)
| Method | Route | Request | Response |
|---|---|---|---|
| POST | /auth/login | `{ email, password }` | `{ token, user }` |
| POST | /auth/register | `{ name, email, password }` | `{ token, user }` |
| POST | /auth/logout | — | `{ ok: true }` |
| GET | /auth/me | — | `{ id, name, email, role }` |

### Health
| Method | Route | Response |
|---|---|---|
| GET | /healthz | `{ status: "ok" }` |

### Projects (auth required)
| Method | Route | Request | Response |
|---|---|---|---|
| GET | /projects | — | `BackendProject[]` |
| POST | /projects | `{ name, brief? }` | `BackendProject` |
| GET | /projects/:id | — | `BackendProject` |
| PATCH | /projects/:id | `{ name?, brief?, status? }` | `BackendProject` |
| DELETE | /projects/:id | — | `{ ok: true }` |
| POST | /projects/:id/generate | `{ prompt }` | `{ document_id, status }` |

### Documents (auth required)
| Method | Route | Request | Response |
|---|---|---|---|
| GET | /documents/:id | — | `BackendDocument` (with sections) |
| GET | /documents/:id/stream | — | SSE stream |
| GET | /documents/:id/export?format=pdf\|docx | — | Binary file |
| POST | /documents/:id/validation-token | — | `{ token }` |

### Diagrams (auth required)
| Method | Route | Request | Response |
|---|---|---|---|
| GET | /projects/diagrams/:id | — | `{ id, type, rendered_url }` |
| POST | /projects/:id/diagrams | `{ type, source? }` | `{ id, rendered_url }` |

### Admin (admin role required)
| Method | Route | Request | Response |
|---|---|---|---|
| GET | /admin/agents | — | `BackendAgent[]` |
| PATCH | /admin/agents/:name | `{ provider?, model_id?, enabled?, temperature? }` | `{ ok: true }` |
| GET | /admin/metrics | — | `BackendMetrics` |
| GET | /admin/logs | — | `BackendLog[]` |

### Validation (public)
| Method | Route | Request | Response |
|---|---|---|---|
| GET | /validate/:token | — | `{ document_id, decision }` (read-only doc view) |
| POST | /validate/:token/decision | `{ decision, section_reasons }` | `{ ok: true }` |

## AI Layer: Hermes + Vercel AI SDK 7

### Provider Setup

```typescript
// Local llama.cpp provider
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
const llamaProvider = createOpenAICompatible({
  name: 'llama',
  baseURL: 'http://localhost:8080/v1',
})

// BYOK provider factory (created per-request with user's decrypted key)
function createBYOKProvider(provider: string, apiKey: string) {
  switch (provider) {
    case 'openai':
      return createOpenAICompatible({
        name: 'byok-openai',
        baseURL: 'https://api.openai.com/v1',
        apiKey,
      })
    case 'anthropic':
      return createOpenAICompatible({
        name: 'byok-anthropic',
        baseURL: 'https://api.anthropic.com/v1',
        apiKey,
        headers: { 'anthropic-version': '2023-06-01' },
      })
    default:
      return createOpenAICompatible({
        name: 'byok',
        baseURL: `https://api.${provider}.com/v1`,
        apiKey,
      })
  }
}
```

### Hermes Orchestrator

The orchestrator uses `streamText` with `maxSteps` for automatic multi-step tool calling:

```typescript
import { streamText, tool } from 'ai'
import { z } from 'zod'

// Each agent in the registry defines its tools + system prompt
const plannerTools = {
  propose_outline: tool({
    description: 'Propose a document outline from a project brief',
    inputSchema: z.object({ brief: z.string() }),
    execute: async ({ brief }) => {
      // AI SDK calls this, result feeds back to the model
      const outline = await generateOutline(brief)
      return outline
    },
  }),
  save_outline: tool({
    description: 'Save the approved outline to the document',
    inputSchema: z.object({ documentId: z.string(), outline: z.any() }),
    execute: async ({ documentId, outline }) => {
      await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
      return { ok: true }
    },
  }),
}

// The orchestrator dispatch function
async function* runAgent(agentConfig, prompt, context): AsyncGenerator<StreamEvent> {
  const model = getModelForAgent(agentConfig)
  const result = streamText({
    model,
    system: agentConfig.systemPrompt,
    prompt,
    tools: agentConfig.tools,
    maxSteps: 10,
    onStepFinish: (step) => {
      // Emit agent status events for frontend Agent Chips
    },
  })

  for await (const event of result.fullStream) {
    // Relay to frontend SSE:
    //   text-delta → { type: 'token', token: ... }
    //   tool-call  → { type: 'tool_call', agent, tool, args }
    //   tool-result → { type: 'tool_result', agent, tool, result }
    yield mapEvent(event)
  }
}
```

### SSE Stream Format

The `GET /documents/:id/stream` endpoint relays Hermes events:

```
event: agent_status
data: {"agent":"Planner","status":"thinking"}

event: token
data: {"token":"## Project Overview\n\nThe system..."}

event: tool_call
data: {"agent":"Planner","tool":"save_outline","args":{"documentId":"...","outline":{...}}}

event: tool_result
data: {"agent":"Planner","tool":"save_outline","result":{"ok":true}}

event: section_complete
data: {"section_id":"...","title":"Project Overview"}

event: agent_status
data: {"agent":"Writer","status":"writing"}

event: done
data: {"document_id":"..."}
```

## BYOK Implementation

1. User enters API key in Settings page → `POST /admin/api-keys` (future)
2. Backend encrypts key with Fernet (symmetric key from `ENCRYPTION_KEY` env var)
3. Stored in `api_keys` table — `{ user_id, provider, encrypted_key }`
4. On agent dispatch, backend:
   a. Looks up user's key for the configured provider
   b. Decrypts in memory
   c. Creates provider instance with the key
   d. Runs tool-calling loop
   e. Key never logged, never returned to frontend, garbage collected

## Deployment (Docker Compose)

```yaml
services:
  frontend:
    build: .
    ports: ["3000:80"]
    depends_on: [backend]

  backend:
    build: backend/
    ports: ["3001:3001"]
    environment:
      - DATABASE_URL=postgres://repora:repora@db:5432/repora
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - LLAMA_CPP_URL=http://llama-server:8080/v1
    depends_on: [db]

  db:
    image: postgres:17
    environment:
      - POSTGRES_USER=repora
      - POSTGRES_PASSWORD=repora
      - POSTGRES_DB=repora
    volumes: [pgdata:/var/lib/postgresql/data]

  llama-server:
    image: ghcr.io/ggml-org/llama.cpp:server
    volumes: [./models:/models]
    command: ["--model", "/models/model.gguf", "--port", "8080", "--host", "0.0.0.0"]
```

## Implementation Scope (Phase 1)

1. Initialize `backend/` with package.json, tsconfig, Express bootstrap
2. Drizzle schema + first migration for all 11 tables
3. JWT auth middleware + auth routes
4. Projects CRUD routes
5. Documents routes (get, stream SSE placeholder)
6. Admin routes (agents list/patch, metrics, logs)
7. Diagram routes (CRUD)
8. Export routes (PDF/DOCX placeholder)
9. Validation routes (secure token + decision)
10. Health check route
11. Hermes orchestrator with agent registry (mock agents initially streaming real SSE)
12. BYOK provider abstraction layer
13. Dockerfile for backend
14. Wire all frontend pages to real backend data
