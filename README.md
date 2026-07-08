# Repora Web

Repora is a free, self-hostable AI-native document platform. A team of specialized agents collaboratively produces structured, professional specification documents — with UML diagrams, requirement tables, and a review pass — inside a block-based collaborative editor.

## Tech Stack

- Vite 5 + React 19 + TypeScript
- shadcn v4 (`@base-ui/react`, OKLCH colors, `tw-animate-css`)
- Tailwind CSS 3 (custom design tokens: `primary`, `surface`, `ai-vibrant`, `status-final`, etc.)
- TanStack Router + TanStack Query + TanStack Table
- Zustand 5 (persist middleware) + Zod 4
- class-variance-authority + clsx + tailwind-merge
- Material Symbols icons (`material-symbols-outlined`)
- Fonts: Inter (body), Geist (headings), JetBrains Mono (labels/agent metadata)
- PWA: `manifest.json`, service worker (`sw.js`)

## Prerequisites

- Node.js 20+
- npm 10+

## Scripts

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Project Structure

```
repora-web/
├── src/
│   ├── main.tsx                  # React entry, RouterProvider
│   ├── router.tsx                # TanStack Router route tree (12 pages)
│   ├── index.css                 # Tailwind base + custom animations + design tokens
│   ├── stores/                   # Zustand stores (OOP class-based)
│   │   └── index.ts              # WorkspaceStore, AuthStore, SettingsStore
│   ├── schemas/                  # Zod schemas + inferred types + OOP interfaces
│   │   └── index.ts              # Document, User, Settings, Template, Metrics schemas
│   ├── hooks/                    # TanStack Query hooks
│   │   └── useQueries.ts         # useDocuments, useAnalytics, useTemplates, useCollaborators
│   ├── components/
│   │   ├── Icon.tsx              # Material Symbols wrapper
│   │   ├── StatusBadge.tsx       # cva-based status chip (draft/review/final/active/autonomous)
│   │   ├── AgentStatus.tsx       # agent state chip (idle/thinking/writing/review)
│   │   ├── layout/               # Sidebar.tsx, TopBar.tsx (3-pane shell)
│   │   └── ui/                   # shadcn v4 components (Button, Card, Badge, Table, ...)
│   └── pages/                    # 12 route pages (all .tsx, connected to stores/hooks)
│       ├── WorkspaceDashboard.tsx
│       ├── DocumentLibrary.tsx
│       ├── Editor.tsx
│       └── ...
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # service worker (cache-first)
│   └── icons/                    # SVG app icons
├── Dockerfile                    # multi-stage Node build → nginx:alpine
└── nginx.conf                    # SPA fallback + /api proxy to backend
```

## Design System

All colors, spacing, and typography are defined in `tailwind.config.js` under `theme.extend`. Key tokens:

- **Colors**: `primary` (#000), `primary-container` (#131b2e), `surface` (#fcf8fa), `surface-studio` (#F8FAFC), `secondary`/`ai-vibrant` (#0058be/#2563EB), `status-final` (#10B981 emerald), `status-review` (#F59E0B amber), `status-draft` (#94A3B8 gray), `outline-variant` (#c6c6cd)
- **Spacing**: `gutter` (24px), `sidebar-width` (280px), `inspector-width` (320px), `margin-desktop` (32px)
- **Typography**: `font-headline-lg/md` (Geist), `font-body-lg/md/sm` (Inter), `font-label-md/sm` (JetBrains Mono)
- **Shape**: buttons/inputs/chips `rounded` (4px); panels/cards `rounded-xl` (8px)

## Connecting to the Backend

Set `VITE_API_BASE` in a `.env` file (defaults to `/api`):

```
VITE_API_BASE=http://localhost:8000
```

The frontend proxies `/api/*` to the backend via `nginx.conf` in Docker, or directly via Vite dev server proxy.

## Routing

Routes are defined in `src/router.tsx` using TanStack Router's `createRouter` + `RouteTree`. All 12 pages are registered:

- `/workspace` — WorkspaceDashboard
- `/library` — DocumentLibrary
- `/templates` — TemplateGallery
- `/agents` — AgentWorkshop
- `/editor` — Editor
- `/analytics` — Analytics
- `/collaboration` — CollaborationHub
- `/export` — ExportPreview
- `/settings` — Settings
- `/infrastructure` — Infrastructure
- `/sharing` — Sharing
- `/history` — VersionHistory

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

Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

## Contributing

1. Create a feature branch from `main`.
2. Follow conventions (stores/schemas/hooks separation, shadcn primitives, OOP types).
3. Run `npm run build` before pushing.
4. Open a PR.
