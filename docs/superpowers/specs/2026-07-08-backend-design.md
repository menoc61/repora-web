# Repora Backend — Implementation Design

> Status: DESIGN (pending approval)
> Date: 2026-07-08
> Scope: Full Hermes multi-agent backend per `AGENTS.md` + professional READMEs for backend and frontend.

## 1. Context

`repora-web/` is a Vite + React + TypeScript PWA (shadcn v4, TanStack Router/Query, Zustand, Zod) implementing the 12-screen Repora UI. The frontend currently uses a mock adapter for data. We are adding a real backend so the app is end-to-end functional.

The backend follows `AGENTS.md` (the authoritative product spec): a Flask + Python API powering a multi-agent document-orchestration platform ("Hermes") with local llama.cpp inference by default and BYOK cloud models opt-in.

## 2. Repository Layout

Single repo, two stacks, each with its own Dockerfile:

```
repora-web/            # existing React PWA (gets its own Dockerfile)
backend/               # NEW Flask + Python API (gets its own Dockerfile)
docker-compose.yml     # wires frontend + backend + postgres:17 + llama-server
docs/                  # existing specs + new READMEs live alongside
```

Each of `repora-web/` and `backend/` has a standalone `Dockerfile`. `docker-compose.yml` at the repo root orchestrates all four services.

## 3. Backend Architecture (3-tier + agent layer)

```
Presentation  ── REST + SSE/WebSocket ──►  Flask app (app/main.py, blueprints in app/routes)
Application    ── Auth/RBAC, Services, Hermes Orchestrator + Agent Registry,
                 Provider Abstraction (local llama.cpp + BYOK), PlantUML, Export
Data           ── PostgreSQL (SQLAlchemy 2.0 async + Alembic)
Sidecar        ── llama-server (OpenAI-compatible HTTP, reachable only from backend)
```

### 3.1 Folder structure (`backend/`)

```
backend/
├── app/
│   ├── main.py                 # app factory, CORS, blueprint + SSE registration
│   ├── config.py               # pydantic-settings (DATABASE_URL, JWT_SECRET, LLAMA_BASE_URL, ...)
│   ├── db/
│   │   ├── base.py             # async engine, session factory, Base
│   │   ├── models.py           # User, Project, Document, Section, Diagram, Comment,
│   │   │                       #   Validation, AgentConfig, ApiKey, AuditLog
│   │   └── session.py          # FastAPI/Flask request-scoped async session dep
│   ├── schemas/                # pydantic v2 request/response models
│   ├── auth/
│   │   ├── jwt.py              # token encode/decode
│   │   ├── password.py         # argon2/bcrypt hash
│   │   └── rbac.py             # role decorator + permission guards
│   ├── agents/
│   │   ├── hermes.py           # Orchestrator: intent parse -> task graph -> dispatch -> merge
│   │   ├── registry.py         # JSON agent registry (name, tools, system prompt, provider tier)
│   │   ├── loop.py             # generic tool-calling loop (OpenAI-compatible tools/tool_calls)
│   │   ├── providers/
│   │   │   ├── base.py         # ModelProvider protocol: stream_chat(messages, tools, cfg)
│   │   │   ├── llamacpp.py     # LlamaCppProvider -> llama-server OpenAI-compatible endpoint
│   │   │   └── byok.py         # BYOKProvider (OpenAI/Anthropic/Google/Groq/OpenRouter)
│   │   └── tools/              # generate_plantuml, render_diagram, save_section,
│   │                           #   get_document_state, get_project_context, list_agents, ...
│   ├── services/               # document.py, project.py, export.py, validation.py, plantuml.py
│   ├── routes/                 # auth.py, users.py, projects.py, documents.py, diagrams.py,
│   │   │                       #   validation.py, export.py, admin.py, metrics.py
│   └── streaming/              # SSE hub broadcasting agent status (Idle/Thinking/Writing)
│   └── errors.py               # unified error envelope
├── migrations/                 # Alembic env + versions
├── tests/                      # pytest: auth, documents, agents(loop), export
├── pyproject.toml              # deps + tool config (uv or pip)
├── requirements.txt            # pinned deps
├── Dockerfile
├── .env.example
└── README.md
```

### 3.2 Data model (SQLAlchemy 2.0 async)

`User` (id, name, email, password_hash, role), `Project` (id, owner_id, name, brief, status, created_at), `Requirement` (id, project_id, type, text, source_actor), `Document` (id, project_id, status, outline JSON), `Section` (id, document_id, order, title, content, status, generated_by_agent, model_used), `Diagram` (id, project_id, type, plantuml_source, rendered_url), `Comment` (id, section_id, author_id, text, resolved), `Validation` (id, document_id, validator_token, decision, section_reasons JSON, decided_at), `AgentConfig` (id, agent_name, provider, model_id, temperature, top_p, max_tokens, enabled), `ApiKey` (id, user_id, provider, encrypted_key), `AuditLog` (id, user_id, action, target, timestamp).

