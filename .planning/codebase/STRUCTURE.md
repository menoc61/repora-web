# Codebase Structure

**Analysis Date:** 2026-07-13

## Directory Layout

```
repora-web/
├── src/                        # Frontend — React SPA (Vite)
│   ├── main.tsx                # Entry point — mounts React app
│   ├── App.jsx                 # Root component (Outlet only)
│   ├── index.css               # Global CSS + Tailwind directives
│   ├── router.tsx              # TanStack Router — 16 routes, auth guards
│   ├── pages/                  # Route-level page components (11 files)
│   │   ├── Editor.tsx          # Main editor (3-pane layout)
│   │   ├── WorkspaceDashboard.tsx
│   │   ├── DocumentLibrary.tsx
│   │   ├── TemplateGallery.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── LoginPage.tsx / SignupPage.tsx
│   │   ├── ValidatePortal.tsx
│   │   ├── Settings.tsx / Infrastructure.tsx
│   │   ├── Sharing.tsx
│   │   ├── VersionHistory.tsx
│   │   ├── ExportPreview.tsx
│   │   └── Assistant.tsx
│   ├── components/             # Reusable UI components
│   │   ├── editor/             # Editor-specific components (9 files)
│   │   │   ├── index.ts        # Barrel exports
│   │   │   ├── EditorCanvas.tsx
│   │   │   ├── EditorHeader.tsx
│   │   │   ├── EditorBubbleMenu.tsx
│   │   │   ├── EditorFormatToolbar.tsx
│   │   │   ├── AiToolbar.tsx
│   │   │   ├── AgentProgressPanel.tsx
│   │   │   ├── AssistantChat.tsx
│   │   │   ├── DiagramPanel.tsx
│   │   │   ├── OutlineTree.tsx
│   │   │   ├── ShareDialog.tsx
│   │   │   └── SlashCommandMenu.tsx
│   │   ├── workspace-dashboard/  # Dashboard components (9 files)
│   │   ├── document-library/     # Library components (7 files)
│   │   ├── template-gallery/     # Template gallery (7 files)
│   │   ├── sharing/              # Sharing components (7 files)
│   │   ├── version-history/      # Version history (6 files)
│   │   ├── onboarding/           # Onboarding wizard (7 files)
│   │   ├── ui/                   # shadcn/ui primitives (13 files)
│   │   │   ├── avatar.tsx, badge.tsx, button.tsx, card.tsx
│   │   │   ├── dialog.tsx, dropdown-menu.tsx, input.tsx
│   │   │   ├── label.tsx, select.tsx, separator.tsx
│   │   │   ├── sheet.tsx, table.tsx, tabs.tsx, tooltip.tsx
│   │   │   └── separator.tsx
│   │   ├── AgentStatus.tsx
│   │   ├── GenerationProgress.tsx
│   │   ├── Icon.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── RequireRole.tsx
│   │   ├── StatusBadge.tsx
│   │   └── Toast.tsx
│   ├── hooks/                  # Custom React hooks (7 files)
│   │   ├── useQueries.ts       # React Query hooks for all API calls
│   │   ├── useAuth.ts
│   │   ├── useAssistantChat.ts
│   │   ├── useCollabStatus.ts
│   │   ├── useGenerationWriter.ts
│   │   ├── useNotificationSocket.ts
│   │   └── useAgentActivityFeed.ts
│   ├── stores/                 # Zustand state stores (3 files)
│   │   ├── index.ts            # Workspace, Auth, Settings stores
│   │   ├── generationStore.ts  # Generation session tracking
│   │   └── notificationStore.ts
│   ├── api/
│   │   └── client.ts           # HTTP client + SSE helper
│   ├── schemas/
│   │   └── index.ts            # Zod schemas + interfaces
│   ├── layout/
│   │   ├── Sidebar.tsx         # Left navigation sidebar
│   │   └── TopBar.tsx
│   ├── lib/
│   │   └── utils.ts            # cn() helper (tailwind-merge + clsx)
│   ├── utils/
│   │   └── ws.ts               # WebSocket connection helper
│   └── test-setup.ts           # Vitest test setup
│
├── backend/                    # Backend — Express.js API
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── config.ts           # Centralized env config
│   │   ├── routes/             # Express route handlers (17 files)
│   │   │   ├── auth.ts, projects.ts, documents.ts
│   │   │   ├── diagrams.ts, requirements.ts, comments.ts
│   │   │   ├── templates.ts, models.ts, agents.ts
│   │   │   ├── admin.ts, ai.ts, assistant.ts
│   │   │   ├── collaboration.ts, export.ts, sharing.ts
│   │   │   ├── infrastructure.ts, validation.ts
│   │   ├── services/           # Business logic layer (16 files + .gitkeep)
│   │   │   ├── auth.service.ts, user.service.ts
│   │   │   ├── project.service.ts, document.service.ts
│   │   │   ├── requirement.service.ts, outine.service.ts
│   │   │   ├── diagram.service.ts, comment.service.ts
│   │   │   ├── template.service.ts, admin.service.ts
│   │   │   ├── assistant.service.ts, audit.service.ts
│   │   │   ├── collaboration.service.ts, s3.service.ts
│   │   │   ├── export.service.ts, exportDocx.ts
│   │   │   ├── docxToPdf.ts, pdfFallback.ts
│   │   ├── ai/                 # AI agent layer
│   │   │   ├── hermes.ts       # Orchestrator runner, event types, model discovery
│   │   │   ├── context.ts      # GenerationContext shared state
│   │   │   ├── agents/         # Agent definitions
│   │   │   │   ├── registry.ts # 5 agents (Planner, Writer, UML, Tables, Reviewer)
│   │   │   │   ├── planner.ts, writer.ts, uml.ts
│   │   │   │   ├── tables.ts, reviewer.ts
│   │   │   ├── tools/          # Agent tool implementations
│   │   │   │   ├── document.ts # getProjectContext, getDocumentContent, writeSection, saveOutline
│   │   │   │   ├── diagram.ts  # saveDiagram
│   │   │   │   ├── review.ts   # flagIssue, suggestFix, approveSection, updateDocumentStatus
│   │   │   │   └── tables.ts   # saveRequirementSection, getRequirements
│   │   │   ├── pipeline/       # Pipeline orchestration
│   │   │   │   ├── orchestrate.ts  # 5-stage pipeline with resume detection
│   │   │   │   ├── negotiate.ts    # Quality evaluation + rescope loop
│   │   │   │   └── fallbackContent.ts
│   │   │   └── providers/      # LLM provider abstraction
│   │   │       └── interface.ts    # 6 provider types + factory
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT auth + role middleware
│   │   │   ├── error.ts        # AppError class + errorHandler
│   │   │   └── validate.ts     # Zod validation middleware
│   │   ├── collaboration/
│   │   │   └── ws.ts           # Yjs WebSocket server + notification broadcast
│   │   ├── db/
│   │   │   ├── index.ts        # Drizzle ORM client
│   │   │   ├── schema.ts       # 13 PostgreSQL table definitions
│   │   │   ├── migrate.ts      # Migration runner
│   │   │   ├── seed.ts         # Demo data seeder
│   │   │   └── migrations/     # SQL migration files (3 files)
│   │   ├── validation/
│   │   │   └── schemas.ts      # Zod schemas for request validation
│   │   ├── utils/
│   │   │   ├── crypto.ts       # Encryption utilities
│   │   │   ├── markdownParser.ts
│   │   │   └── docTemplates.ts
│   │   └── types/
│   │       └── .gitkeep
│   ├── tests/                  # Backend tests (10 files)
│   ├── uploads/diagrams/       # Rendered diagram images
│   ├── dist/                   # Compiled JS output
│   ├── drizzle.config.ts       # Drizzle Kit config
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile              # Multi-stage backend build
│   ├── docker-entrypoint.sh    # Run migrations + seed + start server
│   └── package.json
│
├── .planning/                  # Planning artifacts
│   └── codebase/               # Codebase map output
├── .superpowers/               # Task tracking (SDD tasks)
├── docs/                       # Documentation
├── public/                     # Static assets (manifest, sw.js, icons)
├── dist/                       # Frontend build output
│
├── docker-compose.yml          # Orchestrates all services
├── Dockerfile                  # Frontend multi-stage build
├── nginx.conf                  # Frontend nginx config
├── package.json                # Frontend dependencies (84 packages)
├── vite.config.js              # Vite build config
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js
├── components.json             # shadcn/ui config
├── tsconfig.json
├── AGENTS.md                   # Build spec for AI agents
└── DESIGN.md                   # Visual design system (authoritative)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One component per route — these are the top-level "views" of the SPA
- Contains: 11 page component files, some with lazy loading (`Editor`, `ExportPreview`, `OnboardingWizard`, `Assistant`)
- Key files: `Editor.tsx` (3-pane editor layout), `WorkspaceDashboard.tsx` (landing page), `router.tsx` (route definitions)

**`src/components/`:**
- Purpose: Reusable UI components organized by feature domain
- Contains: Feature-grouped subdirectories with barrel `index.ts` exports, plus top-level shared components
- Key files: `src/components/editor/index.ts` (barrel export for 8+ editor components), `src/components/ui/` (13 shadcn/ui primitives)

**`src/stores/`:**
- Purpose: Zustand state stores with `persist` middleware for localStorage persistence
- Contains: Auth store, workspace store, settings store, generation session store, notification store
- Key files: `src/stores/index.ts` (WorkspaceStore, AuthStore, SettingsStore class-based stores)

**`src/hooks/`:**
- Purpose: Custom React hooks — primarily data fetching wrappers around TanStack React Query
- Contains: 7 hooks for API queries, auth, collaboration, assisted chat, notifications
- Key files: `src/hooks/useQueries.ts` (all API query/mutation hooks), `src/hooks/useCollabStatus.ts` (Yjs WebSocket presence)

**`backend/src/routes/`:**
- Purpose: Express Router modules — one per API resource
- Contains: 17 route files, each exporting a `Router` mounted in `backend/src/index.ts`
- Key files: `auth.ts`, `projects.ts`, `documents.ts`, `ai.ts`, `agents.ts`

**`backend/src/services/`:**
- Purpose: Business logic layer — wraps database queries and external service calls
- Contains: 16 service modules with `.service.ts` suffix convention
- Key files: `auth.service.ts` (JWT + bcrypt), `diagram.service.ts` (PlantUML rendering), `s3.service.ts` (S3 operations), `export.service.ts` (PDF/DOCX generation), `outline.service.ts` (document outline CRUD)

**`backend/src/ai/`:**
- Purpose: Multi-agent AI generation pipeline
- Contains: Hermes orchestrator, agent registry (5 agents), tool implementations (4 tool files), provider abstraction (6 providers), pipeline orchestration + quality negotiation
- Key files: `hermes.ts` (runner + event types + model discovery), `pipeline/orchestrate.ts` (5-stage pipeline), `agents/registry.ts` (agent definitions), `providers/interface.ts` (LLM provider factory)

**`backend/src/collaboration/`:**
- Purpose: Real-time collaborative editing infrastructure
- Contains: Yjs WebSocket server with sync protocol, awareness protocol, JWT auth, notification broadcast
- Key files: `ws.ts` (WebSocket server, room management, notification clients)

**`backend/src/db/`:**
- Purpose: Database layer using Drizzle ORM with PostgreSQL
- Contains: Schema definitions, migration runner, seed data, SQL migrations
- Key files: `schema.ts` (13 tables), `index.ts` (Drizzle client), `seed.ts` (demo data)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Frontend entry — mounts React app
- `backend/src/index.ts`: Backend entry — creates Express app + HTTP/WS server
- `src/router.tsx`: Route definitions and auth guard logic

**Configuration:**
- `backend/src/config.ts`: Backend env config (DB, JWT, Ollama, S3, PlantUML, CORS)
- `vite.config.js`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS theme
- `tsconfig.json`: TypeScript config (path alias `@/*` → `src/*`)
- `docker-compose.yml`: Docker service orchestration (4 services)
- `nginx.conf`: Frontend nginx reverse proxy

**Core Logic:**
- `backend/src/ai/hermes.ts`: Hermes orchestrator runner, event types, model discovery
- `backend/src/ai/pipeline/orchestrate.ts`: 5-stage generation pipeline with resume
- `backend/src/ai/agents/registry.ts`: Agent declarations (Planner, Writer, UML, Tables, Reviewer)
- `backend/src/ai/providers/interface.ts`: LLM provider abstraction (6 providers)
- `backend/src/collaboration/ws.ts`: Yjs WebSocket server
- `backend/src/db/schema.ts`: PostgreSQL schema (13 tables)

**Testing:**
- `backend/tests/`: Backend integration tests (10 test files)
- `src/components/GenerationProgress.test.tsx`: Frontend component test (Vitest)
- `src/components/AgentStatus.test.tsx`: Frontend component test (Vitest)
- `src/stores/index.test.ts`: Store logic test (Vitest)
- `src/schemas/index.test.ts`: Schema validation test (Vitest)
- `src/test-setup.ts`: Vitest DOM setup

## Naming Conventions

**Files:**
- Frontend pages: PascalCase, `{Name}.tsx` — e.g., `WorkspaceDashboard.tsx`
- Frontend components: PascalCase, `{Name}.tsx` — e.g., `AgentStatus.tsx`
- Frontend hooks: camelCase with `use` prefix — e.g., `useAuth.ts`
- Frontend stores: camelCase — e.g., `generationStore.ts`
- Backend routes: kebab-case, `{name}.ts` — e.g., `project.service.ts`, `auth.service.ts`
- Backend services: kebab-case with `.service.ts` suffix — e.g., `document.service.ts`
- Backend AI tools: kebab-case — e.g., `document.ts`, `diagram.ts`
- Backend AI agents: kebab-case — e.g., `writer.ts`, `planner.ts`
- Backend pipeline: kebab-case — e.g., `orchestrate.ts`, `negotiate.ts`
- Test files: `{name}.test.ts` — co-located with source (e.g., `AgentStatus.test.tsx` beside `AgentStatus.tsx`)
- Database migration files: numeric prefix `{NNNN}_{descriptive_name}.sql`

**Directories:**
- Feature-grouped subdirectories in both `src/components/` and `backend/src/`
- Frontend: lowercase, hyphen-separated — e.g., `workspace-dashboard/`, `template-gallery/`
- Backend: lowercase, singletons — e.g., `routes/`, `services/`, `middleware/`, `collaboration/`

## Where to Add New Code

**New Feature:**
- Primary code: Create a new page in `src/pages/` (or if a sub-page, a new component directory under `src/components/`)
- Backend API: Add route in `backend/src/routes/{name}.ts`, service in `backend/src/services/{name}.service.ts`
- Tests: `backend/tests/{name}.test.ts` for integration, `src/components/{feature}/{Name}.test.tsx` for unit
- Wire up: Register route in `backend/src/index.ts` (app.use) and `src/router.tsx` (route definition)

**New Frontend Component:**
- Implementation: `src/components/{feature}/{Name}.tsx`
- Barrel export: Add to `src/components/{feature}/index.ts`
- Props interface: Defined at top of component file or in `src/components/{feature}/types.ts`
- For shared UI primitives: Add to `src/components/ui/{name}.tsx` using shadcn pattern

**New Backend Service:**
- Implementation: `backend/src/services/{name}.service.ts`
- Name pattern: `{name}.service.ts` with exported functions or a class
- Use `AppError` from `backend/src/middleware/error.ts` for typed errors
- DB access via `import { db } from '../db'` and `import { tableName } from '../db/schema'`

**New AI Agent:**
- Agent definition: Add to `backend/src/ai/agents/registry.ts` following the `AgentDefinition` interface
- Agent tools: Add tool functions to `backend/src/ai/tools/` (or extend existing files)
- System prompt: Inline in the registry definition
- Pipeline integration: Add stage in `backend/src/ai/pipeline/orchestrate.ts` following the 5-stage pattern

**New AI Provider:**
- Implementation: Add case to `createProvider()` switch in `backend/src/ai/providers/interface.ts`
- Export type: Add to `ProviderType` union
- Config: Add env var to `backend/src/config.ts`

**New Database Table:**
- Schema: Add to `backend/src/db/schema.ts` using Drizzle `pgTable`
- Migration: Run `drizzle-kit generate` then `drizzle-kit push`
- Seed: Add to `backend/src/db/seed.ts`

**Utilities:**
- Shared helpers: `backend/src/utils/` for backend, `src/lib/utils.ts` (`cn()` function) or `src/utils/` for frontend

## Special Directories

**`dist/`:**
- Purpose: Frontend production build output
- Generated: Yes (by `npm run build`)
- Committed: Yes (static files served by nginx in Docker)

**`backend/dist/`:**
- Purpose: Backend TypeScript compilation output
- Generated: Yes (by `npm run build` in backend)
- Committed: Yes (used in Docker multi-stage build)

**`backend/uploads/diagrams/`:**
- Purpose: Rendered PlantUML diagram images
- Generated: Yes (at runtime by diagram service)
- Committed: No (runtime artifacts)

**`.planning/`:**
- Purpose: GSD workflow artifacts — roadmaps, state, codebase maps
- Generated: No (manually maintained by GSD commands)
- Committed: Yes

**`.superpowers/`:**
- Purpose: Task tracking reports, briefs, and diffs from SDD workflow
- Generated: Yes (by SDD tasks)
- Committed: Yes

**`node_modules/`:**
- Purpose: Frontend npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**`backend/node_modules/`:**
- Purpose: Backend npm dependencies
- Generated: Yes (by `npm install` in backend)
- Committed: No

---

*Structure analysis: 2026-07-13*
