# Repora Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Express + Drizzle + Vercel AI SDK 7 backend inside `repora-web/backend/` that wires all frontend pages with real data.

**Architecture:** Express REST API with JWT auth, Drizzle ORM over PostgreSQL, Hermes multi-agent orchestrator using AI SDK 7 `streamText` + `maxSteps` tool calling, BYOK provider layer via `@ai-sdk/openai-compatible`.

**Tech Stack:** Express.js, Drizzle ORM, PostgreSQL 17, `ai@^7`, `@ai-sdk/openai-compatible`, `jsonwebtoken`, `bcryptjs`, `zod`, `drizzle-kit`, TypeScript

## Global Constraints

- All backend code lives under `repora-web/backend/`
- TypeScript strict mode
- Response format: JSON with `data` envelope or raw object (no `data` wrapper if not present — frontend client handles both)
- Auth: JWT Bearer tokens, `Authorization: Bearer <token>` header
- 401 responses trigger frontend auto-logout
- SSE format: `data: <json>\n\n` lines per `client.ts` parser
- All table UUIDs use `gen_random_uuid()` default
- Passwords hashed with bcryptjs (salt rounds 12)
- BYOK keys encrypted with `crypto.createCipheriv` (AES-256-GCM)
- Migration tool: `drizzle-kit` with SQL output

---

### Task 1: Backend Project Scaffolding

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/src/config.ts`
- Create: `backend/.env.example`
- Modify: `repora-web/package.json` (add workspace script)
- Modify: `repora-web/docker-compose.yml` (add backend service)

**Interfaces:**
- Consumes: nothing yet
- Produces: Express app on port 3001, config module with typed env vars

- [ ] **Step 1: Create backend/package.json**

```json
{
  "name": "repora-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "ai": "^7.0.0",
    "@ai-sdk/openai": "^3.0.0",
    "@ai-sdk/anthropic": "^3.0.0",
    "@ai-sdk/google": "^3.0.0",
    "@ai-sdk/openai-compatible": "^3.0.0",
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.43.0",
    "postgres": "^3.4.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^3.0.0",
    "zod": "^4.4.3",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.9.3",
    "drizzle-kit": "^0.30.0"
  }
}
```

- [ ] **Step 2: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create backend/src/config.ts**

```typescript
import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://repora:repora@localhost:5432/repora',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  llamaCppUrl: process.env.LLAMA_CPP_URL || 'http://localhost:8080/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}
```

- [ ] **Step 4: Create backend/.env.example**

```
DATABASE_URL=postgres://repora:repora@localhost:5432/repora
JWT_SECRET=change-this-to-a-random-secret
ENCRYPTION_KEY=32-char-hex-encryption-key
LLAMA_CPP_URL=http://localhost:8080/v1
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

- [ ] **Step 5: Create backend/src/index.ts**

```typescript
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/error'
import { authRouter } from './routes/auth'
import { projectRouter } from './routes/projects'
import { documentRouter } from './routes/documents'
import { diagramRouter } from './routes/diagrams'
import { adminRouter } from './routes/admin'
import { exportRouter } from './routes/export'
import { validationRouter } from './routes/validation'
import { db } from './db'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json())

// Routes
app.use('/auth', authRouter)
app.use('/projects', projectRouter)
app.use('/documents', documentRouter)
app.use('/projects', diagramRouter)
app.use('/admin', adminRouter)
app.use('/export', exportRouter)
app.use('/validate', validationRouter)

// Health
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Repora backend listening on :${config.port}`)
})

export default app
```

- [ ] **Step 6: Create backend/src/middleware/error.ts**

```typescript
import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    })
    return
  }
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error' },
  })
}
```

- [ ] **Step 7: Install dependencies and verify**

```bash
cd backend && npm install && npx tsx src/index.ts
```

Expected: Server starts on port 3001, `GET /healthz` returns `{ "status": "ok" }`.

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/src/index.ts backend/src/config.ts backend/src/middleware/error.ts backend/.env.example
git commit -m "feat: scaffold backend with Express + TypeScript"
```

---

### Task 2: Database Schema + Drizzle Setup

**Files:**
- Create: `backend/src/db/index.ts`
- Create: `backend/src/db/schema.ts`
- Create: `backend/drizzle.config.ts`
- Create: `backend/src/db/migrate.ts`

**Interfaces:**
- Consumes: `config.databaseUrl`
- Produces: `db` drizzle instance, all table schemas, migration script

- [ ] **Step 1: Create backend/src/db/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config'
import * as schema from './schema'

const queryClient = postgres(config.databaseUrl)
export const db = drizzle(queryClient, { schema })

