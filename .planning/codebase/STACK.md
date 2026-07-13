# Technology Stack

**Analysis Date:** 2026-07-13

## Languages

**Primary:**
- TypeScript 5.9.3 — Both frontend (`src/`) and backend (`backend/src/`) are fully TypeScript
- CSS — Tailwind CSS with custom design tokens (`src/index.css`, `tailwind.config.js`)

**Secondary:**
- JavaScript (ESM) — Vite config, PostCSS config, some build tooling
- SQL — PostgreSQL schema via Drizzle ORM (`backend/src/db/schema.ts`)

## Runtime

**Environment:**
- Node.js 22 (Alpine in Docker) — Backend runtime, image `node:22-alpine` in both `Dockerfile` and `backend/Dockerfile`
- Nginx (Alpine) — Frontend static serving in production (`Dockerfile`, `nginx.conf`)

**Package Manager:**
- npm — Both root and backend use npm with `package-lock.json` lockfiles
- Lockfile: present (`package-lock.json` in both root and backend)

**Dev Runner:**
- `tsx` — TypeScript execution for development (`tsx watch src/index.ts`) and for running seed/migration scripts in Docker (`npx tsx dist/db/seed.js`)
- `vite` — Dev server with HMR for frontend

## Frameworks

**Core Frontend:**
- React 19.2.7 — UI library, with `react-dom` 19.2.7
- Vite 5.4.21 — Build tool and dev server, configured with `@vitejs/plugin-react`
- @tanstack/react-router 1.170.17 — Type-safe client-side routing (`src/router.tsx`)
- @tanstack/react-query 5.101.2 — Server state management and data fetching
- @tanstack/react-form 1.33.0 — Form state management
- @tanstack/react-table 8.21.3 — Table data display

**Core Backend:**
- Express 5.1.0 — HTTP server framework (`backend/src/index.ts`)
- Vercel AI SDK (`ai` v7.0.0) — LLM streaming and tool-calling abstraction
- Drizzle ORM 0.43.0 — Type-safe SQL query builder with PostgreSQL dialect
- Drizzle Kit 0.30.0 — Migration generation and push

**Editor:**
- BlockNote 0.51.4 — Rich block editor (wraps TipTap/ProseMirror)
- TipTap 3.27.3 — Underlying editor engine with ~20 extensions (collaboration, tables, links, code blocks, highlights, etc.)
- Yjs 13.6.31 — CRDT-based real-time collaboration
- y-websocket 3.0.0 — WebSocket transport for Yjs sync

**Real-Time:**
- ws 8.21.0 — WebSocket server for collaboration and notifications
- y-websocket 3.0.0 — Yjs sync protocol over WebSocket

**State Management:**
- Zustand 5.0.14 — Client-side state management (`src/stores/index.ts`) with persistence middleware

**Validation:**
- Zod 4.4.3 — Schema validation (used in both frontend schemas and backend AI tool definitions)

**Testing:**
- Vitest 3.x — Test runner (both frontend and backend)
- @testing-library/react 16.3.0 + @testing-library/jest-dom 6.6.3 — Frontend component testing
- jsdom 26.1.0 — DOM environment for frontend tests
- supertest 7.0.0 — HTTP integration testing for backend

## Key Dependencies

### Frontend (`package.json`)

**Critical:**
- `@blocknote/core` `@blocknote/mantine` `@blocknote/react` v0.51.4 — Core editor engine powering document authoring
- `@tanstack/react-router` v1.170.17 — All page routing and navigation
- `@tanstack/react-query` v5.101.2 — Data fetching and cache management
- `zustand` v5.0.14 — Workspace, auth, and settings state stores

**UI & Design:**
- `@base-ui/react` v1.6.0 — Low-level UI primitives (from the Base UI project)
- `lucide-react` v1.23.0 — Icon library
- `class-variance-authority` v0.7.1 — Component variant management
- `tailwind-merge` v3.6.0 — Tailwind class conflict resolution
- `clsx` v2.1.1 — Conditional classname construction
- `tw-animate-css` v1.4.0 — Tailwind-compatible animation utilities

**Typography:**
- `@fontsource-variable/geist` v5.2.9 — Geist variable font for headings
- Inter via CDN (defined in `tailwind.config.js` `fontFamily.body`)
- JetBrains Mono via CDN (defined in `tailwind.config.js` `fontFamily.label`)

**Utilities:**
- `date-fns` v4.4.0 — Date formatting
- `highlight.js` v11.11.1 + `lowlight` v3.3.0 — Syntax highlighting for code blocks in editor
- `react-markdown` v10.1.0 + `remark-gfm` v4.0.1 — Markdown rendering
- `tiptap-markdown` v0.9.0 — Markdown serialization/deserialization for TipTap

