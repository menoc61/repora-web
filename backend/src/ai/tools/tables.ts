/**
 * Requirements table tools for the Tables agent.
 *
 * These tools handle saving structured requirement tables as document sections
 * and reading existing requirements from the database.
 * DB imports are lazy-loaded inside each execute function.
 *
 * @module ai/tools/tables
 */

import { tool } from 'ai'
import { z } from 'zod'

/**
 * Save a requirement table as a new document section.
 *
 * Uses a high order number (>= 100) by default to place table sections
 * after regular prose content. If an explicit order is provided, it is used.
 * When omitted, the order is auto-computed as max existing order + 1.
 */
export const saveRequirementSection = tool({
  description: 'Save a requirement table as a new document section. Use a high order number (>= 100) to place tables after regular content.',
  inputSchema: z.object({
    documentId: z.string().describe('The document UUID'),
    title: z
      .string()
      .describe('Table title, e.g. "Matrice des exigences fonctionnelles"'),
    content: z.string().describe('Markdown table content'),
    order: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Section order — auto-computed if omitted'),
  }),
  execute: async ({ documentId, title, content, order }) => {
    const { db } = await import('../../db')
    const { sections: sectionsTable } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')

    // Auto-compute order if not provided: place after existing sections
    if (order === undefined) {
      const existing = await db
        .select({ maxOrder: sectionsTable.order })
        .from(sectionsTable)
        .where(eq(sectionsTable.documentId, documentId))
        .orderBy(sectionsTable.order)
        .limit(1)
      const maxOrder = existing.length > 0 ? (existing[0].maxOrder ?? 0) : 0
      order = maxOrder + 1
    }

    const [section] = await db
      .insert(sectionsTable)
      .values({
        documentId,
        order,
        title,
        content,
        status: 'draft',
      })
      .returning({ id: sectionsTable.id })
    return { id: section.id, ok: true }
  },
})

/**
 * Read all requirements for a given project.
 * Used by the Tables agent to populate requirement matrices.
 */
export const getRequirements = tool({
  description: 'Read all requirements for a given project',
  inputSchema: z.object({
    projectId: z.string().describe('The project UUID'),
  }),
  execute: async ({ projectId }) => {
    const { db } = await import('../../db')
    const { requirements: requirementsTable } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    const reqs = await db
      .select({
        id: requirementsTable.id,
        type: requirementsTable.type,
        text: requirementsTable.text,
        sourceActor: requirementsTable.sourceActor,
      })
      .from(requirementsTable)
      .where(eq(requirementsTable.projectId, projectId))
    return { requirements: reqs }
  },
})