### 3.3 API surface (AGENTS.md §9)

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users (admin) | `GET/POST/PATCH/DELETE /admin/users` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id` |
| Generation | `POST /projects/:id/generate` (dispatches Hermes), `GET /documents/:id`, `GET /documents/:id/stream` (SSE) |
| Diagrams | `POST /projects/:id/diagrams`, `GET /diagrams/:id`, `POST /diagrams/:id/export` |
| Validation | `GET /validate/:token` (public read-only), `POST /validate/:token/decision` |
| Export | `GET /documents/:id/export?format=pdf|docx` |
| Admin | `GET/PATCH /admin/agents`, `GET/POST/DELETE /admin/api-keys` |
| Metrics | `GET /admin/metrics`, `GET /admin/logs` |

### 3.4 Hermes Orchestrator

- `Orchestrator` receives intent → builds a task graph of agent steps → dispatches registered agents in order → merges results → retries/fallbacks.
- `Agent` is declared in `registry.py` as JSON (name, description, tool list, system prompt, allowed model tier) so Super Admin can reconfigure without code changes.
- `loop.py` is the shared tool-calling loop: sends `tools`/`tool_calls` (OpenAI-compatible), intercepts backend-side functions, returns `tool` messages, repeats until a final content message.
- Streaming: agent status (Idle/Thinking/Writing) + token chunks pushed over SSE to the `streaming/` hub; frontend's AgentStatus chips consume it.
- Provider-agnostic: `LlamaCppProvider` (default, local `llama-server`) and `BYOKProvider` both implement `ModelProvider.stream_chat`. Config surface: temperature, top_p, presence penalty, per-agent max tokens, enable/disable, per-agent provider pin.

### 3.5 LLM provider integration

- `LlamaCppProvider` is a **real HTTP client** to `llama-server` (`http://localhost:8080/v1`, OpenAI-compatible, `stream: true`).
- `BYOKProvider` is a generic streaming client for any OpenAI-compatible or provider-native endpoint.
- If `llama-server` is not running, endpoints return a clear "model unavailable" error rather than crashing.

## 4. Containerization

- `backend/Dockerfile` — Python 3.12-slim, installs requirements, runs `alembic upgrade head` then `gunicorn` (or `uvicorn`) with the Flask app.
- `repora-web/Dockerfile` — multi-stage Node build → static served by `nginx:alpine`.
- `docker-compose.yml` — services: `frontend`, `backend`, `db` (postgres:17), `llama-server` (local GGUF sidecar, `8080`). Frontend proxies `/api` → backend; backend reaches `db` and `llama-server` on the internal network only.

## 5. READMEs (deliverable)

- **`backend/README.md`** — professional: overview, architecture diagram (text), tech stack, prerequisites, local setup (`uv`/venv + Postgres + optional llama-server), environment variables table, Alembic migrations, full API reference (per endpoint: method, path, auth, body, response), agent registry & how to add an agent, provider configuration (local vs BYOK), streaming/SSE notes, testing, Docker, project layout.
- **`repora-web/README.md`** — professional: product overview, tech stack, prerequisites, scripts (`dev`/`build`/`preview`), project structure, design system tokens, how to point the app at the backend (env `VITE_API_BASE`), PWA notes, routing, stores/schemas/hooks conventions, contributing.

## 6. Build plan (waves, verified as we go)

1. Scaffold `backend/` (pyproject, config, db engine, app factory, health route) → `flask --app app.main run` boots.
2. Models + Alembic + seed.
3. Auth (JWT, password, RBAC) + `/auth/*` + `/admin/users`.
4. Projects + Documents CRUD + `/projects/:id/generate` (enqueue Hermes).
5. Hermes orchestrator + registry + tool loop + providers (llamacpp real client, byok stub).
6. Streaming (SSE) hub wired to orchestrator.
7. Diagrams (PlantUML) + Export (PDF/DOCX) + Validation portal.
8. Admin (agents/api-keys) + Metrics/audit.
9. Dockerfiles + docker-compose + `.env.example`.
10. Tests (pytest smoke for auth, documents, agent loop).
11. Write `backend/README.md` and `repora-web/README.md`.

Each wave is verified (imports/pytest/`flask run`) before the next.

## 7. Out of scope (v1)

- Real BlockNote collaborative block editor wiring (frontend already mocks it).
- Production auth provider integrations beyond JWT + local Okta config display.
- Kubernetes/managed-cloud deployment manifests (Docker Compose only).
