# Repora Web

Repora is a free, self-hostable AI-native document platform. A team of specialized agents collaboratively produces structured, professional specification documents — with UML diagrams, requirement tables, and a review pass — inside a block-based collaborative editor.

## Architecture

```
Frontend (React PWA)  ──►  Backend (Express + Drizzle ORM)  ──►  PostgreSQL 17
                                    │
                                    │  Vercel AI SDK
                                    ▼
                          Ollama (llama.cpp-compatible)
                          + BYOK cloud models (OpenAI, Anthropic, etc.)
```

- **Frontend**: React 19 PWA (Vite 5 + TypeScript) — served via nginx in Docker
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL + JWT auth + Vercel AI SDK
- **AI Inference**: Ollama for local models by default; BYOK support for cloud providers (OpenAI, Anthropic, Google, OpenRouter)
- **Agent Pipeline**: Hermes (orchestrator) → Planner → Writer → UML → Tables → Reviewer
- **Editor**: BlockNote-based block editor with real-time Yjs collaboration (WebSocket)
- **Database**: PostgreSQL 17 with 12 tables (users, projects, requirements, documents, sections, diagrams, comments, validations, templates, agent_configs, api_keys, audit_logs)

## Tech Stack

### Frontend
- Vite 5 + React 19 + TypeScript
- shadcn v4 (`@base-ui/react`, OKLCH colors, `tw-animate-css`)
- Tailwind CSS 3 (custom design tokens: `primary`, `surface`, `ai-vibrant`, `status-final`, etc.)
- TanStack Router + TanStack Query + TanStack Table
- Zustand 5 (persist middleware) + Zod 4
- BlockNote editor + Yjs (real-time collaboration)
- class-variance-authority + clsx + tailwind-merge
- Material Symbols icons (`material-symbols-outlined`)
- Fonts: Inter (body), Geist (headings), JetBrains Mono (labels/agent metadata)
- PWA: `manifest.json`, service worker (`sw.js`)

### Backend
- Express 5 + TypeScript
- Drizzle ORM + PostgreSQL 17
- Vercel AI SDK (provider-agnostic: Ollama, OpenAI, Anthropic, Google)
- JWT authentication + bcryptjs
- WebSocket (ws + y-websocket for real-time collaboration)
- PDF export (pdf-lib) + DOCX export (docx)
- PlantUML diagram rendering

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for containerized deployment)
- Ollama (for local AI inference, optional — BYOK cloud models work independently)

## Quick Start

### Docker Compose (recommended)

```bash
docker compose up
```

Services:
- **frontend**: nginx serving React PWA at `http://localhost:3000`
- **backend**: Express API at `http://localhost:8001` (auto-runs migrations + seed on startup)
- **db**: PostgreSQL 17 at `localhost:5433`

> The backend automatically runs database migrations and seeds demo data on first startup. The seed is idempotent — safe to re-run.

**Demo accounts** (available after seed):

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@repora.dev | admin123 |
| Redacteur | jean@exemple.com | test123 |
| Redacteur | marie@exemple.com | test123 |
| Validateur | client@exemple.com | client123 |
| Admin | sarah@repora.dev | test123 |

### Development Mode

```bash
# Backend
cd backend
npm install
npm run db:generate   # generate migrations from schema
npm run db:migrate    # apply migrations to local PostgreSQL
npm run db:seed       # seed demo data (French)
npm run dev           # Express at http://localhost:8000

# Frontend (from root)
npm install
npm run dev           # Vite at http://localhost:5173
```

Set `VITE_API_BASE=http://localhost:8000` in `.env` for the frontend to connect to the local backend.

## Seed Command

```bash
cd backend
npm run db:seed
```

Seeds all 12 tables with comprehensive French-language demo data:
- 6 users (super_admin, admin, 2 redacteurs, 2 validateurs)
- 5 projects with realistic French briefs
- 7 documents, 22 sections with realistic content
- 4 diagrams (PlantUML), 6 comments, 9 requirements
- 3 validations (pending, approved, rejected)
- 7 templates, 6 agent configs, 2 API keys, 30 audit log entries

