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
 * Generate requirement tables from project data as a fallback
 * when the Tables agent doesn't call saveRequirementSection.
 * Returns table sections ready to be inserted into the document.
 */
export async function generateTablesFromRequirements(
  documentId: string,
  projectId: string,
): Promise<Array<{ title: string; content: string; order: number }>> {
  const { db } = await import('../../db')
  const { requirements: reqsTable, projects } = await import('../../db/schema')
  const { eq } = await import('drizzle-orm')

  const [project] = await db.select({ name: projects.name, brief: projects.brief })
    .from(projects).where(eq(projects.id, projectId)).limit(1)

  const reqs = await db.select({ id: reqsTable.id, type: reqsTable.type, text: reqsTable.text, sourceActor: reqsTable.sourceActor })
    .from(reqsTable).where(eq(reqsTable.projectId, projectId))

  const funcReqs = reqs.filter(r => r.type === 'functional')
  const nonFuncReqs = reqs.filter(r => r.type === 'non_functional')
  const tables: Array<{ title: string; content: string; order: number }> = []

  // Functional requirements matrix
  if (funcReqs.length > 0) {
    let md = '| ID | Exigence | Description | Priorite | Acteur |\n'
    md += '|------|----------|-------------|----------|--------|\n'
    funcReqs.forEach((r, i) => {
      md += `| FR-${i + 1} | ${r.text.slice(0, 50)} | ${r.text} | Haute | ${r.sourceActor || 'N/A'} |\n`
    })
    tables.push({ title: 'Matrice des exigences fonctionnelles', content: md, order: 100 })
  }

  // Non-functional requirements matrix
  if (nonFuncReqs.length > 0) {
    let md = '| ID | Categorie | Description | Metrique |\n'
    md += '|------|-----------|-------------|----------|\n'
    nonFuncReqs.forEach((r, i) => {
      md += `| NFR-${i + 1} | Generique | ${r.text} | Mesurable |\n`
    })
    tables.push({ title: 'Matrice des exigences non-fonctionnelles', content: md, order: 101 })
  }

  // Glossary
  tables.push({
    title: 'Glossaire et terminologie',
    content: `| Terme | Definition |\n|-------|------------|\n| Cahier des charges | Document de specification decrivant les exigences du projet |\n| Exigence fonctionnelle | Capacite que le systeme doit fournir |\n| Exigence non-fonctionnelle | Contrainte de qualite ou de performance |\n`,
    order: 102,
  })

  return tables
}

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
      const { sql } = await import('drizzle-orm')
      const existing = await db
        .select({ maxOrder: sql<number>`coalesce(max(${sectionsTable.order}), 0)` })
        .from(sectionsTable)
        .where(eq(sectionsTable.documentId, documentId))
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
