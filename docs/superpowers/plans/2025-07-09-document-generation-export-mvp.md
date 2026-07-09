# Document Generation + Export MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End-to-end working document generation (Planner → outline → sections → Writer → Reviewer) with professional PDF/DOCX/MD export, all agents using one configurable Ollama model.

**Architecture:** Ollama serves a local LLM via OpenAI-compatible endpoint at `http://localhost:11434/v1`. Backend discovers models from Ollama, user picks one in Settings. All agents (Planner, Writer, Reviewer) use that same model. Document generation flows through 4 stages: Planner creates outline JSON, outline processor creates DB sections, Writer fills each section, Reviewer does QC.

**Tech Stack:** TypeScript, Express 5, AI SDK v7 with `@ai-sdk/openai-compatible`, Drizzle ORM + PostgreSQL, `pdf-lib`, `docx`

## Global Constraints

- Single model for all agents (no per-agent model config for MVP)
- By default, docker compose up should work end-to-end just by running `docker compose up`
- By default, generate + export should work
- No placeholders in code
- Frequent commits per task

---

### Task 1: Ollama model discovery + provider wiring

**Files:**
- Create: `backend/src/routes/models.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/src/config.ts`
- Modify: `backend/src/ai/providers/interface.ts`

**Interfaces:**
- Produces: `GET /models` → `string[]` (list of model names from Ollama `/api/tags`)
- Produces: `ProviderType` includes `'ollama'`
- Produces: `config.ollamaUrl` (default `http://localhost:11434/v1`)
- Consumes: (none, first task)

- [ ] **Step 1: Add `ollamaUrl` to config**

Edit `backend/src/config.ts` — add the `ollamaUrl` field:

```ts
import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgres://repora:repora@localhost:5432/repora',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  llamaCppUrl: process.env.LLAMA_CPP_URL || 'http://localhost:8080/v1',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}
```

- [ ] **Step 2: Create models route**

Create `backend/src/routes/models.ts`:

```ts
import { Router } from 'express'
import { config } from '../config'

export const modelsRouter = Router()

modelsRouter.get('/', async (_req, res, next) => {
  try {
    const response = await fetch(`${config.ollamaUrl.replace(/\/v1$/, '')}/api/tags`)
    if (!response.ok) {
      res.json([])
      return
    }
    const data = (await response.json()) as { models?: Array<{ name: string }> }
    const names = (data.models || []).map((m) => m.name)
    res.json(names)
  } catch {
    res.json([])
  }
})
```

- [ ] **Step 3: Mount models router in index.ts**

Edit `backend/src/index.ts` — find the existing router mounts and add:

```ts
import { modelsRouter } from './routes/models'
// ... after other app.use(...)
app.use('/models', modelsRouter)
```

- [ ] **Step 4: Add 'ollama' to ProviderType**

Edit `backend/src/ai/providers/interface.ts`:

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { config } from '../../config'

export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'openrouter' | 'byok'

function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'llama_cpp':
      return createOpenAICompatible({ name: 'llama', baseURL: config.llamaCppUrl })
    case 'ollama':
      return createOpenAICompatible({ name: 'ollama', baseURL: config.ollamaUrl })
    case 'openai':
      return createOpenAICompatible({ name: 'byok-openai', baseURL: 'https://api.openai.com/v1', apiKey: apiKey || '' })
    case 'anthropic':
      return createOpenAICompatible({ name: 'byok-anthropic', baseURL: 'https://api.anthropic.com/v1', apiKey: apiKey || '', headers: { 'anthropic-version': '2023-06-01' } })
    case 'google':
      return createOpenAICompatible({ name: 'byok-google', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: apiKey || '' })
    case 'openrouter':
      return createOpenAICompatible({ name: 'byok-openrouter', baseURL: 'https://openrouter.ai/api/v1', apiKey: apiKey || '' })
    default:
      return createOpenAICompatible({ name: 'byok', baseURL: config.ollamaUrl })
  }
}