Uses `ON CONFLICT DO NOTHING` — safe to re-run.

## Test Commands

```bash
# Backend
cd backend
npm test              # vitest run

# Frontend
npm test              # vitest run
npm run build         # production build check
```

## Pages (14)

All pages are React `.tsx` components in `src/pages/`, routed via TanStack Router in `src/router.tsx`.

| Path | Page | Description |
|------|------|-------------|
| `/` or `/workspace` | WorkspaceDashboard | Project overview and activity feed |
| `/library` | DocumentLibrary | Document listing, search, and filtering |
| `/templates` | TemplateGallery | Template browser and selection |
| `/agents` | AgentWorkshop | Agent configuration and status |
| `/editor` | Editor | BlockNote collaborative editor |
| `/analytics` | Analytics | Project metrics and usage statistics |
| `/collaboration` | CollaborationHub | Real-time collaboration presence |
| `/export` | ExportPreview | PDF/DOCX export preview |
| `/settings` | Settings | User and workspace preferences |
| `/infrastructure` | Infrastructure | Model provider and system config |
| `/sharing` | Sharing | Document sharing and permissions |
| `/history` | VersionHistory | Document version timeline |
| `/login` | LoginPage | Authentication |
| `/signup` | SignupPage | Account registration |

Public routes: `/login`, `/signup`, `/validate/$token` (Validator Portal)

## Project Structure

```
repora-web/
├── src/                           # Frontend React application
│   ├── main.tsx                   # React entry, RouterProvider
│   ├── router.tsx                 # TanStack Router route tree (14 pages)
│   ├── index.css                  # Tailwind base + custom animations + design tokens
│   ├── App.tsx                    # Root application component
│   ├── stores/                    # Zustand stores (OOP class-based)
│   │   └── index.ts              # WorkspaceStore, AuthStore, SettingsStore
│   ├── schemas/                   # Zod schemas + inferred types + OOP interfaces
│   │   └── index.ts              # Document, User, Settings, Template, Metrics schemas
│   ├── hooks/                     # TanStack Query hooks
│   │   └── useQueries.ts         # useDocuments, useAnalytics, useTemplates, useCollaborators
│   ├── layout/                    # Layout components
│   │   ├── Sidebar.tsx           # 280px fixed left sidebar
│   │   └── TopBar.tsx            # Top navigation bar
│   ├── components/
│   │   ├── Icon.tsx              # Material Symbols wrapper
│   │   ├── StatusBadge.tsx       # cva-based status chip
│   │   ├── AgentStatus.tsx       # agent state chip
│   │   └── ui/                   # shadcn v4 components (Button, Card, Badge, Table, ...)
│   └── pages/                     # 14 route pages
│       ├── WorkspaceDashboard.tsx
│       ├── DocumentLibrary.tsx
│       ├── TemplateGallery.tsx
│       ├── AgentWorkshop.tsx
│       ├── Editor.tsx
│       ├── Analytics.tsx
│       ├── CollaborationHub.tsx
│       ├── ExportPreview.tsx
│       ├── Settings.tsx
│       ├── Infrastructure.tsx
│       ├── Sharing.tsx
│       ├── VersionHistory.tsx
│       ├── LoginPage.tsx
│       ├── SignupPage.tsx
│       └── ValidatePortal.tsx
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # service worker
│   └── icons/                    # SVG app icons
├── backend/                       # Express backend application
│   ├── Dockerfile                # Multi-stage Node 22 Alpine
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts         # Drizzle ORM configuration
│   └── src/
│       ├── index.ts              # Express server entry point
│       ├── config.ts             # Environment configuration
│       ├── db/
│       │   ├── index.ts          # Drizzle client + Postgres.js
│       │   ├── schema.ts         # 12 table definitions
│       │   ├── seed.ts           # Demo data seeder
│       │   └── migrations/       # SQL migration files (Drizzle Kit)
│       ├── routes/               # Express route handlers
│       ├── middleware/            # Auth, error handling middleware
│       ├── services/              # Business logic + AI orchestration
│       └── controllers/          # Request/response handlers
├── docker-compose.yml            # Multi-service orchestration
├── Dockerfile                    # Frontend multi-stage build (nginx)
├── nginx.conf                    # SPA fallback + /api proxy
└── tailwind.config.js            # Design tokens and theme
```

