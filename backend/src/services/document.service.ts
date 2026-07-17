import { db, schema } from '../db'
import { logger } from '../lib/logger'
import { versionHistory } from '../db/schema'
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'
import crypto from 'crypto'
import { AppError } from '../middleware/error'
import { parseMarkdown, inlineToText, astToText } from '../utils/markdownParser'
import { deleteProjectStorage } from './s3.service'

const log = logger.child('Documents')
export interface VersionSection {
  id: string
  title: string
  content: string
  order: number
  status: string
}

export async function createVersion(
  documentId: string,
  userId: string | undefined,
  sections: VersionSection[],
  documentStatus: string | undefined,
  label?: string,
): Promise<number> {
  const [row] = await db.select({ max: sql<number>`COALESCE(MAX(${versionHistory.version}), 0)` })
    .from(versionHistory)
    .where(eq(versionHistory.documentId, documentId))
  const next = (row?.max ?? 0) + 1
  await db.insert(versionHistory).values({
    documentId,
    version: next,
    sections,
    documentStatus: documentStatus ?? null,
    createdBy: userId ?? null,
    label: label ?? null,
  })
  return next
}

export async function listVersions(documentId: string) {
  return db.select()
    .from(versionHistory)
    .where(eq(versionHistory.documentId, documentId))
    .orderBy(desc(versionHistory.version))
}

export async function getVersion(versionId: string, documentId: string) {
  const [row] = await db.select()
    .from(versionHistory)
    .where(and(eq(versionHistory.id, versionId), eq(versionHistory.documentId, documentId)))
    .limit(1)
  return row
}

export async function getVersionByNumber(documentId: string, versionNumber: number) {
  const rows = await db.select()
    .from(versionHistory)
    .where(eq(versionHistory.documentId, documentId))
    .orderBy(asc(versionHistory.createdAt))
  return rows[versionNumber - 1] ?? null
}

export async function getDocument(id: string, userId?: string, role?: string) {
  const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  // Verify project ownership unless admin/super_admin
  if (userId && role !== 'admin' && role !== 'super_admin') {
    const [project] = await db.select({ ownerId: schema.projects.ownerId })
      .from(schema.projects).where(eq(schema.projects.id, doc.projectId)).limit(1)
    if (!project || project.ownerId !== userId) {
      throw new AppError(404, 'not_found', 'Document not found')
    }
  }

  const sectionsList = await db.select().from(schema.sections)
    .where(eq(schema.sections.documentId, id))
    .orderBy(schema.sections.order)

  return { ...doc, sections: sectionsList }
}

