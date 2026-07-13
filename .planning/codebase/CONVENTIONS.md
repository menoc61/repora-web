# Coding Conventions

**Analysis Date:** 2026-07-13

## Naming Patterns

**Files:**
- **React components, pages, hooks**: PascalCase (`AgentStatus.tsx`, `GenerationProgress.tsx`, `Toast.tsx`, `useAuth.ts`, `useQueries.ts`)
- **Backend modules (routes, services, middleware)**: kebab-case (`auth.service.ts`, `project.service.ts`, `documents.ts`, `auth.ts`, `error.ts`, `validate.ts`)
- **Config, utility, and store files**: camelCase (`vite.config.js`, `tailwind.config.js`, `generationStore.ts`, `notificationStore.ts`, `utils.ts`, `client.ts`)
- **Schemas and types**: kebab-case or single word (`index.ts`, `schemas.ts`)
- **Test files**: `<source>.test.ts(x)` — e.g. `auth.test.ts`, `GenerationProgress.test.tsx`

**Functions:**
- **camelCase** everywhere: `registerUser`, `streamGeneration`, `deriveAgentStates`, `discoverOllamaModel`, `getProjects`, `createProject`, `probeToolSupport`
- Helper functions use camelCase: `randomEmail`, `makeEvent`, `getToken`, `clearAuth`
- Generator functions use `function*` syntax: `async function* runAgent(...)`, `async function* streamGeneration(...)`
- Store actions are properties: `startSession`, `updateSession`, `completeSession`, `login`, `logout`, `addRecentDocument`

**Variables:**
- **camelCase** for all variables: `agentStates`, `pipelineStage`, `projectId`, `documentId`, `lastTokenTime`
- **UPPER_SNAKE_CASE** for constants: `STALL_THRESHOLD_MS`, `STATE_LABELS`, `PIPELINE_STEPS`, `LABELS`
- `const` preferred over `let`; `let` used only for mutable variables (`buffer`, `app`, `token`, `projectId`)

**Types:**
- **Interfaces:** PascalCase, I-prefix for state/action interfaces: `IAuthState`, `IAuthActions`, `IWorkspaceState`, `IWorkspaceActions`, `ISettingsState`, `ISettingsActions`, `IDocumentService`, `IAnalyticsService`, `IAuthService`
- **Types (non-interface):** PascalCase, no prefix: `HermesEvent`, `GenerationContext`, `AgentStatusProps`, `GenerationProgressProps`, `AppNotification`, `GenerationSession`, `RequestOptions`
- **React Props interfaces:** PascalCase, often `<Name>Props` suffix: `AgentStatusProps`, `GenerationProgressProps`, `StatusBadgeProps`
- **Zod schemas:** PascalCase with Schema suffix: `DocumentSchema`, `UserSchema`, `SettingsSchema`, `MetricsSchema`
- **Enums:** Object maps with `Record<string, string>` instead of TypeScript enums: `STATE_LABELS`, `LABELS`, `BADGE_COLORS`, `BADGE_ICONS`
- **Zod inferred types:** `z.infer<typeof SchemaName>`: `type Document = z.infer<typeof DocumentSchema>`

## Code Style

**Formatting:**
- No Prettier config detected — formatting appears default/native to authors
- No ESLint config detected — linting is not enforced
- Single quotes preferred in JavaScript/TypeScript (`import { x } from 'module'`)
- Semicolons used consistently
- 2-space indentation used throughout

**Linting:**
- No ESLint or Prettier configuration files present (`.eslintrc*`, `.prettierrc*` not found)
- TypeScript compiler (`tsconfig.json`) enforces `strict: true` in both frontend and backend

**TypeScript Strictness:**
- Frontend `tsconfig.json`: `strict: true`, `noEmit: true`, `isolatedModules: true`, `skipLibCheck: true`
- Backend `tsconfig.json`: `strict: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`

