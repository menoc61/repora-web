# External Integrations

**Analysis Date:** 2026-07-13

## APIs & External Services

### AI / LLM Providers

The backend supports six provider types through a unified abstraction layer (`backend/src/ai/providers/interface.ts`). All providers are accessed via the Vercel AI SDK (`ai` v7.0.0) with OpenAI-compatible tool-calling protocol.

| Provider | SDK/Client | Purpose | Config |
|----------|-----------|---------|--------|
| **Ollama** | `@ai-sdk/openai-compatible` | Default local inference provider | `OLLAMA_URL` (default `http://localhost:11434/v1`), `OLLAMA_MODEL` (default `qwen2.5-coder:latest`) |
| **llama.cpp** | `@ai-sdk/openai-compatible` | Local inference via `llama-server` | `LLAMA_CPP_URL` (default `http://localhost:8080/v1`) |
| **OpenAI** | `@ai-sdk/openai` v3 | Cloud GPT models | API key stored encrypted in `api_keys` table |
| **Anthropic** | `@ai-sdk/anthropic` v3 | Claude models (native SDK with tool calling, extended thinking, prompt caching) | API key stored encrypted in `api_keys` table |
| **Google Gemini** | `@ai-sdk/google` v3 | Gemini models (native SDK with grounding, code execution, file search) | API key stored encrypted in `api_keys` table |
| **OpenRouter** | `@ai-sdk/openai-compatible` | Multi-model gateway | `OPENROUTER_API_KEY` env var, `OPENROUTER_URL` (default `https://openrouter.ai/api/v1`) |
| **BYOK** | `@ai-sdk/openai-compatible` | Any OpenAI-compatible endpoint | `BYOK_BASE_URL` env var, API key stored encrypted |

**Tool-calling detection:**
- Runtime probe at startup (`backend/src/ai/hermes.ts` `probeToolSupport()`) sends a minimal request with a dummy tool and caches result per model
- Fallback name-based heuristic (`knownToolCallers` array in `interface.ts`) for unprobed models
- If tool-calling fails during generation, agent transparently retries without tools
- For non-local providers (OpenAI/Anthropic/Gemini/OpenRouter), tool-calling is assumed based on model name pattern

**Agent registry** (`backend/src/ai/agents/registry.ts`):
Six agents: Hermes (orchestrator), Planner, Writer, UML, Tables, Reviewer
Each agent has a configurable provider, model, temperature, top-p, and max tokens via the `agent_configs` DB table

### Diagram Rendering

**PlantUML Server:**
- Used for: Rendering UML diagrams (use case, sequence, activity, class, deployment) to SVG and PNG
- Endpoint: `PLANTUML_SERVER_URL` (default `https://www.plantuml.com/plantuml`)
- Protocol: HTTP GET with deflate-encoded PlantUML source in URL path
- Fallback: PNGs are fetched and stored locally in `uploads/diagrams/` (`backend/src/services/diagram.service.ts`)
- Diagram generation: LLM generates PlantUML source from project context, then encoded and rendered via PlantUML server

### S3-Compatible Object Storage

**MinIO (local) / S3-compatible service:**
- Used for: Storing exported documents (PDF/DOCX/MD) for persistence and retrieval
- SDK: `@aws-sdk/client-s3` v3.700.0
- Operations: HeadBucket, CreateBucket, PutObject, GetObject
- Config: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`
- Docker: MinIO service in `docker-compose.yml` on ports 9000 (API) and 9001 (console)
- Implementation: `backend/src/services/s3.service.ts`
- Fallback: S3 failures are non-fatal — exports still stream to client even if S3 storage fails

## Data Storage

**Databases:**
- **PostgreSQL 17** — Primary data store
  - Connection: `DATABASE_URL` env var (format: `postgres://user:password@host:port/database`)
  - Client: `postgres` v3.4.0 (lightweight PostgreSQL driver)
  - ORM: Drizzle ORM 0.43.0 with full TypeScript schema (`backend/src/db/schema.ts`)
  - Migrations: Drizzle Kit (`drizzle-kit push` at startup, migration files in `backend/src/db/migrations/`)
  - Tables: `users`, `projects`, `requirements`, `documents`, `sections`, `diagrams`, `comments`, `validations`, `templates`, `agent_configs`, `api_keys`, `audit_logs`, `assistant_sessions`
  - Docker: PostgreSQL 17 service in `docker-compose.yml`, port 5434, with healthcheck via `pg_isready`

**File Storage:**
- Local filesystem for diagram PNGs (`uploads/diagrams/`)
- S3/MinIO for exported documents
- Static uploads served via Express `/uploads` static middleware

**Caching:**
- None detected — no Redis, Memcached, or in-memory cache layer

## Authentication & Identity

