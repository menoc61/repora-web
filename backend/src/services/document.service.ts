import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
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

export async function createValidationToken(documentId: string) {
  const [doc] = await db.select({ id: schema.documents.id }).from(schema.documents)
    .where(eq(schema.documents.id, documentId)).limit(1)
  if (!doc) throw new AppError(404, 'not_found', 'Document not found')

  const token = crypto.randomBytes(32).toString('hex')
  await db.insert(schema.validations).values({ documentId, validatorToken: token })
  return token
}