**Module System:**
- Both `package.json` files use `"type": "module"` — ESM throughout
- Dynamic imports used for lazy React components (`const Editor = lazy(() => import('./pages/Editor'))`)
- Dynamic imports also used for conditional requires (`await import('child_process')`, `await import('bcryptjs')`)

**Path Aliases:**
- Frontend: `@/` → `./src/` (configured in both `vite.config.js` and `tsconfig.json`)

## Import Organization

**Order:**
1. Node built-in modules: `import http from 'http'`, `import path from 'path'`
2. Third-party packages: `import express from 'express'`, `import { z } from 'zod'`, `import { describe, it, expect } from 'vitest'`
3. Internal project modules: `import { config } from '../config'`, `import { errorHandler } from './middleware/error'`
4. Types: `import type { Document, Metrics } from '../schemas'`

**Patterns:**
- `import type` used for type-only imports: `import type { Document, Metrics } from '../schemas'`
- Default imports for React dependencies: `import React from 'react'` (also `import { useState } from 'react'`)
- Namespace imports for schemas: `import * as schema from './schema'`
- Named imports preferred over default for internal modules

## Error Handling

**Backend:**
- `AppError` class at `backend/src/middleware/error.ts`:
  ```typescript
  export class AppError extends Error {
    constructor(
      public statusCode: number,
      public code: string,
      message: string,
    ) { super(message); this.name = 'AppError' }
  }
  ```
- Error response shape: `{ error: { code: string, message: string } }`
- Error codes: `'email_exists'`, `'invalid_credentials'`, `'invalid_token'`, `'not_found'`, `'unauthorized'`, `'forbidden'`, `'validation_error'`, `'missing_fields'`, `'internal_error'`, `'request_failed'`, `'invalid_format'`
- Route handlers use `try/catch` + `next(err)` pattern
- Global `errorHandler` middleware catches all errors
- Process-level safety net in `backend/src/index.ts`:
  ```typescript
  process.on('unhandledRejection', (reason) => { console.warn(...) })
  process.on('uncaughtException', (err) => { console.warn(...) })
  ```

**Frontend:**
- `ApiError` class at `src/api/client.ts`:
  ```typescript
  export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) {
      super(message); this.name = 'ApiError'
    }
  }
  ```
- HTTP 401 responses trigger automatic auth logout: `if (res.status === 401) { if (!opts.public) clearAuth() }`
- Error states in UI components: `errorMessage` field in `AgentState`, `generation_error` HermesEvent type
- `notify()` from `Toast.tsx` used for user-facing error toasts

## Logging

**Framework:** No structured logging library — raw `console.log` / `console.warn`.

**Patterns:**
- Backend startup logging: `console.log('[Hermes] Default model:...', `console.log('[S3] Export bucket ready')`
- Warning logs for non-critical failures: `console.warn('[Hermes] Model discovery failed:', ...)` 
- Debug logs with component prefix: `[Hermes]`, `[S3]`, `[Process]`
- No `console.error` except in the global error handler (`console.error('Unhandled error:', err)`)
- Frontend test seed uses `console.log('Seeding test database...')`

## Comments

**When to Comment:**
- Section headers with emoji separators: `// ── Workspace State ──`, `// ── Auth State ──`
- Module-level JSDoc comments: `/** * Probe whether a model actually supports tool calling... */`
- Inline comments for non-obvious logic: `// G6: maxSteps exhaustion handled by SDK stopWhen`
- Re-export markers: `// Re-export the orchestrator pipeline (refactored into pipeline/ directory)`
- Single `// TODO` found: `src/components/template-gallery/TemplateGalleryView.tsx`

**JSDoc/TSDoc:**
- Used for exported public functions: `@param`, `@returns`, descriptive text
- Used for module-level descriptions: `/** * Tests for extracted tool files... */`
- Type-level comments for complex unions: `// Type-level test: construct an event matching...`

## Function Design

**Size:**
- Functions range from small utility functions (`cn()` at 4 lines, `verifyToken()` at 6 lines) to large orchestration functions (`initiateGeneration()` at ~44 lines, `streamGeneration()` at ~32 lines)
- Route handlers are intentionally thin (5-10 lines), delegating to services
- Large components like `GenerationProgress.tsx` (337 lines) contain multiple inner helper functions

