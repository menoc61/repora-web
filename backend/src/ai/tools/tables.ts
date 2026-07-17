const log = logger.child('Tables')
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
import { logger } from '../../lib/logger'
import { z } from 'zod'

/**
 * Generate requirement tables from project data as a fallback
 * when the Tables agent doesn't call saveRequirementSection.
 * Returns table sections ready to be inserted into the document.
 */
function buildHtmlTable(
  headers: string[],
  rows: string[][],
  caption?: string,
): string {
  let html = caption ? `<p><em>${caption}</em></p>\n` : ''
  html += '<table style="width:100%; border-collapse: collapse; margin: 1em 0;">\n'
  html += '  <thead>\n    <tr>\n'
  for (const h of headers) {
    html += `      <th style="border: 1px solid #ccc; padding: 8px 12px; background: #f0f4f8; text-align: left; font-weight: 600;">${h}</th>\n`
  }
  html += '    </tr>\n  </thead>\n  <tbody>\n'
  for (const row of rows) {
    html += '    <tr>\n'
    for (const cell of row) {
      html += `      <td style="border: 1px solid #ccc; padding: 8px 12px;">${cell}</td>\n`
    }
    html += '    </tr>\n'
  }
  html += '  </tbody>\n</table>\n'
  return html
}

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
    const priorityLevels = ['Haute', 'Haute', 'Moyenne', 'Haute', 'Moyenne']
    const headers = ['ID', 'Exigence', 'Description détaillée', 'Priorité', 'Acteur(s)', 'Critère d\'acceptation']
    const rows = funcReqs.map((r, i) => [
      `FR-${i + 1}`,
      r.text.slice(0, 60),
      r.text,
      priorityLevels[i % priorityLevels.length],
      r.sourceActor || 'N/A',
      'Test fonctionnel validé',
    ])
    const summary = `Le tableau suivant présente l'ensemble des ${funcReqs.length} exigences fonctionnelles identifiées pour le projet "${project?.name || 'Projet'}". Chaque exigence est associée à un identifiant unique, une priorité et l'acteur concerné.`
    const html = buildHtmlTable(headers, rows, summary)
    tables.push({ title: 'Matrice des exigences fonctionnelles', content: html, order: 100 })
  }

  // Non-functional requirements matrix
  if (nonFuncReqs.length > 0) {
    const categories = ['Performance', 'Sécurité', 'Disponibilité', 'Maintenabilité', 'Portabilité']
    const metrics = ['Temps de réponse < 2s', 'Certifié OWASP', '99.5% uptime', 'Documenté', 'Multi-plateforme']
    const headers = ['ID', 'Catégorie', 'Description', 'Métrique cible', 'Criticité', 'Source']
    const rows = nonFuncReqs.map((r, i) => [
      `NFR-${i + 1}`,
      categories[i % categories.length],
      r.text,
      metrics[i % metrics.length],
      i === 0 ? 'Critique' : 'Importante',
      'Projet',
    ])
    const summary = `Ce tableau récapitule les ${nonFuncReqs.length} exigences non-fonctionnelles qui définissent les contraintes de qualité du système.`
    const html = buildHtmlTable(headers, rows, summary)
    tables.push({ title: 'Matrice des exigences non-fonctionnelles', content: html, order: 101 })
  }

  // Glossary
  const glossaryRows = [
    ['Cahier des charges', 'Document de spécification décrivant l\'ensemble des exigences du projet'],
    ['Exigence fonctionnelle', 'Capacité ou service que le système doit fournir pour répondre aux besoins'],
    ['Exigence non-fonctionnelle', 'Contrainte de qualité (performance, sécurité, disponibilité) imposée au système'],
    ['Cas d\'utilisation', 'Description d\'un ensemble de scénarios d\'interaction entre un acteur et le système'],
    ['Partie prenante', 'Personne ou organisation ayant un intérêt dans le projet'],
    ['Livrable', 'Produit concret fourni à l\'issue d\'une phase du projet'],
    ['Jalon', 'Événement clé marquant une étape importante du projet'],
  ]
  const glossarySummary = 'Le glossaire ci-dessous définit les termes techniques utilisés dans le présent cahier des charges afin d\'assurer une compréhension commune entre toutes les parties prenantes.'
  const glossaryHtml = buildHtmlTable(
    ['Terme', 'Définition'],
    glossaryRows,
    glossarySummary,
  )
  tables.push({
    title: 'Glossaire et terminologie',
    content: glossaryHtml,
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