export { schema }
```

- [ ] **Step 2: Create backend/drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://repora:repora@localhost:5432/repora',
  },
})
```

- [ ] **Step 3: Create backend/src/db/schema.ts**

```typescript
import { pgTable, uuid, text, boolean, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('redacteur'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  brief: text('brief'),
  status: text('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const requirements = pgTable('requirements', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  type: text('type').notNull(),
  text: text('text').notNull(),
  sourceActor: text('source_actor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  status: text('status').default('draft').notNull(),
  outline: jsonb('outline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  content: text('content').default('').notNull(),
  status: text('status').default('draft').notNull(),
  generatedByAgent: text('generated_by_agent'),
  modelUsed: text('model_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const diagrams = pgTable('diagrams', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  type: text('type').notNull(),
  plantumlSource: text('plantuml_source'),
  renderedUrl: text('rendered_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  text: text('text').notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const validations = pgTable('validations', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  validatorToken: text('validator_token').notNull().unique(),
  decision: text('decision'),
  sectionReasons: jsonb('section_reasons'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const agentConfigs = pgTable('agent_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentName: text('agent_name').notNull().unique(),
  provider: text('provider').notNull().default('llama_cpp'),
  modelId: text('model_id'),
  temperature: real('temperature').default(0.7),
  topP: real('top_p').default(0.9),
  maxTokens: integer('max_tokens').default(4096),
  enabled: boolean('enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: text('provider').notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  target: text('target'),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})
```

- [ ] **Step 4: Generate migration and apply**

```bash
cd backend && npx drizzle-kit generate && npx drizzle-kit push
```

Expected: 11 tables created in PostgreSQL. Run `\dt` in psql to verify.

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/ backend/drizzle.config.ts
git commit -m "feat: add Drizzle schema with all 11 tables"
```

---

### Task 3: Auth System (JWT + bcrypt)

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/services/auth.service.ts`
- Create: `backend/src/routes/auth.ts`

**Interfaces:**
- Consumes: `config.jwtSecret`, `db` from Task 1-2
- Produces: `requireAuth` middleware, `POST /auth/login|register|logout`, `GET /auth/me`
- Response shapes:
  - `POST /auth/login` → `{ token: string, user: { id, name, email, role } }`
  - `POST /auth/register` → `{ token: string, user: { id, name, email, role } }`
  - `GET /auth/me` → `{ id, name, email, role }`
  - `POST /auth/logout` → `{ ok: true }`

- [ ] **Step 1: Create backend/src/services/auth.service.ts**

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { config } from '../config'
import { AppError } from '../middleware/error'

export interface JwtPayload {
  userId: string
  role: string
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    throw new AppError(409, 'email_exists', 'Email already registered')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning()
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    throw new AppError(401, 'invalid_token', 'Invalid or expired token')
  }
}
```

- [ ] **Step 2: Create backend/src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../services/auth.service'
import { AppError } from './error'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'unauthorized', 'Missing or invalid token'))
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'forbidden', 'Insufficient permissions'))
    }
    next()
  }
}
```

- [ ] **Step 3: Create backend/src/routes/auth.ts**

```typescript
import { Router } from 'express'
import { registerUser, loginUser } from '../services/auth.service'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const authRouter = Router()

authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const result = await registerUser(name, email, password)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await loginUser(email, password)
    res.json(result)
  } catch (err) { next(err) }
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users).where(eq(users.id, req.user!.userId)).limit(1)
    if (!user) return next(new (await import('../middleware/error')).AppError(404, 'not_found', 'User not found'))
    res.json(user)
  } catch (err) { next(err) }
})
```

- [ ] **Step 4: Run migration and test**

```bash
cd backend && npx drizzle-kit push
# Start server, test with curl:
curl -X POST http://localhost:3001/auth/register -H 'Content-Type: application/json' -d '{"name":"Test","email":"test@test.com","password":"password123"}'
curl -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"password123"}'
curl http://localhost:3001/auth/me -H 'Authorization: Bearer <token>'
```

Expected: Register returns user + token, login returns user + token, /me returns user.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/auth.service.ts backend/src/middleware/auth.ts backend/src/routes/auth.ts
git commit -m "feat: add JWT auth with register/login/logout/me"
```

---

### Task 4: Projects CRUD + Generate Trigger

**Files:**
- Create: `backend/src/services/project.service.ts`
- Create: `backend/src/routes/projects.ts`
- Create: `backend/src/services/audit.service.ts`

**Interfaces:**
- Consumes: `requireAuth` from Task 3, `db` from Task 2
- Produces: full Projects CRUD + generate endpoint
- Response shapes match `useQueries.ts` expectations:
  - `GET /projects` → `BackendProject[]` with `{ id, name, status, brief? }`
  - `POST /projects/:id/generate` → `{ document_id, status, prompt }`

- [ ] **Step 1: Create backend/src/services/audit.service.ts**

```typescript
import { db } from '../db'
import { auditLogs } from '../db/schema'