**Parameters:**
- Named parameters via destructured objects for config-style params: `(overrides: Partial<HermesEvent> = {})`
- Simple scalar parameters for straightforward functions: `(name: string, email: string, password: string)`
- Optional parameters with defaults: `(schema: ZodSchema, coerceEmpty = true)`
- `Partial<T>` pattern for update operations: `updateSession(id: string, p: Partial<GenerationSession>)`

**Return Values:**
- TypeScript return types explicit on all functions
- Services return full objects (not void)
- Error cases throw `AppError` exceptions (never return error objects)
- API responses follow structure: `{ data?: T, error?: { code, message } }`
- Async generators return `AsyncGenerator<HermesEvent>` for streaming

## Module Design

**Exports:**
- **Named exports** for services, hooks, utilities: `export async function registerUser()`, `export function useLogin()`
- **Default exports** for React page components and some UI components: `export default function StatusBadge()`, `export default function ToastContainer()`
- Mixed pattern: `AgentStatus.tsx` exports both `AgentStatus` (named) and `default`
- Re-exports through barrel files: `export const useAuthStore = createAuthStore()`, `export const router = createRouter({ routeTree })`

**Barrel Files:**
- `src/stores/index.ts` — re-exports `useAuthStore`, `useWorkspaceStore`, `useSettingsStore`
- `src/schemas/index.ts` — re-exports all Zod schemas, inferred types, and interfaces
- `backend/src/db/index.ts` — re-exports `db` and `schema`

**File Organization per Module Type:**
- **Routes**: Each file exports a `Router` instance (`export const authRouter = Router()`)
- **Services**: Each file exports functions directly (`export async function getProjects(...)`)
- **Stores**: Zustand stores created via `create()` factory, exported as `use<Name>Store`
- **Middleware**: Each file exports middleware functions and/or the `AppError` class
- **Schemas**: Zod schemas + exported types + OOP service interfaces in a single `index.ts`

## State Management

**Zustand Stores:**
- Stores defined with separated `State`/`Actions` interfaces: `interface State { ... } interface Actions { ... }`
- Class-based implementation pattern for complex stores (auth, workspace, settings) at `src/stores/index.ts`
- Functional pattern for simpler stores (generation, notifications) at `src/stores/generationStore.ts`
- Zustand `persist` middleware used with localStorage keys: `repora-auth`, `repora-settings`, `repora-generations`, `repora-notifications`
- `partialize` option to control what gets persisted in notification store

**React Query:**
- `QueryClient` configured at `src/router.tsx`: retry: 1, staleTime: 30s, refetchOnWindowFocus: false
- Custom hooks wrap `useQuery`/`useMutation`: `useLogin()`, `useRegister()`, `useMe()`, `useLogout()`
- `queryClient.invalidateQueries` for cache invalidation on mutations

## CSS / Styling

- Tailwind CSS utility classes used throughout
- Custom design tokens in `tailwind.config.js`: `status-draft`, `status-review`, `status-final`, `ai-vibrant`, `ai-glow`, `surface-studio`
- Font families: Inter (body), Geist (headlines), JetBrains Mono (labels/monospace)
- CSS-in-JS avoided — all styling inline via Tailwind
- `cn()` utility at `src/lib/utils.ts` combines `clsx` + `tailwind-merge`
- `class-variance-authority` for component variant definitions (`StatusBadge.tsx`, `AgentStatus.tsx`)

## React Patterns

- Functional components with hooks only (no class components)
- `useSyncExternalStore` for toast notification store subscription
- `lazy()` + `Suspense` for code-split pages
- Custom hooks encapsulate data fetching with React Query: `useGenerationWriter.ts`, `useAssistantChat.ts`, `useCollabStatus.ts`
- `useMemo` for derived state from event arrays
- `useRef` for mutable values that shouldn't trigger re-renders

---

*Convention analysis: 2026-07-13*
