import { db } from '../db'
import { diagrams } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import { deflateSync } from 'zlib'

function encodePlantUML(source: string): string {
  let cleaned = source
    .replace(/@startuml\s*\n?/g, '')
    .replace(/@enduml\s*\n?/g, '')
  const deflated = deflateSync(Buffer.from(cleaned, 'utf-8'))
  return encode64(deflated)
}

function encode64(data: Buffer): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
  let result = ''
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i]
    const b2 = data[i + 1] ?? 0
    const b3 = data[i + 2] ?? 0
    result += chars[b1 >> 2]
    result += chars[((b1 & 3) << 4) | (b2 >> 4)]
    result += i + 1 < data.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : ''
    result += i + 2 < data.length ? chars[b3 & 63] : ''
  }
  return result
}

export async function createDiagram(projectId: string, type: string, source?: string) {
  const plantumlSource = source || ''
  const encodedSource = plantumlSource ? encodePlantUML(plantumlSource) : ''
  const renderedUrl = plantumlSource
    ? `https://www.plantuml.com/plantuml/svg/${encodedSource}`
    : ''

  const [diagram] = await db.insert(diagrams).values({
    projectId,
    type,
    plantumlSource,
    renderedUrl,
  }).returning()

  return {
    id: diagram.id,
    type: diagram.type,
    plantuml_source: plantumlSource,
    rendered_url: renderedUrl,
  }
}

export async function getDiagram(id: string) {
  const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id)).limit(1)
  if (!diagram) throw new AppError(404, 'not_found', 'Diagram not found')

  const plantumlSource = diagram.plantumlSource || ''
  const encodedSource = plantumlSource ? encodePlantUML(plantumlSource) : ''
  const renderedUrl = plantumlSource
    ? `https://www.plantuml.com/plantuml/svg/${encodedSource}`
    : ''

  return {
    id: diagram.id,
    type: diagram.type,
    plantuml_source: plantumlSource,
    rendered_url: renderedUrl,
  }
}
