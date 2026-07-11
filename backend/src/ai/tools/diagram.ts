/**
 * Diagram generation tools for the UML agent.
 *
 * The saveDiagram tool persists PlantUML source code to the diagrams table.
 * DB imports are lazy-loaded inside execute to avoid circular dependencies.
 *
 * @module ai/tools/diagram
 */

import { tool } from 'ai'
import { z } from 'zod'
import { deflateSync } from 'zlib'
import { config } from '../../config'

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

export const saveDiagram = tool({
  description: 'Save a PlantUML diagram source for the project. The type must be one of: use_case, sequence, activity, class, deployment.',
  inputSchema: z.object({
    projectId: z.string().describe('The project UUID'),
    type: z
      .enum(['use_case', 'sequence', 'activity', 'class', 'deployment'])
      .describe('UML diagram type'),
    plantumlSource: z
      .string()
      .describe('Valid PlantUML source with @startuml/@enduml'),
  }),
  execute: async ({ projectId, type, plantumlSource }) => {
    const { db } = await import('../../db')
    const { diagrams: diagramsTable } = await import('../../db/schema')
    const encoded = encodePlantUML(plantumlSource)
    const renderedUrl = `${config.plantumlUrl}/svg/${encoded}`
    const [diagram] = await db
      .insert(diagramsTable)
      .values({
        projectId,
        type,
        plantumlSource,
        renderedUrl,
      })
      .returning()
    return { id: diagram.id, renderedUrl, ok: true }
  },
})