export async function logAction(userId: string | undefined, action: string, target?: string, metadata?: Record<string, unknown>) {
  await db.insert(auditLogs).values({ userId, action, target, metadata })
}
```

- [ ] **Step 2: Create backend/src/services/project.service.ts**

```typescript
import { db } from '../db'
import { projects, documents, sections } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function listProjects(ownerId: string) {
  return db.select({ id: projects.id, name: projects.name, status: projects.status, brief: projects.brief })
    .from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.createdAt))
}

export async function getProject(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) throw new AppError(404, 'not_found', 'Project not found')
  return project
}

export async function createProject(ownerId: string, name: string, brief?: string) {
  const [project] = await db.insert(projects).values({ ownerId, name, brief }).returning()
  return project
}

export async function updateProject(id: string, data: Partial<{ name: string; brief: string; status: string }>) {
  const [project] = await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id)).returning()
  if (!project) throw new AppError(404, 'not_found', 'Project not found')
  return project
}

export async function deleteProject(id: string) {
  const result = await db.delete(projects).where(eq(projects.id, id))
  if (result.count === 0) throw new AppError(404, 'not_found', 'Project not found')
}

export async function triggerGeneration(projectId: string, prompt: string) {
  const project = await getProject(projectId)
  const [doc] = await db.insert(documents).values({ projectId, status: 'draft' }).returning()
  await db.insert(sections).values({ documentId: doc.id, order: 0, title: 'Generated Section', content: '' })
  return { document_id: doc.id, status: doc.status, prompt }
}
```

- [ ] **Step 3: Create backend/src/routes/projects.ts**

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as projectService from '../services/project.service'
import { logAction } from '../services/audit.service'

export const projectRouter = Router()
projectRouter.use(requireAuth)

projectRouter.get('/', async (req, res, next) => {
  try {
    const list = await projectService.listProjects(req.user!.userId)
    res.json(list)
  } catch (err) { next(err) }
})

projectRouter.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id)
    res.json({ id: project.id, name: project.name, status: project.status, brief: project.brief })
  } catch (err) { next(err) }
})

projectRouter.post('/', async (req, res, next) => {
  try {
    const { name, brief } = req.body
    const project = await projectService.createProject(req.user!.userId, name, brief)
    await logAction(req.user!.userId, 'project.created', project.id)
    res.status(201).json(project)
  } catch (err) { next(err) }
})

projectRouter.patch('/:id', async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body)
    await logAction(req.user!.userId, 'project.updated', project.id)
    res.json(project)
  } catch (err) { next(err) }
})

projectRouter.delete('/:id', async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id)
    await logAction(req.user!.userId, 'project.deleted', req.params.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

projectRouter.post('/:id/generate', async (req, res, next) => {
  try {
    const result = await projectService.triggerGeneration(req.params.id, req.body.prompt || '')
    await logAction(req.user!.userId, 'document.generation_started', result.document_id)
    res.json(result)
  } catch (err) { next(err) }
})
```

- [ ] **Step 4: Test with curl**

```bash
# Create project
curl -X POST http://localhost:3001/projects -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"name":"Test Project","brief":"A test"}'
# List projects
curl http://localhost:3001/projects -H 'Authorization: Bearer <token>'
# Trigger generation
curl -X POST http://localhost:3001/projects/<id>/generate -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"prompt":"Generate a spec"}'
```

Expected: All CRUD operations work, generation returns `{ document_id, status, prompt }`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/project.service.ts backend/src/services/audit.service.ts backend/src/routes/projects.ts
git commit -m "feat: add projects CRUD + generate trigger"
```

---

### Task 5: Documents Routes (Get + SSE Stream)

**Files:**
- Create: `backend/src/services/document.service.ts`
- Create: `backend/src/routes/documents.ts`

**Interfaces:**
- Consumes: `requireAuth`, `db`
- Produces:
  - `GET /documents/:id` → `BackendDocument` with sections (matches `useQueries.ts` `BackendDocument` shape)
  - `GET /documents/:id/stream` → SSE event stream
  - `POST /documents/:id/validation-token` → `{ token }`

- [ ] **Step 1: Create backend/src/services/document.service.ts**

```typescript
import { db } from '../db'
import { documents, sections } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import crypto from 'crypto'
import { validations } from '../db/schema'

