import { db, schema } from '../src/db'
import { users, projects, requirements, documents, sections, diagrams, comments, validations, templates, agentConfigs, apiKeys, auditLogs } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function seedForTests() {
  const existingUsers = await db.select().from(users).limit(1)
  if (existingUsers.length > 0) {
    console.log('Seed data exists, skipping seed.')
    return
  }

  console.log('Seeding test database...')

  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  const [admin, jean, client, sarah, marcus, elena] = await db.insert(users).values([
    { id: 'a0000000-0000-0000-0000-000000000001', name: 'Admin Repora', email: 'admin@repora.dev', passwordHash: hash('admin123'), role: 'super_admin' },
    { id: 'a0000000-0000-0000-0000-000000000002', name: 'Jean Dupont', email: 'jean@exemple.com', passwordHash: hash('test123'), role: 'redacteur' },
    { id: 'a0000000-0000-0000-0000-000000000003', name: 'Client SARL', email: 'client@exemple.com', passwordHash: hash('client123'), role: 'validateur' },
    { id: 'a0000000-0000-0000-0000-000000000004', name: 'Sarah Jenkins', email: 'sarah@repora.dev', passwordHash: hash('test123'), role: 'admin' },
    { id: 'a0000000-0000-0000-0000-000000000005', name: 'Marcus Thorne', email: 'marcus@repora.dev', passwordHash: hash('test123'), role: 'redacteur' },
    { id: 'a0000000-0000-0000-0000-000000000006', name: 'Elena Rodriguez', email: 'elena@repora.dev', passwordHash: hash('test123'), role: 'validateur' },
  ]).returning()

  const [p1, p2, p3, p4, p5] = await db.insert(projects).values([
    { id: 'b0000000-0000-0000-0000-000000000001', ownerId: jean.id, name: 'Cadre juridique 2024 - Section IV', brief: 'Mise a jour du cadre juridique pour les nouvelles regulations IA en Europe.', status: 'draft', createdAt: new Date('2024-09-15'), updatedAt: new Date('2024-10-22') },
    { id: 'b0000000-0000-0000-0000-000000000002', ownerId: jean.id, name: 'Protocole de scalabilite infrastructure v2', brief: 'Refonte de l\'architecture backend pour supporter 10x charge utilisateur.', status: 'draft', createdAt: new Date('2024-08-01'), updatedAt: new Date('2024-10-20') },
    { id: 'b0000000-0000-0000-0000-000000000003', ownerId: marcus.id, name: 'Politique de gouvernance IA', brief: 'Elaboration d\'une politique de gouvernance pour les systemes IA internes.', status: 'draft', createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-25') },
    { id: 'b0000000-0000-0000-0000-000000000004', ownerId: sarah.id, name: 'Analyse trimestrielle Q3', brief: 'Analyse strategique du marche pour le troisieme trimestre 2024.', status: 'draft', createdAt: new Date('2024-07-01'), updatedAt: new Date('2024-10-24') },
    { id: 'b0000000-0000-0000-0000-000000000005', ownerId: jean.id, name: 'Master Service Agreement - ProClean SA', brief: 'Contrat de service pour le deploiement des solutions de nettoyage industriel.', status: 'draft', createdAt: new Date('2024-10-10'), updatedAt: new Date('2024-10-27') },
  ]).returning()

  const [d1, d2, d3, d4, d5, d6, d7] = await db.insert(documents).values([
    { id: 'c0000000-0000-0000-0000-000000000001', projectId: p1.id, status: 'draft', createdAt: new Date('2024-09-20'), updatedAt: new Date('2024-10-22') },
    { id: 'c0000000-0000-0000-0000-000000000002', projectId: p2.id, status: 'draft', createdAt: new Date('2024-08-15'), updatedAt: new Date('2024-10-20') },
    { id: 'c0000000-0000-0000-0000-000000000003', projectId: p3.id, status: 'draft', createdAt: new Date('2024-10-05'), updatedAt: new Date('2024-10-25') },
    { id: 'c0000000-0000-0000-0000-000000000004', projectId: p4.id, status: 'draft', createdAt: new Date('2024-07-15'), updatedAt: new Date('2024-10-24') },
    { id: 'c0000000-0000-0000-0000-000000000005', projectId: p5.id, status: 'draft', createdAt: new Date('2024-10-12'), updatedAt: new Date('2024-10-27') },
    { id: 'c0000000-0000-0000-0000-000000000006', projectId: p1.id, status: 'draft', createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-21') },
    { id: 'c0000000-0000-0000-0000-000000000007', projectId: p3.id, status: 'draft', createdAt: new Date('2024-10-15'), updatedAt: new Date('2024-10-26') },
  ]).returning()

  const sectionData = [
    { id: 'd0000000-0000-0000-0000-000000000001', documentId: d1.id, order: 1, title: 'Contexte et objectifs', content: 'Le present document definit le cadre juridique applicable aux systemes d\'intelligence artificielle deployes par l\'organisation.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'llama3.1:8b' },
    { id: 'd0000000-0000-0000-0000-000000000002', documentId: d1.id, order: 2, title: 'Definitions et terminologie', content: 'Cette section etablit les definitions cles.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'llama3.1:8b' },
    { id: 'd0000000-0000-0000-0000-000000000003', documentId: d1.id, order: 3, title: 'Exigences de conformite', content: 'Les exigences de conformite couvrent la classification des risques.', status: 'active', generatedByAgent: 'Writer', modelUsed: 'llama3.1:8b' },
    { id: 'd0000000-0000-0000-0000-000000000004', documentId: d2.id, order: 1, title: 'Introduction', content: 'Le protocole de scalabilite infrastructure v2.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'llama3.1:8b' },
    { id: 'd0000000-0000-0000-0000-000000000005', documentId: d2.id, order: 2, title: 'Architecture actuelle', content: 'Analyse de l\'architecture monolithique existante.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'llama3.1:8b' },
    { id: 'd0000000-0000-0000-0000-000000000006', documentId: d3.id, order: 1, title: 'Perimetre de la gouvernance IA', content: 'Ce document definit le cadre de gouvernance.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'claude-3-5-sonnet-20241022' },
    { id: 'd0000000-0000-0000-0000-000000000007', documentId: d3.id, order: 2, title: 'Roles et responsabilites', content: 'Definition claire des roles.', status: 'done', generatedByAgent: 'Writer', modelUsed: 'claude-3-5-sonnet-20241022' },
  ]
  await db.insert(sections).values(sectionData)

  await db.insert(diagrams).values([
    { id: 'e0000000-0000-0000-0000-000000000001', projectId: p2.id, type: 'sequence', plantumlSource: '@startuml\nactor User\n@enduml', createdAt: new Date('2024-09-01') },
    { id: 'e0000000-0000-0000-0000-000000000002', projectId: p2.id, type: 'deployment', plantumlSource: '@startuml\nnode "Frontend" as FE\n@enduml', createdAt: new Date('2024-09-05') },
  ])

  await db.insert(comments).values([
    { id: 'f0000000-0000-0000-0000-000000000001', sectionId: sectionData[2].id!, authorId: jean.id, text: 'Testing comment', resolved: false, createdAt: new Date('2024-10-15') },
  ])

  await db.insert(requirements).values([
    { id: 'g0000000-0000-0000-0000-000000000001', projectId: p1.id, type: 'functional', text: 'Test requirement', sourceActor: 'Tester', createdAt: new Date('2024-09-16') },
  ])

  await db.insert(validations).values([
    { id: 'h0000000-0000-0000-0000-000000000001', documentId: d1.id, validatorToken: crypto.randomBytes(16).toString('hex'), decision: null, createdAt: new Date('2024-10-22') },
    { id: 'h0000000-0000-0000-0000-000000000002', documentId: d1.id, validatorToken: 'test-validation-token-12345678', decision: null, createdAt: new Date('2024-10-22') },
  ])

  const existingTemplates = await db.select().from(templates).limit(1)
  if (existingTemplates.length === 0) {
    await db.insert(templates).values([
      { id: '10000000-0000-0000-0000-000000000001', name: 'Cahier des Charges Standard', category: 'Juridique', description: 'Cahier des charges complet avec sections standard', sections: ['Contexte', 'Exigences', 'Architecture', 'Planification'], createdAt: new Date('2024-01-01') },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Specification Technique', category: 'Ingenierie', description: 'Specification technique detaillee pour projets logiciels', sections: ["Vue d'ensemble", 'Architecture', 'API', 'Securite', 'Deploiement'], createdAt: new Date('2024-01-01') },
      { id: '10000000-0000-0000-0000-000000000003', name: 'Rapport Financier', category: 'Finance', description: 'Rapport financier structure avec analyses', sections: ['Resume', 'Analyse', 'Projections', 'Risques'], createdAt: new Date('2024-01-01') },
    ])
  }

  const existingAgents = await db.select().from(agentConfigs).limit(1)
  if (existingAgents.length === 0) {
    await db.insert(agentConfigs).values([
      { id: '11000000-0000-0000-0000-000000000001', agentName: 'Hermes', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true, updatedAt: new Date('2024-10-01') },
      { id: '11000000-0000-0000-0000-000000000002', agentName: 'Planner', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true, updatedAt: new Date('2024-10-01') },
      { id: '11000000-0000-0000-0000-000000000003', agentName: 'Writer', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true, updatedAt: new Date('2024-10-01') },
      { id: '11000000-0000-0000-0000-000000000004', agentName: 'UML', provider: 'ollama', modelId: 'llama3.1:8b', enabled: false, updatedAt: new Date('2024-10-01') },
    ])
  }

  await db.insert(apiKeys).values([
    { id: '12000000-0000-0000-0000-000000000001', userId: admin.id, provider: 'openai', encryptedKey: 'encrypted:sk-demo-openai-key', createdAt: new Date('2024-10-01') },
  ])

  await db.insert(auditLogs).values([
    { action: 'document.created', target: d1.id, userId: jean.id, timestamp: new Date('2024-09-20'), metadata: { title: 'Test doc' } },
    { action: 'document.created', target: d2.id, userId: jean.id, timestamp: new Date('2024-08-15'), metadata: { title: 'Test doc 2' } },
  ])

  console.log('Test seed complete!')
}

let app: import('express').Express

beforeAll(async () => {
  await seedForTests()
  const mod = await import('../src/index')
  app = mod.default
})

export function getApp() {
  return app
}

export { db, schema }

export async function cleanupTestUser(userId: string) {
  const userProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, userId))
  for (const p of userProjects) {
    const projectDocs = await db.select({ id: documents.id }).from(documents).where(eq(documents.projectId, p.id))
    for (const d of projectDocs) {
      const docSections = await db.select({ id: sections.id }).from(sections).where(eq(sections.documentId, d.id))
      for (const s of docSections) {
        await db.delete(comments).where(eq(comments.sectionId, s.id))
      }
      await db.delete(validations).where(eq(validations.documentId, d.id))
      await db.delete(sections).where(eq(sections.documentId, d.id))
      await db.delete(documents).where(eq(documents.id, d.id))
    }
    await db.delete(requirements).where(eq(requirements.projectId, p.id))
    await db.delete(diagrams).where(eq(diagrams.projectId, p.id))
    await db.delete(projects).where(eq(projects.id, p.id))
  }
  await db.delete(apiKeys).where(eq(apiKeys.userId, userId))
  await db.delete(auditLogs).where(eq(auditLogs.userId, userId))
  await db.delete(users).where(eq(users.id, userId))
}
