import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import type { OutlineJson } from './outline.service'

const DEFAULT_TEMPLATES = [
  { name: 'Cahier des Charges Standard', category: 'Juridique', description: 'Cahier des charges complet avec sections standard', sections: ['Contexte', 'Exigences', 'Architecture', 'Planification'] },
  { name: 'Specification Technique', category: 'Ingenierie', description: 'Specification technique detaillee pour projets logiciels', sections: ["Vue d'ensemble", 'Architecture', 'API', 'Securite', 'Deploiement'] },
  { name: 'Rapport Financier', category: 'Finance', description: 'Rapport financier structure avec analyses', sections: ['Resume', 'Analyse', 'Projections', 'Risques'] },
  { name: 'Audit de Securite', category: 'Securite', description: "Rapport d'audit de securite complet", sections: ['Perimetre', 'Vulnerabilites', 'Correctifs', 'Recommandations'] },
  { name: 'Analyse de Marche', category: 'Marketing', description: 'Etude de marche et analyse concurrentielle', sections: ['Contexte', 'Concurrence', 'Opportunites', 'Strategie'] },
]

async function seedTemplates() {
  const existing = await db.select().from(schema.templates).limit(1)
  if (existing.length === 0) {
    await db.insert(schema.templates).values(DEFAULT_TEMPLATES)
  }
}

export async function listTemplates(category?: string) {
  await seedTemplates()
  if (category) {
    return db.select().from(schema.templates).where(eq(schema.templates.category, category))
  }
  return db.select().from(schema.templates)
}

export async function getTemplate(id: string) {
  await seedTemplates()
  const [t] = await db.select().from(schema.templates).where(eq(schema.templates.id, id)).limit(1)
  return t ?? null
}

/**
 * Fetch a template and convert its section list into an OutlineJson-compatible structure
 * for seeding the Planner agent.
 *
 * Templates store sections as a flat string array. We wrap them into a single
 * "Template Structure" chapter with each section as a subsection.
 *
 * @returns Template outline + name, or null if template not found or templateId is falsy.
 */
export async function getTemplateForGeneration(
  templateId: string | undefined,
): Promise<{ outline: OutlineJson; name: string } | null> {
  if (!templateId) return null

  await seedTemplates()
  const [t] = await db.select().from(schema.templates).where(eq(schema.templates.id, templateId)).limit(1)
  if (!t) return null

  const sections = (t.sections as string[] | null) || []
  const outline: OutlineJson = {
    title: t.name,
    chapters: sections.map((sectionName, idx) => ({
      title: sectionName,
      sections: [{ title: sectionName, order: idx + 1 }],
    })),
  }

  return { outline, name: t.name }
}
