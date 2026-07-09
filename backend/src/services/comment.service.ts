import { db } from '../db'
import { comments } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function listComments(documentId: string) {
  return db.select().from(comments).where(eq(comments.sectionId, documentId))
}

export async function addComment(sectionId: string, authorId: string, text: string) {
  const [comment] = await db.insert(comments).values({ sectionId, authorId, text }).returning()
  return comment
}

export async function updateComment(id: string, data: { text?: string; resolved?: boolean }) {
  const [comment] = await db.update(comments).set(data).where(eq(comments.id, id)).returning()
  if (!comment) throw new AppError(404, 'not_found', 'Comment not found')
  return comment
}

export async function deleteComment(id: string) {
  const [comment] = await db.delete(comments).where(eq(comments.id, id)).returning({ id: comments.id })
  if (!comment) throw new AppError(404, 'not_found', 'Comment not found')
  return comment
}