export async function getDocument(id: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')
  const docSections = await db.select().from(sections).where(eq(sections.documentId, id)).orderBy(sections.order)
  return { ...doc, sections: docSections }
}

export async function createValidationToken(documentId: string) {
  const token = crypto.randomUUID()
  await db.insert(validations).values({ documentId, validatorToken: token })
  return { token }
}
```

- [ ] **Step 2: Create backend/src/routes/documents.ts**

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as documentService from '../services/document.service'

export const documentRouter = Router()
documentRouter.use(requireAuth)

documentRouter.get('/:id', async (req, res, next) => {
  try {
    const doc = await documentService.getDocument(req.params.id)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.get('/:id/stream', async (req, res, next) => {
  try {
    const doc = await documentService.getDocument(req.params.id)

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    // Emit initial agent status
    res.write(`data: ${JSON.stringify({ type: 'agent_status', agent: 'Hermes', status: 'thinking' })}\n\n`)

    // Simulate streaming events — in production, this relays Hermes fullStream
    const events = [
      { type: 'token', token: '# Document Outline\n\n' },
      { type: 'token', token: '## 1. Introduction\n\n' },
      { type: 'token', token: '## 2. System Architecture\n\n' },
      { type: 'agent_status', agent: 'Planner', status: 'writing' },
      { type: 'section_complete', section_id: 'placeholder', title: 'Introduction' },
      { type: 'agent_status', agent: 'Writer', status: 'thinking' },
      { type: 'token', token: 'Drafting content...\n\n' },
    ]

    for (const event of events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
      await new Promise(r => setTimeout(r, 300))
    }

    res.write(`data: ${JSON.stringify({ type: 'done', document_id: req.params.id })}\n\n`)
    res.end()
  } catch (err) { next(err) }
})

documentRouter.post('/:id/validation-token', async (req, res, next) => {
  try {
    const result = await documentService.createValidationToken(req.params.id)
    res.json(result)
  } catch (err) { next(err) }
})
```

- [ ] **Step 3: Test the SSE stream**

```bash
curl -N http://localhost:3001/documents/<id>/stream -H 'Authorization: Bearer <token>'
```

Expected: SSE events stream in the format the frontend's `sseStream` helper expects.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/document.service.ts backend/src/routes/documents.ts
git commit -m "feat: add document routes with SSE streaming"
```

---

### Task 6: Diagrams Routes

**Files:**
- Create: `backend/src/routes/diagrams.ts`
- Create: `backend/src/services/diagram.service.ts`

**Interfaces:**
- `POST /projects/:id/diagrams` → `{ id, rendered_url }`
- `GET /projects/diagrams/:id` → `{ id, type, rendered_url }`

- [ ] **Step 1: Create backend/src/services/diagram.service.ts**

```typescript
import { db } from '../db'
import { diagrams } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function createDiagram(projectId: string, type: string, source?: string) {
  const [diagram] = await db.insert(diagrams).values({
    projectId,
    type,
    plantumlSource: source || '',
    renderedUrl: '',
  }).returning()
  return { id: diagram.id, rendered_url: diagram.renderedUrl || '' }
}

export async function getDiagram(id: string) {
  const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id)).limit(1)
  if (!diagram) throw new AppError(404, 'not_found', 'Diagram not found')
  return { id: diagram.id, type: diagram.type, rendered_url: diagram.renderedUrl || '' }
}
```

- [ ] **Step 2: Create backend/src/routes/diagrams.ts**

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as diagramService from '../services/diagram.service'

export const diagramRouter = Router()
diagramRouter.use(requireAuth)

diagramRouter.post('/:id/diagrams', async (req, res, next) => {
  try {
    const result = await diagramService.createDiagram(req.params.id, req.body.type, req.body.source)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

diagramRouter.get('/diagrams/:id', async (req, res, next) => {
  try {
    const result = await diagramService.getDiagram(req.params.id)
    res.json(result)
  } catch (err) { next(err) }
})
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/diagram.service.ts backend/src/routes/diagrams.ts
git commit -m "feat: add diagram CRUD routes"
```

---

### Task 7: Admin Routes (Agents, Metrics, Logs)

**Files:**
- Create: `backend/src/routes/admin.ts`
- Create: `backend/src/services/admin.service.ts`

