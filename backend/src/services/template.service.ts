import { db, schema } from '../db'
import { eq } from 'drizzle-orm'

const DEFAULT_TEMPLATES = [
  { name: 'Cahier des Charges Standard', category: 'Juridique', description: 'Cahier des charges complet avec sections standard', sections: ['Contexte', 'Exigences', 'Architecture', 'Planification'] },
  { name: 'Specification Technique', category: 'Ingenierie', description: 'Specification technique detaillee pour projets logiciels', sections: ['Vue d\'ensemble', 'Architecture', 'API', 'Securite', 'Deploiement'] },
  { name: 'Rapport Financier', category: 'Finance', description: 'Rapport financier structure avec analyses', sections: ['Resume', 'Analyse', 'Projections', 'Risques'] },
  { name: 'Audit de Securite', category: 'Securite', description: 'Rapport d\'audit de securite complet', sections: ['Perimetre', 'Vulnerabilites', 'Correctifs', 'Recommandations'] },
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