**Auth Provider:**
- **Custom JWT-based** — No third-party OAuth/OIDC provider
- Implementation: `backend/src/services/auth.service.ts`
- Registration: `POST /auth/login` and `POST /auth/register` endpoints
- Password hashing: bcryptjs with 12 salt rounds
- Token: JSON Web Token with userId and role in payload, configurable expiration (default 7 days)
- Secret: `JWT_SECRET` env var (default `dev-secret-change-in-production`)
- Roles: `redacteur`, `validateur`, `admin`, `super_admin`
- Middleware: `requireAuth()` and `requireRole(...)` in `backend/src/middleware/auth.ts`

**Frontend Auth:**
- Token stored in `localStorage` via Zustand persist middleware (key: `repora-auth`)
- Auth state managed by `useAuthStore` in `src/stores/index.ts`
- API client attaches `Authorization: Bearer <token>` header automatically
- Public routes: `/login`, `/signup`, `/validate/:token`

**API Key Encryption:**
- BYOK API keys encrypted at rest using AES-256-GCM (`backend/src/utils/crypto.ts`)
- Encryption key: `ENCRYPTION_KEY` env var (32-char hex)

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, DataDog, or similar service
- Process-level unhandled rejection/exception handlers log to console and swallow errors (graceful degradation)

**Logging:**
- `console.log` / `console.warn` — No structured logging library (no Winston, Pino, etc.)
- Logs written to stdout/stderr (captured by Docker)

**Metrics:**
- None detected — no Prometheus, OpenTelemetry, or custom metrics endpoints
- Health check endpoint: `GET /healthz` returns `{ status: 'ok' }`

## CI/CD & Deployment

**Hosting:**
- Docker Compose deployment (production-ready, one-command startup: `docker compose up`)
- Frontend: nginx:alpine on port 3000
- Backend: node:22-alpine on port 8001 (internal port 8000)
- Database: PostgreSQL 17
- Storage: MinIO

**CI Pipeline:**
- Not detected — no GitHub Actions, GitLab CI, or Jenkins configuration in repository

**Docker Configuration:**
- `Dockerfile` — Multi-stage frontend build (node:22-alpine deps → builder → nginx:alpine runtime)
- `backend/Dockerfile` — Multi-stage backend build (node:22-alpine deps → builder → runner, with `docker-entrypoint.sh`)
- `docker-compose.yml` — 4 services: frontend, backend, db, minio
- `docker-entrypoint.sh` — Waits for DB, runs migrations (`drizzle-kit push`), runs seed, starts server
- `.dockerignore` and `backend/.dockerignore` present

## Environment Configuration

**Required env vars (production):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Strong random secret for JWT signing
- `ENCRYPTION_KEY` — 32-character hex string for AES-256-GCM
- `OLLAMA_HOST` — Host address for Ollama (default: `host.docker.internal`)

**Optional env vars:**
- `OLLAMA_MODEL` — Override default Ollama model
- `LLAMA_CPP_URL` — llama.cpp server URL
- `PLANTUML_SERVER_URL` — Custom PlantUML server
- `BYOK_BASE_URL` — Custom OpenAI-compatible endpoint
- `OPENROUTER_API_KEY` + `OPENROUTER_URL` — OpenRouter configuration
- `CORS_ORIGIN` — CORS allowed origin
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` — S3/MinIO
- `PORT` — Backend port
- `VITE_API_BASE` — Frontend API base path (default `/api`)

**Secrets location:**
- `.env` files in root and `backend/` (gitignored)
- `docker-compose.yml` references `${JWT_SECRET}` and `${ENCRYPTION_KEY}` variables (fall back to defaults if unset)
- `.env.example` documents which variables are needed

## Webhooks & Callbacks

**Incoming:**
- None detected — no external webhook endpoints

**Outgoing:**
- None detected — no webhook dispatches to external services

## Real-Time Connections

**WebSocket Endpoints:**
- `/notifications` — Real-time notification broadcast (no auth required at WS level)
- `/collab/:docName` — Yjs collaboration sync protocol (JWT auth via query param `?token=`)
- Both served from the same `WebSocketServer` in `backend/src/collaboration/ws.ts`
- Frontend proxies: `/notifications` and `/collab` with WebSocket upgrade in `vite.config.js` and `nginx.conf`

## External Service Dependencies Summary

| Service | Required | Production Default | Purpose |
|---------|----------|-------------------|---------|
| PostgreSQL | ✅ Yes | Docker Compose service | All persistent data |
| MinIO/S3 | ✅ Yes (graceful fallback) | Docker Compose service | Export document storage |
| Ollama / llama.cpp | ⚠️ Optional (local AI) | External host | Default AI inference provider |
| PlantUML Server | ⚠️ Optional (diagrams) | `plantuml.com` (public) | UML diagram rendering |
| OpenAI API | ⚠️ Optional (BYOK) | N/A | Cloud GPT models |
| Anthropic API | ⚠️ Optional (BYOK) | N/A | Claude models |
| Google Gemini API | ⚠️ Optional (BYOK) | N/A | Gemini models |
| OpenRouter | ⚠️ Optional (BYOK) | N/A | Multi-model gateway |

---

*Integration audit: 2026-07-13*