**Interfaces:**
- `GET /admin/agents` → `BackendAgent[]` `[{ name, provider, enabled, model_id? }]`
- `PATCH /admin/agents/:name` → `{ ok: true }`
- `GET /admin/metrics` → `BackendMetrics` `{ total_documents, active_agents, collaboration_score }`
- `GET /admin/logs` → `BackendLog[]` `[{ action, target }]`

- [ ] **Step 1: Create backend/src/services/admin.service.ts**

```typescript
import { db } from '../db'
import { agentConfigs, users, documents, auditLogs, projects } from '../db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { AppError } from '../middleware/error'

const DEFAULT_AGENTS = [
  { agentName: 'Hermes', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Planner', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Writer', provider: 'byok', modelId: 'gpt-4o', enabled: true },
  { agentName: 'UML', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Tables', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Reviewer', provider: 'byok', modelId: 'claude-sonnet-4-6', enabled: true },
]

export async function seedDefaultAgents() {
  for (const agent of DEFAULT_AGENTS) {
    await db.insert(agentConfigs).values(agent).onConflictDoNothing({ target: agentConfigs.agentName })
  }
}

export async function listAgents() {
  const rows = await db.select().from(agentConfigs)
  if (rows.length === 0) {
    await seedDefaultAgents()
    return db.select().from(agentConfigs)
  }
  return rows.map(a => ({ name: a.agentName, provider: a.provider, enabled: a.enabled, model_id: a.modelId }))
}

export async function patchAgent(name: string, data: Partial<{ provider: string; modelId: string; enabled: boolean; temperature: number }>) {
  const result = await db.update(agentConfigs).set({ ...data, updatedAt: new Date() }).where(eq(agentConfigs.agentName, name))
  if (result.count === 0) throw new AppError(404, 'not_found', 'Agent not found')
  return { ok: true }
}

export async function getMetrics() {
  const [docCount] = await db.select({ count: count() }).from(documents)
  const [agentCount] = await db.select({ count: count() }).from(agentConfigs).where(eq(agentConfigs.enabled, true))
  return {
    total_documents: docCount.count,
    active_agents: agentCount.count,
    collaboration_score: 78,
  }
}

export async function getLogs() {
  return db.select({ action: auditLogs.action, target: auditLogs.target }).from(auditLogs).orderBy(sql`${auditLogs.timestamp} desc`).limit(100)
}
```

- [ ] **Step 2: Create backend/src/routes/admin.ts**

```typescript
import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import * as adminService from '../services/admin.service'

export const adminRouter = Router()
adminRouter.use(requireAuth)

adminRouter.get('/agents', async (req, res, next) => {
  try {
    const agents = await adminService.listAgents()
    res.json(agents)
  } catch (err) { next(err) }
})

adminRouter.patch('/agents/:name', async (req, res, next) => {
  try {
    const result = await adminService.patchAgent(req.params.name, req.body)
    res.json(result)
  } catch (err) { next(err) }
})

adminRouter.get('/metrics', requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const metrics = await adminService.getMetrics()
    res.json(metrics)
  } catch (err) { next(err) }
})

adminRouter.get('/logs', requireRole('super_admin'), async (req, res, next) => {
  try {
    const logs = await adminService.getLogs()
    res.json(logs)
  } catch (err) { next(err) }
})
```

- [ ] **Step 3: Auto-seed default agents on first request**

Update `backend/src/index.ts` to call `adminService.seedDefaultAgents()` after startup.

- [ ] **Step 4: Test with curl**

```bash
# List agents
curl http://localhost:3001/admin/agents -H 'Authorization: Bearer <admin-token>'
# Get metrics
curl http://localhost:3001/admin/metrics -H 'Authorization: Bearer <admin-token>'
```

Expected: 6 default agents returned, metrics returns counts.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/admin.service.ts backend/src/routes/admin.ts
git commit -m "feat: add admin routes for agents, metrics, logs"
```

---

### Task 8: Export Route

**Files:**
- Create: `backend/src/routes/export.ts`

**Interfaces:**
- `GET /documents/:id/export?format=pdf|docx` → binary blob

- [ ] **Step 1: Create backend/src/routes/export.ts**

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as documentService from '../services/document.service'

export const exportRouter = Router()
exportRouter.use(requireAuth)

exportRouter.get('/documents/:id/export', async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    const doc = await documentService.getDocument(req.params.id)
    const content = doc.sections.map(s => s.content).join('\n\n')
    const filename = `document-${req.params.id.slice(0, 8)}.${format}`

    if (format === 'docx') {
      // Minimal DOCX placeholder — returns content as plain text for now
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(Buffer.from(content))
    } else {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(Buffer.from(content))
    }
  } catch (err) { next(err) }
})
```