export function getLanguageModel(provider: ProviderType, modelId: string, apiKey?: string) {
  const prov = createProvider(provider, apiKey)
  return prov.chatModel(modelId)
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/config.ts backend/src/routes/models.ts backend/src/index.ts backend/src/ai/providers/interface.ts
git commit -m "feat: add Ollama model discovery endpoint and provider type"
```

---

### Task 2: Outline processor — create sections from Planner output

**Files:**
- Modify: `backend/src/ai/hermes.ts`
- Modify: `backend/src/services/document.service.ts`
- Modify: `backend/src/ai/agents/registry.ts`

**Interfaces:**
- Produces: `createSectionsFromOutline(documentId: string, outline: OutlineJson): Promise<Section[]>` in document.service.ts
- Consumes: `documents.outline` column (jsonb in PostgreSQL)

- [ ] **Step 1: Add `createSectionsFromOutline` to document service**

Edit `backend/src/services/document.service.ts` — add after existing functions:

```ts
import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { AppError } from '../middleware/error'

interface OutlineSection { title: string; order: number }
interface OutlineChapter { title: string; sections: OutlineSection[] }
export interface OutlineJson { title?: string; chapters: OutlineChapter[] }

export async function getDocument(id: string) {
  const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  const sectionsList = await db.select().from(schema.sections)
    .where(eq(schema.sections.documentId, id))
    .orderBy(schema.sections.order)

  return { ...doc, sections: sectionsList }
}

export async function createSectionsFromOutline(documentId: string, outline: OutlineJson) {
  await db.delete(schema.sections).where(eq(schema.sections.documentId, documentId))

  let order = 0
  const created: Array<{ id: string; title: string; order: number }> = []

  for (const chapter of outline.chapters) {
    for (const section of chapter.sections) {
      order++
      const [row] = await db.insert(schema.sections).values({
        documentId,
        order,
        title: `${chapter.title} — ${section.title}`,
        content: '',
        status: 'draft',
      }).returning({ id: schema.sections.id, title: schema.sections.title, order: schema.sections.order })
      created.push({ id: row.id, title: row.title, order: row.order })
    }
  }

  return created
}

export async function createValidationToken(documentId: string) {
  const [doc] = await db.select({ id: schema.documents.id }).from(schema.documents)
    .where(eq(schema.documents.id, documentId)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  const token = crypto.randomBytes(32).toString('hex')
  await db.insert(schema.validations).values({ documentId, validatorToken: token })
  return token
}
```

- [ ] **Step 2: Add outline-parsing helper to hermes.ts**

Edit `backend/src/ai/hermes.ts` — add the outline processor function before `orchestrateGeneration`:

```ts
import { createSectionsFromOutline, type OutlineJson } from '../services/document.service'
import { db } from '../db'
import { documents } from '../db/schema'
import { eq } from 'drizzle-orm'

async function processOutline(documentId: string): Promise<Array<{ id: string; title: string }>> {
  const [doc] = await db.select({ outline: documents.outline })
    .from(documents).where(eq(documents.id, documentId)).limit(1)

  if (!doc?.outline) {
    return []
  }

  const outline = doc.outline as OutlineJson

  if (!outline.chapters || !Array.isArray(outline.chapters)) {
    return []
  }

  const sections = await createSectionsFromOutline(documentId, outline)
  return sections.map((s) => ({ id: s.id, title: s.title }))
}
```

- [ ] **Step 3: Update `orchestrateGeneration` to call outline processor**

Edit `backend/src/ai/hermes.ts` — replace the existing `orchestrateGeneration` function:

```ts
export async function orchestrateGeneration(projectId: string, prompt: string, documentId: string): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate(): AsyncGenerator<HermesEvent> {
    try {
      yield { type: 'agent_status', agent: 'Planner', status: 'thinking' }
      const plannerGen = runAgent('Planner', prompt, { projectId, documentId })
      for await (const event of plannerGen) {
        yield event
      }
      yield { type: 'agent_status', agent: 'Planner', status: 'done' }

      const sections = await processOutline(documentId)
      const sectionCount = sections.length
      yield { type: 'agent_status', agent: 'System', status: `outline_processed`, sections_created: sectionCount }

      if (sectionCount > 0) {
        yield { type: 'agent_status', agent: 'Writer', status: 'thinking' }
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          yield {
            type: 'agent_status',
            agent: 'Writer',
            status: 'writing',
            section: `${i + 1}/${sectionCount}`,
            section_title: section.title,
          }

          const sectionPrompt = `Write the section titled "${section.title}" (sectionId: "${section.id}") for document ${documentId}. Call the writeSection tool with sectionId="${section.id}" and your prose content. This is part of a professional specification document. Write clear, detailed, professional prose.`
          const writerGen = runAgent('Writer', sectionPrompt, { projectId, documentId, sectionId: section.id })
          for await (const event of writerGen) {
            yield event
          }

          yield { type: 'section_complete', section_id: section.id, title: section.title }
        }
        yield { type: 'agent_status', agent: 'Writer', status: 'done' }
      }

      yield { type: 'agent_status', agent: 'Reviewer', status: 'thinking' }
      const reviewerGen = runAgent('Reviewer', 'Review the complete document for consistency, completeness, terminology alignment, and quality. Note any issues.', { projectId, documentId })
      for await (const event of reviewerGen) {
        yield event
      }
      yield { type: 'agent_status', agent: 'Reviewer', status: 'done' }

      yield { type: 'done' as const, document_id: documentId }
    } finally {
      clearActiveGeneration(documentId)
    }
  }

  return orchestrate()
}
```

- [ ] **Step 4: Update `runAgent` context type to support `sectionId`**

Edit `backend/src/ai/hermes.ts` — update the `runAgent` function signature to accept `sectionId` in context:

```ts
export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string; sectionId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  // ... rest stays the same
```

- [ ] **Step 5: Update the `saveOutline` tool in registry to handle the outline format**

Edit `backend/src/ai/agents/registry.ts` — the `saveOutline` tool already saves outline to DB. No change needed for the tool itself. But update Planner's system prompt to instruct it to produce the right outline format:

```ts
Planner: {
  name: 'Planner',
  description: 'Turns a raw brief into a structured document outline',
  systemPrompt: `You are a document planning agent. Analyze the project brief and propose a structured outline with chapters and sections.

You MUST save your outline using the saveOutline tool. The outline MUST follow this exact JSON structure:
{
  "title": "Document Title",
  "chapters": [
    {
      "title": "Chapter Name",
      "sections": [
        { "title": "Section Title", "order": 1 },
        { "title": "Section Title", "order": 2 }
      ]
    }
  ]
}

A good specification document typically has these chapters:
1. Introduction (Context, Objectives, Scope)
2. Functional Requirements (Core features, user stories)
3. Non-Functional Requirements (Performance, Security, Availability)
4. Architecture (System overview, components, data model)
5. Implementation Plan (Phases, timeline)
6. References and Glossary

After creating the outline, save it using the saveOutline tool.`,
  defaultModel: 'llama3.1:8b',
  defaultProvider: 'ollama',
  tools: { getProjectContext, saveOutline },
},
```

- [ ] **Step 6: Update Writer's system prompt for section-specific writing**

Edit `backend/src/ai/agents/registry.ts` — update Writer:

```ts
Writer: {
  name: 'Writer',
  description: 'Drafts prose content for document sections',
  systemPrompt: `You are a professional technical writer. When given a section title and context, draft clear, detailed, professional content for that section.

You MUST save your completed content using the writeSection tool with the sectionId and your written content.

Write in a professional, clear style suitable for a technical specification document ("cahier des charges"). Use proper paragraphs, structured lists where appropriate, and maintain consistency in terminology.`,
  defaultModel: 'llama3.1:8b',
  defaultProvider: 'ollama',
  tools: { getProjectContext, writeSection },
},
```

- [ ] **Step 7: Update all agent registrations to default to 'ollama'**

Edit `backend/src/ai/agents/registry.ts` — change all agents to use `defaultProvider: 'ollama'` and a generic model:

```ts
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  Planner: {
    // ... updated above
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
  },
  Writer: {
    // ... updated above
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
  },
  UML: {
    // ... keep as-is but change provider
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
  },
  Tables: {
    // ... keep as-is but change provider
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
  },
  Reviewer: {
    // ... keep as-is but change provider
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
  },
}
```

- [ ] **Step 8: Update admin service default agents to use ollama**

Edit `backend/src/services/admin.service.ts` — change DEFAULT_AGENTS provider to 'ollama':

```ts
const DEFAULT_AGENTS = [
  { agentName: 'Hermes', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Planner', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Writer', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'UML', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Tables', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Reviewer', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
]
```

- [ ] **Step 9: Commit**

```bash
git add backend/src/ai/hermes.ts backend/src/services/document.service.ts backend/src/ai/agents/registry.ts backend/src/services/admin.service.ts
git commit -m "feat: outline processor creates sections, all agents use single ollama model"
```

---

### Task 3: Professional export service (PDF, DOCX, MD)

**Files:**
- Create: `backend/src/services/export.service.ts`
- Modify: `backend/src/routes/documents.ts`

**Interfaces:**
- Produces: `exportDocument(documentId: string, format: 'pdf' | 'docx' | 'md'): Promise<{ buffer: Buffer; mimeType: string; filename: string }>`
- Consumes: `getDocument()` from document.service.ts

- [ ] **Step 1: Install pdf-lib and docx**

```bash
npm install pdf-lib docx
```
Run in `backend/` directory.

- [ ] **Step 2: Create export service**

Create `backend/src/services/export.service.ts`:

```ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, TableOfContents } from 'docx'
import { getDocument } from './document.service'