### Backend (`backend/package.json`)

**Critical:**
- `ai` v7.0.0 — Vercel AI SDK core: streaming text, tool calling, agent loops
- `@ai-sdk/openai` v3.0.0 — OpenAI provider (GPT-4, GPT-4o, o1, o3, o4)
- `@ai-sdk/anthropic` v3.0.0 — Native Anthropic provider (Claude, with full tool-calling, extended thinking, prompt caching)
- `@ai-sdk/google` v3.0.0 — Native Google provider (Gemini, with grounding, code execution, file search)
- `@ai-sdk/openai-compatible` v3.0.0 — Generic OpenAI-compatible provider (llama.cpp, Ollama, OpenRouter, BYOK)
- `drizzle-orm` v0.43.0 + `postgres` v3.4.0 — Database access
- `drizzle-kit` v0.30.0 — Database migrations

**Authentication & Security:**
- `jsonwebtoken` v9.0.0 — JWT token generation and verification
- `bcryptjs` v3.0.0 — Password hashing (12 rounds in `auth.service.ts`)
- Node.js `crypto` — AES-256-GCM encryption for BYOK API keys at rest (`backend/src/utils/crypto.ts`)

**Document Export:**
- `docx` v9.7.1 — Professional DOCX generation with cover pages, tables, headers/footers, diagrams
- `pdfkit` v0.19.1 — PDF generation (fallback when LibreOffice not available)
- `@aws-sdk/client-s3` v3.700.0 — S3 export storage (MinIO-compatible)

**Infrastructure:**
- `cors` v2.8.5 — CORS middleware
- `dotenv` v16.4.0 — Environment variable loading
- `uuid` v11.0.0 — UUID generation

## Configuration

**Environment:**
- `.env` (root) — Frontend Vite settings (`VITE_API_BASE=/api`)
- `backend/.env` — Backend configuration via `dotenv` (`config.ts` reads `process.env`)
- `backend/.env.example` — Documents all required variables

**Key backend configs (`backend/src/config.ts`):**
- `PORT` (default `8000`)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `ENCRYPTION_KEY` — 32-char hex key for AES-256-GCM
- `LLAMA_CPP_URL` — llama.cpp server endpoint (default `http://localhost:8080/v1`)
- `OLLAMA_URL` — Ollama API endpoint (default `http://localhost:11434/v1`)
- `OLLAMA_MODEL` — Default Ollama model (default `qwen2.5-coder:latest`)
- `PLANTUML_SERVER_URL` — PlantUML rendering service (default `https://www.plantuml.com/plantuml`)
- `BYOK_BASE_URL` — Bring Your Own Key base URL
- `CORS_ORIGIN` — Allowed CORS origin (default `http://localhost:5173`)
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` — S3/MinIO config

**Build:**
- `tsconfig.json` — Frontend TypeScript config (target ES2020, module ESNext, bundler resolution)
- `backend/tsconfig.json` — Backend TypeScript config (target ES2022, module ESNext, output to `dist/`)
- `vite.config.js` — Vite config with React plugin, `@/` path alias, proxy rules for `/api`, `/uploads`, `/notifications`, `/collab`
- `tailwind.config.js` — Custom design tokens: colors (43 custom colors), fonts (3 families), spacing, typography scale, animations
- `postcss.config.js` — Tailwind + Autoprefixer
- `components.json` — shadcn/ui configuration (style: `base-nova`, icon library: `lucide`)
- `backend/drizzle.config.ts` — Drizzle Kit config pointing to `src/db/schema.ts` with PostgreSQL dialect
- `backend/vitest.config.ts` — Vitest config for backend (node environment, 30s timeouts)
- `vite.config.js` `test` section — Vitest config for frontend (jsdom environment)

## Platform Requirements

**Development:**
- Node.js 22+
- npm
- PostgreSQL 17 (or Docker for `docker compose`)
- Optional: Ollama with a tool-calling model (e.g., `qwen2.5-coder`, `nemotron-3-super`)
- Optional: llama.cpp server (`llama-server`)
- Ports 5173 (Vite), 8000 (backend), 5434 (PostgreSQL), 9000/9001 (MinIO)

**Production:**
- Docker Compose deployment (one-command startup via `docker compose up`)
- Frontend: nginx-alpine serving static build on port 80
- Backend: node:22-alpine on port 8000
- PostgreSQL 17 as dedicated service
- MinIO for S3-compatible object storage
- Local LLM inference: Ollama or llama.cpp (accessed via `host.docker.internal` or configured host)
- Environment variables set in `docker-compose.yml` (JWT_SECRET, ENCRYPTION_KEY, OLLAMA_HOST, etc.)

---

*Stack analysis: 2026-07-13*
