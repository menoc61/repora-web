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

/**
 * Persist a PlantUML diagram for the current project.
 *
 * The UML agent calls this after generating PlantUML source code.
 * The diagram type must be one of the supported UML categories.
 */
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
    const [diagram] = await db
      .insert(diagramsTable)
      .values({
        projectId,
        type,
        plantumlSource,
        renderedUrl: '',
      })
      .returning()
    return { id: diagram.id, ok: true }
  },
})