export async function listDocuments(userId: string, role?: string, filters?: { status?: string; search?: string; tag?: string }) {
  const isSuperAdmin = role === 'super_admin' || role === 'admin'
  const conditions: ReturnType<typeof eq>[] = isSuperAdmin
    ? []
    : [eq(schema.projects.ownerId, userId)]

  if (filters?.status) {
    conditions.push(eq(schema.documents.status, filters.status))
  }

  const rows = await db.select({
    id: schema.documents.id,
    projectId: schema.documents.projectId,
    projectName: schema.projects.name,
    status: schema.documents.status,
    outline: schema.documents.outline,
    tags: schema.documents.tags,
    createdAt: schema.documents.createdAt,
    updatedAt: schema.documents.updatedAt,
    sectionCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${schema.sections} WHERE ${schema.sections.documentId} = ${schema.documents.id}), 0)`,
  }).from(schema.documents)
    .leftJoin(schema.projects, eq(schema.documents.projectId, schema.projects.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.documents.updatedAt))

  let docs = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
    sectionCount: Number(r.sectionCount),
    tags: (r.tags as string[]) ?? [],
  }))

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    docs = docs.filter((d) => {
      const outline = d.outline as Record<string, unknown> | null
      const title = (outline?.title as string) ?? ''
      return title.toLowerCase().includes(q)
    })
  }

  if (filters?.tag) {
    docs = docs.filter((d) => d.tags.includes(filters.tag!))
  }

  return docs
}

export async function renameDocument(id: string, title: string, userId?: string, role?: string) {
  const [doc] = await db.select({ projectId: schema.documents.projectId })
    .from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  if (userId && role !== 'admin' && role !== 'super_admin') {
    const [project] = await db.select({ ownerId: schema.projects.ownerId })
      .from(schema.projects).where(eq(schema.projects.id, doc.projectId)).limit(1)
    if (!project || project.ownerId !== userId) throw new AppError(404, 'not_found', 'Document not found')
  }

  const [current] = await db.select({ outline: schema.documents.outline })
    .from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  const outline = { ...(current?.outline as Record<string, unknown> | null), title } as Record<string, unknown>

  const [updated] = await db.update(schema.documents)
    .set({ outline, updatedAt: new Date() })
    .where(eq(schema.documents.id, id))
    .returning({ id: schema.documents.id })
  if (!updated) throw new AppError(404, 'not_found', 'Document not found')
  return { id }
}

export async function deleteDocument(id: string, userId?: string, role?: string) {
  const [doc] = await db.select({ projectId: schema.documents.projectId })
    .from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  if (userId && role !== 'admin' && role !== 'super_admin') {
    const [project] = await db.select({ ownerId: schema.projects.ownerId })
      .from(schema.projects).where(eq(schema.projects.id, doc.projectId)).limit(1)
    if (!project || project.ownerId !== userId) throw new AppError(404, 'not_found', 'Document not found')
  }

  const docSections = await db.select({ id: schema.sections.id })
    .from(schema.sections).where(eq(schema.sections.documentId, id))
  if (docSections.length) {
    const sectionIds = docSections.map((s) => s.id)
    await db.delete(schema.comments).where(inArray(schema.comments.sectionId, sectionIds))
  }

  await db.delete(schema.sections).where(eq(schema.sections.documentId, id))
  await db.delete(schema.versionHistory).where(eq(schema.versionHistory.documentId, id))
  await db.delete(schema.validations).where(eq(schema.validations.documentId, id))
  await db.delete(schema.diagrams).where(eq(schema.diagrams.projectId, doc.projectId))
  await db.delete(schema.requirements).where(eq(schema.requirements.projectId, doc.projectId))
  await db.delete(schema.documents).where(eq(schema.documents.id, id))
  await db.delete(schema.projects).where(eq(schema.projects.id, doc.projectId))

  // Async S3 cleanup — non-blocking, fire-and-forget
  deleteProjectStorage(doc.projectId)
    .then(() => log.info(`[S3] Cleaned up storage for project ${doc.projectId.slice(0, 8)}`))
    .catch(err => log.warn(`[S3] Storage cleanup failed:`, (err as Error).message))

  return { id }
}

export async function getDocumentByValidationToken(token: string) {
  const [validation] = await db.select().from(schema.validations)
    .where(eq(schema.validations.validatorToken, token))
    .limit(1)
  if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')

  const [doc] = await db.select().from(schema.documents)
    .where(eq(schema.documents.id, validation.documentId))
    .limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  const sectionsList = await db.select().from(schema.sections)
    .where(eq(schema.sections.documentId, doc.id))
    .orderBy(schema.sections.order)

  const outline = doc.outline as Record<string, unknown> | null

  return {
    validation: {
      id: validation.id,
      decision: validation.decision,
      decidedAt: validation.decidedAt?.toISOString() ?? null,
    },
    document: {
      id: doc.id,
      title: (outline?.title as string) ?? 'Untitled',
      status: doc.status,
      sections: sectionsList.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        status: s.status,
      })),
    },
  }
}

export async function createValidationToken(documentId: string, userId?: string, role?: string) {
  const [doc] = await db
    .select({ id: schema.documents.id, projectId: schema.documents.projectId })
    .from(schema.documents)
    .where(eq(schema.documents.id, documentId))
    .limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  // Enforce ownership: only the project owner (or an admin) may mint a
  // validation token. Without this, any authenticated user could generate a
  // validator link for a document they don't own.
  const isAdmin = role === 'admin' || role === 'super_admin'
  if (userId && !isAdmin) {
    const [project] = await db
      .select({ ownerId: schema.projects.ownerId })
      .from(schema.projects)
      .where(eq(schema.projects.id, doc.projectId))
      .limit(1)
    if (!project || project.ownerId !== userId) {
      throw new AppError(404, 'not_found', 'Document not found')
    }
  }

  const token = crypto.randomBytes(32).toString('hex')
  await db.insert(schema.validations).values({ documentId, validatorToken: token })
  return token
}

/**
 * Split a full markdown document (as produced by the editor autosave) into
 * sections. Level-2 (`##`) headings start a new section; everything else
 * (paragraphs, lists, tables, deeper headings) becomes that section's body.
 */
function markdownToSections(md: string): Array<{ title: string; content: string }> {
  const nodes = parseMarkdown(md)
  const sections: Array<{ title: string; content: string }> = []
  let current: { title: string; content: string } | null = null
  let intro = ''
  for (const node of nodes) {
    if (node.type === 'heading' && node.level === 2) {
      if (current) sections.push(current)
      current = { title: inlineToText(node.children).trim() || 'Section', content: '' }
    } else if (current) {
      current.content += astToText([node]).trim() + '\n\n'
    } else {
      intro += astToText([node]).trim() + '\n\n'
    }
  }
  if (current) {
    current.content = current.content.trim()
    sections.push(current)
  } else if (intro.trim()) {
    sections.push({ title: 'Introduction', content: intro.trim() })
  }
  return sections
}

/**
 * Reconcile a markdown document into the structured sections for a document.
 * Existing sections are matched by position so their ids — and any linked
 * comments/diagrams — are preserved; parsed sections beyond the existing set
 * are inserted, and existing sections no longer present are removed.
 */
export async function reconcileSectionsFromMarkdown(documentId: string, markdown: string): Promise<void> {
  const parsed = markdownToSections(markdown)
  const existing = await db
    .select({ id: schema.sections.id, title: schema.sections.title, order: schema.sections.order })
    .from(schema.sections)
    .where(eq(schema.sections.documentId, documentId))
    .orderBy(schema.sections.order)

  const kept = new Set<string>()
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i]
    const ex = existing[i]
    if (ex) {
      await db.update(schema.sections)
        .set({ order: i, title: p.title, content: p.content, updatedAt: new Date() })
        .where(eq(schema.sections.id, ex.id))
      kept.add(ex.id)
    } else {
      await db.insert(schema.sections).values({
        documentId,
        order: i,
        title: p.title,
        content: p.content,
        status: 'draft',
      })
    }
  }
  for (const ex of existing) {
    if (!kept.has(ex.id)) {
      await db.delete(schema.sections).where(eq(schema.sections.id, ex.id))
    }
  }
}