## Design System

All colors, spacing, and typography are defined in `tailwind.config.js` under `theme.extend`. Key tokens:

- **Colors**: `primary` (#000), `primary-container` (#131b2e), `surface` (#fcf8fa), `surface-studio` (#F8FAFC), `secondary`/`ai-vibrant` (#0058be/#2563EB), `status-final` (#10B981 emerald), `status-review` (#F59E0B amber), `status-draft` (#94A3B8 gray), `outline-variant` (#c6c6cd)
- **Spacing**: `gutter` (24px), `sidebar-width` (280px), `inspector-width` (320px), `margin-desktop` (32px)
- **Typography**: `font-headline-lg/md` (Geist), `font-body-lg/md/sm` (Inter), `font-label-md/sm` (JetBrains Mono)
- **Shape**: buttons/inputs/chips `rounded` (4px); panels/cards `rounded-xl` (8px)

## Agent Pipeline

Hermes (Orchestrator) receives user intent and dispatches work across specialized sub-agents:

1. **Planner** — Transforms raw project brief into structured document outline
2. **Writer** — Drafts prose content per section (respects tone, cites requirements)
3. **UML** — Generates PlantUML diagrams (sequence, deployment, activity, class)
4. **Tables** — Produces structured requirement matrices and comparison tables
5. **Reviewer** — Quality control: consistency, contradiction detection, completeness

Each agent is configured independently (model provider, temperature, token budget) via the AgentWorkshop page. All agents use the Vercel AI SDK for provider-agnostic tool calling.

## BYOK Cloud Support

While Ollama is the default local inference provider, Repora supports Bring Your Own Key for cloud models:

- OpenAI (GPT-4o, GPT-4o-mini, etc.)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
- Google (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)
- Any OpenAI-compatible endpoint (Groq, OpenRouter, etc.)

API keys are encrypted at rest and configurable per-agent via the Infrastructure page.

## Conventions

- **Stores**: class-based Zustand (OOP pattern) in `src/stores/`
- **Schemas**: Zod + `z.infer` types + OOP interfaces in `src/schemas/`
- **Hooks**: TanStack Query with MockAdapter class (swap MockAdapter for real API client)
- **Pages**: `.tsx` with typed interfaces, connected to stores/hooks, use shadcn primitives (`Button`, `Card`, `Badge`, `Table`, `Input`, `Select`)
- **Icons**: `<Icon name="..." />` (Material Symbols, NOT lucide-react)
- **Status badges**: `<StatusBadge status={'draft'|'review'|'final'|'active'|'autonomous'}>`
- **Links**: `<Link to="/path">` from `@tanstack/react-router`

## PWA

- `manifest.json` — name, description, standalone display, theme color
- `sw.js` — cache-first static asset precache
- Open Graph + Twitter Card meta tags in `index.html`

## Docker

```bash
docker compose up
```

Frontend at `http://localhost:3000`, backend at `http://localhost:8001`.

### Services

| Service | Image | Port |
|---------|-------|------|
| frontend | Node 22 build → nginx:alpine | 3000:80 |
| backend | Node 22 Alpine (tsx) | 8001:8000 |
| db | postgres:17 | 5433:5432 |

Ollama is accessed via `host.docker.internal:11434` for local inference.

## Contributing

1. Create a feature branch from `main`.
2. Follow conventions (stores/schemas/hooks separation, shadcn primitives, OOP types).
3. Run `npm run build` before pushing.
4. Open a PR.
