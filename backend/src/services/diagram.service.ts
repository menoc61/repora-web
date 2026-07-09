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
