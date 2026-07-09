import { db } from '../db'
import { requirements } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function listRequirements(projectId: string) {
  return db.select().from(requirements).where(eq(requirements.projectId, projectId))
}

export async function createRequirement(projectId: string, data: { type: string; text: string; sourceActor?: string }) {
  const [requirement] = await db.insert(requirements).values({
    projectId,
    type: data.type,
    text: data.text,
    sourceActor: data.sourceActor ?? null,
  }).returning()
  return requirement
}

export async function updateRequirement(id: string, data: { type?: string; text?: string; sourceActor?: string }) {
  const [requirement] = await db.update(requirements).set(data).where(eq(requirements.id, id)).returning()
  if (!requirement) throw new AppError(404, 'not_found', 'Requirement not found')
  return requirement
}

export async function deleteRequirement(id: string) {
  const [requirement] = await db.delete(requirements).where(eq(requirements.id, id)).returning({ id: requirements.id })
  if (!requirement) throw new AppError(404, 'not_found', 'Requirement not found')
  return requirement
}