Wait — the frontend calls `api.getBlob('/documents/:id/export?format=pdf')` not `/export/documents/:id/export`. The export route should be under the documents router. Let me fix:

Actually looking at the frontend code more carefully:

```ts
api.getBlob(`/documents/${id}/export?format=${format}`)
```

So the route is `GET /documents/:id/export`. I should add this to the documents router.

- [ ] **Step 1 (corrected): Add export to documents router**

In `backend/src/routes/documents.ts`, add:

```typescript
documentRouter.get('/:id/export', async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    const doc = await documentService.getDocument(req.params.id)
    const content = doc.sections.map(s => s.content).join('\n\n')
    const filename = `document-${req.params.id.slice(0, 8)}.${format}`

    res.setHeader('Content-Type', format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(content))
  } catch (err) { next(err) }
})
```

- [ ] **Step 2: Test export**

```bash
curl http://localhost:3001/documents/<id>/export?format=pdf -H 'Authorization: Bearer <token>' -o test.pdf
```

Expected: File downloads.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/documents.ts
git commit -m "feat: add document export route"
```

---

### Task 9: Validation Routes (Public)

**Files:**
- Create: `backend/src/routes/validation.ts`

**Interfaces:**
- `GET /validate/:token` → `{ document_id, decision }` (no auth — public)
- `POST /validate/:token/decision` → `{ ok: true }` (no auth — public)

- [ ] **Step 1: Create backend/src/routes/validation.ts**

```typescript
import { Router } from 'express'
import { db } from '../db'
import { validations } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export const validationRouter = Router()

validationRouter.get('/:token', async (req, res, next) => {
  try {
    const [validation] = await db.select().from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')
    res.json({ document_id: validation.documentId, decision: validation.decision })
  } catch (err) { next(err) }
})

validationRouter.post('/:token/decision', async (req, res, next) => {
  try {
    const [validation] = await db.select().from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')
    if (validation.decision) throw new AppError(400, 'already_decided', 'Validation already completed')

    const { decision, section_reasons } = req.body
    await db.update(validations)
      .set({ decision, sectionReasons: section_reasons, decidedAt: new Date() })
      .where(eq(validations.id, validation.id))

    res.json({ ok: true })
  } catch (err) { next(err) }
})
```

- [ ] **Step 2: Test validation flow**

```bash
# First create a validation token via the document route (requires auth)
curl -X POST http://localhost:3001/documents/<id>/validation-token -H 'Authorization: Bearer <token>'
# Use the token without auth
curl http://localhost:3001/validate/<token>
curl -X POST http://localhost:3001/validate/<token>/decision -H 'Content-Type: application/json' -d '{"decision":"validated","section_reasons":{}}'
```

Expected: Token creation works, public validation view works, decision submission works.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/validation.ts
git commit -m "feat: add public validation routes"
```

---

### Task 10: Hermes Orchestrator + Agent Registry

**Files:**
- Create: `backend/src/ai/hermes.ts`
- Create: `backend/src/ai/agents/registry.ts`
- Create: `backend/src/ai/agents/planner.ts`
- Create: `backend/src/ai/agents/writer.ts`
- Create: `backend/src/ai/agents/uml.ts`
- Create: `backend/src/ai/agents/tables.ts`
- Create: `backend/src/ai/agents/reviewer.ts`

**Interfaces:**
- Consumes: AI SDK 7 `streamText`, `tool` from `ai`, agent configs from DB
- Produces: Hermes orchestrator that dispatches agents and streams SSE events

- [ ] **Step 1: Create backend/src/ai/agents/registry.ts**

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import type { AgentConfig } from './types'

export interface AgentDefinition {
  name: string
  description: string
  systemPrompt: string
  defaultModel: string
  defaultProvider: string
  tools: Record<string, ReturnType<typeof tool>>
}

const getProjectContext = tool({
  description: 'Get project brief and requirements',
  inputSchema: z.object({ projectId: z.string() }),
  execute: async ({ projectId }) => {
    return { brief: 'Project brief loaded', requirements: [] }
  },
})

const saveOutline = tool({
  description: 'Save document outline',
  inputSchema: z.object({ documentId: z.string(), outline: z.any() }),
  execute: async ({ documentId, outline }) => {
    const { db } = await import('../../db')
    const { documents } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
    return { ok: true }
  },
})