function buildMarkdown(doc: Awaited<ReturnType<typeof getDocument>>): string {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]

  let md = ''
  md += `# ${title}\n\n`
  md += `**Date:** ${date}\n\n`
  md += `---\n\n`
  md += `## Table of Contents\n\n`
  for (const s of doc.sections) {
    md += `- [${s.title}](#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`
  }
  md += `\n---\n\n`
  for (const s of doc.sections) {
    md += `## ${s.title}\n\n`
    md += `${s.content || '*(No content)*'}\n\n`
  }
  return md
}

async function buildPdf(doc: Awaited<ReturnType<typeof getDocument>>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]
  const fontSize = 11

  function wordWrap(text: string, maxWidth: number, font: unknown): string[] {
    const f = font as { widthOfTextAtSize: (t: string, s: number) => number }
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (f.widthOfTextAtSize(test, fontSize) > maxWidth) {
        if (line) lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines
  }

  const pageWidth = 595
  const pageHeight = 842
  const margin = 60
  const maxWidth = pageWidth - margin * 2

  function drawPage(text: string, opts?: { bold?: boolean; size?: number }): void {
    // This helper will be used inline below
  }

  // Cover page
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const titleLines = wordWrap(title, maxWidth, boldFont)
  for (const line of titleLines) {
    page.drawText(line, { x: margin, y, size: 24, font: boldFont, color: rgb(0, 0, 0) })
    y -= 30
  }

  y -= 40
  page.drawText(`Date: ${date}`, { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })
  y -= 20
  page.drawText('Generated by Repora', { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })
  y -= 20
  page.drawText('v1.0', { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })

  y -= 40
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) })

  // TOC page
  page = pdfDoc.addPage([pageWidth, pageHeight])
  y = pageHeight - margin
  page.drawText('Table of Contents', { x: margin, y, size: 18, font: boldFont, color: rgb(0, 0, 0) })
  y -= 30

  for (const s of doc.sections) {
    page.drawText(s.title, { x: margin, y, size: 12, font, color: rgb(0, 0, 0.8) })
    y -= 20
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  // Section pages
  for (const s of doc.sections) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - margin

    page.drawText(s.title, { x: margin, y, size: 16, font: boldFont, color: rgb(0, 0, 0) })
    y -= 30

    const content = s.content || '*(No content)*'
    const lines = wordWrap(content, maxWidth, font)
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
      y -= 16
      if (y < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
    }
  }

  return pdfDoc.save()
}

