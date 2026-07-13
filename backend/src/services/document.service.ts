import { db, schema } from '../db'
import { versionHistory } from '../db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { AppError } from '../middleware/error'

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

export async function listDocuments(userId: string, role?: string, filters?: { status?: string; search?: string }) {
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
  }))

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    docs = docs.filter((d) => {
      const outline = d.outline as Record<string, unknown> | null
      const title = (outline?.title as string) ?? ''
      return title.toLowerCase().includes(q)
    })
  }

  return docs
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

export async function createValidationToken(documentId: string) {
  const [doc] = await db.select({ id: schema.documents.id }).from(schema.documents)
    .where(eq(schema.documents.id, documentId)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  const token = crypto.randomBytes(32).toString('hex')
  await db.insert(schema.validations).values({ documentId, validatorToken: token })
  return token
}