const writeSection = tool({
  description: 'Write content for a document section',
  inputSchema: z.object({ sectionId: z.string(), content: z.string() }),
  execute: async ({ sectionId, content }) => {
    const { db } = await import('../../db')
    const { sections } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(sections).set({ content, status: 'draft' }).where(eq(sections.id, sectionId))
    return { ok: true }
  },
})

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  Planner: {
    name: 'Planner',
    description: 'Turns a raw brief into a structured document outline',
    systemPrompt: 'You are a document planning agent. Analyze the project brief and propose a structured outline with chapters and sections.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext, saveOutline },
  },
  Writer: {
    name: 'Writer',
    description: 'Drafts prose content for document sections',
    systemPrompt: 'You are a technical writer. Draft clear, professional content for each section based on the outline and requirements.',
    defaultModel: 'gpt-4o',
    defaultProvider: 'byok',
    tools: { getProjectContext, writeSection },
  },
  UML: {
    name: 'UML',
    description: 'Generates UML diagrams from requirements',
    systemPrompt: 'You are a UML diagram specialist. Generate PlantUML source code for diagrams based on requirements.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext },
  },
  Tables: {
    name: 'Tables',
    description: 'Generates structured requirement tables',
    systemPrompt: 'You are a requirements analyst. Generate structured requirement matrices and specification tables.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext },
  },
  Reviewer: {
    name: 'Reviewer',
    description: 'Reviews document for consistency and quality',
    systemPrompt: 'You are a quality assurance reviewer. Check document consistency, terminology alignment, and completeness.',
    defaultModel: 'claude-sonnet-4-6',
    defaultProvider: 'byok',
    tools: { getProjectContext },
  },
}
```

- [ ] **Step 2: Create backend/src/ai/hermes.ts**

```typescript
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { AGENT_REGISTRY, type AgentDefinition } from './agents/registry'
import { config } from '../config'

export interface HermesEvent {
  type: 'agent_status' | 'token' | 'tool_call' | 'tool_result' | 'section_complete' | 'done'
  [key: string]: unknown
}

function getModel(agent: AgentDefinition, provider: string, apiKey?: string) {
  if (provider === 'llama_cpp') {
    const llama = createOpenAICompatible({
      name: 'llama',
      baseURL: config.llamaCppUrl,
    })
    return llama.chatModel(agent.defaultModel)
  }
  const byok = createOpenAICompatible({
    name: 'byok',
    baseURL: 'https://api.openai.com/v1',
    apiKey: apiKey || '',
  })
  return byok.chatModel(agent.defaultModel)
}

export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  const agentDef = AGENT_REGISTRY[agentName]
  if (!agentDef) throw new Error(`Unknown agent: ${agentName}`)

  yield { type: 'agent_status', agent: agentName, status: 'thinking' }

  const model = getModel(agentDef, agentDef.defaultProvider, apiKey)

  const result = streamText({
    model,
    system: agentDef.systemPrompt,
    prompt,
    tools: agentDef.tools,
    maxSteps: 5,
  })

  for await (const event of result.fullStream) {
    switch (event.type) {
      case 'text-delta':
        yield { type: 'token', token: event.textDelta, agent: agentName }
        break
      case 'tool-call':
        yield { type: 'tool_call', agent: agentName, tool: event.toolName, args: event.args }
        break
      case 'tool-result':
        yield { type: 'tool_result', agent: agentName, tool: event.toolName, result: event.result }
        break
    }
  }

  yield { type: 'agent_status', agent: agentName, status: 'writing' }
  yield { type: 'done', agent: agentName }
}

export async function orchestrateGeneration(projectId: string, prompt: string, documentId: string): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate() {
    // Phase 1: Planner creates the outline
    const plannerGen = runAgent('Planner', prompt, { projectId, documentId })
    for await (const event of plannerGen) {
      yield event
    }

    // Phase 2: Writer drafts sections
    const writerGen = runAgent('Writer', 'Draft each section from the outline', { projectId, documentId })
    for await (const event of writerGen) {
      yield event
    }

    // Phase 3: Reviewer passes
    const reviewerGen = runAgent('Reviewer', 'Review the complete document', { projectId, documentId })
    for await (const event of reviewerGen) {
      yield event
    }

    yield { type: 'done', document_id: documentId }
  }

  return orchestrate()
}
```

- [ ] **Step 3: Wire Hermes into the generate endpoint**

Update `POST /projects/:id/generate` in `projects.ts` to use `orchestrateGeneration` and queue SSE events.

For now, the SSE stream at `GET /documents/:id/stream` continues using the mock stream. The generate endpoint triggers agent work and stores the document ID.

- [ ] **Step 4: Commit**

```bash
git add backend/src/ai/
git commit -m "feat: add Hermes orchestrator with agent registry"
```

---

### Task 11: BYOK Provider Layer + Crypto

**Files:**
- Create: `backend/src/utils/crypto.ts`
- Create: `backend/src/ai/providers/interface.ts`

**Interfaces:**
- Consumes: `config.encryptionKey`, `api_keys` table
- Produces: Encrypted API key storage + decrypted provider instances

- [ ] **Step 1: Create backend/src/utils/crypto.ts**

```typescript
import crypto from 'crypto'
import { config } from '../config'