async function buildDocx(doc: Awaited<ReturnType<typeof getDocument>>): Promise<Buffer> {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]

  const children: Paragraph[] = []

  children.push(
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 48 })], heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Date: ${date}`, size: 24, color: '#666666' })] }),
    new Paragraph({ children: [new TextRun({ text: 'Generated by Repora — v1.0', size: 24, color: '#666666' })] }),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [new TextRun({ text: 'Table of Contents', bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: doc.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n'), size: 24 })] }),
    new Paragraph({ children: [] }),
  )

  for (const s of doc.sections) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: s.title, bold: true, size: 28 })], heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
      new Paragraph({ children: [new TextRun({ text: s.content || '*(No content)*', size: 22 })] }),
      new Paragraph({ children: [] }),
    )
  }

  const wordDoc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Buffer.from(await Packer.toBuffer(wordDoc))
}

export async function exportDocument(documentId: string, format: 'pdf' | 'docx' | 'md'): Promise<{
  buffer: Buffer
  mimeType: string
  filename: string
}> {
  const doc = await getDocument(documentId)
  const shortId = documentId.slice(0, 8)

  switch (format) {
    case 'pdf': {
      const pdfBytes = await buildPdf(doc)
      return { buffer: Buffer.from(pdfBytes), mimeType: 'application/pdf', filename: `document-${shortId}.pdf` }
    }
    case 'docx': {
      const docxBuf = await buildDocx(doc)
      return { buffer: docxBuf, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename: `document-${shortId}.docx` }
    }
    case 'md': {
      const mdContent = buildMarkdown(doc)
      return { buffer: Buffer.from(mdContent, 'utf-8'), mimeType: 'text/markdown', filename: `document-${shortId}.md` }
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
```

