import { db, schema } from '../db'
import { eq, and, desc, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { AppError } from '../middleware/error'

export async function getDocument(id: string) {
  const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

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