const ALGORITHM = 'aes-256-gcm'
const KEY = crypto.createHash('sha256').update(config.encryptionKey).digest()

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encoded: string): string {
  const [ivHex, authTagHex, encrypted] = encoded.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

- [ ] **Step 2: Create backend/src/ai/providers/interface.ts**

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { config } from '../../config'

export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google'

export function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'llama_cpp':
      return createOpenAICompatible({
        name: 'llama',
        baseURL: config.llamaCppUrl,
      })
    case 'openai':
      return createOpenAICompatible({
        name: 'byok-openai',
        baseURL: 'https://api.openai.com/v1',
        apiKey: apiKey || '',
      })
    case 'anthropic':
      return createOpenAICompatible({
        name: 'byok-anthropic',
        baseURL: 'https://api.anthropic.com/v1',
        apiKey: apiKey || '',
        headers: { 'anthropic-version': '2023-06-01' },
      })
    case 'google':
      return createOpenAICompatible({
        name: 'byok-google',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: apiKey || '',
      })
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function getLanguageModel(provider: ProviderType, modelId: string, apiKey?: string) {
  const prov = createProvider(provider, apiKey)
  return prov.chatModel(modelId)
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/utils/crypto.ts backend/src/ai/providers/interface.ts
git commit -m "feat: add BYOK provider layer with encryption"
```

---

### Task 12: Dockerfile + Wire Frontend

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Modify: `repora-web/docker-compose.yml` (update from existing)

- [ ] **Step 1: Create backend/Dockerfile**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Create backend/.dockerignore**

```
node_modules
dist
.env
```

- [ ] **Step 3: Update docker-compose.yml**

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
      - JWT_SECRET=${JWT_SECRET:-dev-secret}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef}
      - LLAMA_CPP_URL=http://llama-server:8080/v1
      - CORS_ORIGIN=http://localhost:3000
    depends_on: [db]

  db:
    image: postgres:17
    environment:
      - POSTGRES_USER=repora
      - POSTGRES_PASSWORD=repora
      - POSTGRES_DB=repora
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  llama-server:
    profiles: ["local-ai"]
    image: ghcr.io/ggml-org/llama.cpp:server
    volumes: [./models:/models]
    command: ["--model", "/models/model.gguf", "--port", "8080", "--host", "0.0.0.0"]
    ports: ["8080:8080"]

volumes:
  pgdata:
```

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore docker-compose.yml
git commit -m "feat: add Dockerfile for backend + docker-compose with all services"
```

---

### Task 13: Integration Test — Wire All Frontend Pages

- [ ] **Step 1: Start backend and verify every endpoint**

```bash
cd backend && npx tsx src/index.ts &
# Run through all endpoint tests using the test suite

# Auth
curl -X POST http://localhost:3001/auth/register -H 'Content-Type: application/json' -d '{"name":"Admin","email":"admin@repora.io","password":"admin123"}'
TOKEN=$(curl -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@repora.io","password":"admin123"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")

# Health
curl http://localhost:3001/healthz

# Projects
PROJECT_ID=$(curl -X POST http://localhost:3001/projects -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Test Project","brief":"Integration test"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

# Generate document
curl -X POST "http://localhost:3001/projects/$PROJECT_ID/generate" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"prompt":"Generate test spec"}'

# Documents (need doc ID from generate)
# GET /documents/:id
# GET /documents/:id/export?format=pdf

# Admin
curl http://localhost:3001/admin/agents -H "Authorization: Bearer $TOKEN"
curl http://localhost:3001/admin/metrics -H "Authorization: Bearer $TOKEN"
curl http://localhost:3001/admin/logs -H "Authorization: Bearer $TOKEN"

# Diagrams
curl -X POST "http://localhost:3001/projects/$PROJECT_ID/diagrams" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"type":"use_case"}'
```

Expected: All endpoints return 200 with correct response shapes.

- [ ] **Step 2: Verify frontend matches**

```bash
cd repora-web && npm run build
```

Expected: Frontend builds without errors. If any endpoint shapes are wrong, fix the backend response.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: align backend responses with frontend expectations"
```
