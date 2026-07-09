/**
 * Document read/write tools for the Writer agent.
 *
 * These tools handle document content retrieval and section writing.
 * DB imports are lazy-loaded inside each execute function to avoid
 * circular dependencies and keep cold-start fast.
 *
 * @module ai/tools/document
 */

import { tool } from 'ai'
import { z } from 'zod'

/**
 * Read a project's brief text.
 * Used by agents to understand the project context before generating content.
 */
export const getProjectContext = tool({
  description: 'Get project brief and requirements for a given project',
  inputSchema: z.object({
    projectId: z.string().describe('The project UUID'),
  }),
  execute: async ({ projectId }) => {
    const { db } = await import('../../db')
    const { projects, requirements } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    const [project] = await db
      .select({ brief: projects.brief, name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
    const reqs = await db
      .select({ id: requirements.id, type: requirements.type, text: requirements.text, sourceActor: requirements.sourceActor })
      .from(requirements)
      .where(eq(requirements.projectId, projectId))
    return {
      brief: project?.brief || 'Aucun brief',
      name: project?.name || 'Projet inconnu',
      requirements: reqs.map(r => ({
        id: r.id,
        type: r.type,
        text: r.text,
        sourceActor: r.sourceActor,
      })),
    }
  },
})

/**
 * Read all sections of a document, ordered by their sequence number.
 * Used by agents (UML, Tables, Reviewer) to inspect the full document.
 */
export const getDocumentContent = tool({
  description: 'Get all sections of a document with their titles and content, ordered by section order',
  inputSchema: z.object({
    documentId: z.string().describe('The document UUID'),
  }),
  execute: async ({ documentId }) => {
    const { db } = await import('../../db')
    const { sections: sectionsTable } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    const allSections = await db
      .select({
        id: sectionsTable.id,
        title: sectionsTable.title,
        content: sectionsTable.content,
        status: sectionsTable.status,
        order: sectionsTable.order,
      })
      .from(sectionsTable)
      .where(eq(sectionsTable.documentId, documentId))
      .orderBy(sectionsTable.order)
    return { sections: allSections }
  },
})

/**
 * Write prose content to a document section and mark it as draft.
 * The Writer agent calls this after generating content for each section.
 */
export const writeSection = tool({
  description: 'Write content for a document section and set its status to draft',
  inputSchema: z.object({
    sectionId: z.string().describe('The section UUID'),
    content: z.string().describe('Full prose content in French'),
  }),
  execute: async ({ sectionId, content }) => {
    const { db } = await import('../../db')
    const { sections: sectionsTable } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db
      .update(sectionsTable)
      .set({ content, status: 'draft' })
      .where(eq(sectionsTable.id, sectionId))
    return { ok: true }
  },
})

/**
 * Persist a structured document outline to the documents table.
 * The Planner agent calls this after generating an outline JSON.
 */
export const saveOutline = tool({
  description: 'Save a structured document outline (chapters and sections) as JSON',
  inputSchema: z.object({
    documentId: z.string().describe('The document UUID'),
    outline: z.record(z.string(), z.any()).describe('Outline JSON with title, chapters, and sections'),
  }),
  execute: async ({ documentId, outline }) => {
    const { db } = await import('../../db')
    const { documents } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
    return { ok: true }
  },
})