- [ ] **Step 3: Update documents route to use export service**

Edit `backend/src/routes/documents.ts` — replace the inline export handler with:

```ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getDocument, createValidationToken } from '../services/document.service'
import { exportDocument } from '../services/export.service'
import { logAudit } from '../services/audit.service'
import { getActiveGeneration, clearActiveGeneration } from '../ai/hermes'

export const documentRouter = Router()

documentRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.get('/:id/stream', requireAuth, async (req, res, next) => {
  try {
    const generation = getActiveGeneration(req.params.id as string)
    if (!generation) {
      res.status(404).json({ error: { code: 'no_active_generation', message: 'No active generation for this document' } })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const gen = await generation
    for await (const event of gen) {
      sendEvent(event)
    }

    res.end()
  } catch (err) {
    clearActiveGeneration(req.params.id as string)
    next(err)
  }
})

documentRouter.post('/:id/validation-token', requireAuth, async (req, res, next) => {
  try {
    const token = await createValidationToken(req.params.id as string)
    await logAudit({ userId: req.user!.userId, action: 'validation.token_created', target: req.params.id as string, metadata: { token } })
    res.json({ token })
  } catch (err) { next(err) }
})

documentRouter.get('/:id/export', requireAuth, async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    if (!['pdf', 'docx', 'md'].includes(format)) {
      res.status(400).json({ error: { code: 'invalid_format', message: 'Format must be pdf, docx, or md' } })
      return
    }
    const result = await exportDocument(req.params.id as string, format as 'pdf' | 'docx' | 'md')
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.buffer)
    await logAudit({ userId: req.user!.userId, action: 'document.exported', target: req.params.id as string, metadata: { format } })
  } catch (err) { next(err) }
})
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```
Expected: exit 0, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/export.service.ts backend/src/routes/documents.ts backend/package.json
git commit -m "feat: professional export service with PDF, DOCX, and MD support"
```

---

### Task 4: End-to-end verification

**Files:** (none created)

- [ ] **Step 1: Start dependencies**

```bash
docker compose up -d db
```
Wait for PostgreSQL to be healthy.

- [ ] **Step 2: Run migrations**

```bash
cd backend
npx drizzle-kit push
```

- [ ] **Step 3: Start backend**

```bash
cd backend
npm run dev
```

- [ ] **Step 4: Test Ollama connectivity**

```bash
curl http://localhost:8000/models
```
Expected: list of Ollama model names as JSON array.

- [ ] **Step 5: Test document generation flow**

```bash
# Register
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Get token from response, then:
TOKEN="<jwt-from-response>"

# Create project
curl -s -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Specification","brief":"Build a web application for managing customer orders with inventory tracking."}'

# Generate document
curl -s -X POST http://localhost:8000/projects/<project-id>/generate \
  -H "Authorization: Bearer $TOKEN"
```
Expected: returns `{ document_id, status }`.

- [ ] **Step 6: Wait for generation, verify sections**

```bash
curl -s http://localhost:8000/documents/<document-id> \
  -H "Authorization: Bearer $TOKEN"
```
Expected: document with `sections` array containing multiple sections with titles (not just "Introduction").

Check `documents.outline` column in DB:
```bash
docker compose exec db psql -U repora -d repora -c "SELECT outline FROM documents LIMIT 1;"
```
Expected: JSON with `chapters` array.

- [ ] **Step 7: Test export**

```bash
# MD
curl -s http://localhost:8000/documents/<document-id>/export?format=md \
  -H "Authorization: Bearer $TOKEN" > test.md
# Check: test.md has cover, TOC, sections

# PDF
curl -s http://localhost:8000/documents/<document-id>/export?format=pdf \
  -H "Authorization: Bearer $TOKEN" -o test.pdf

# DOCX
curl -s http://localhost:8000/documents/<document-id>/export?format=docx \
  -H "Authorization: Bearer $TOKEN" -o test.docx
```
Expected: all three files generated with non-zero size.

- [ ] **Step 8: SSE stream test**

```bash
curl -N -s http://localhost:8000/documents/<generate-doc-id>/stream \
  -H "Authorization: Bearer $TOKEN"
```
Expected: SSE events streaming.

- [ ] **Step 9: Commit final state**

```bash
git add .
git commit -m "feat: e2e verification — document generation and export working"
```
