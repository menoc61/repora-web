import { db } from '../db'
import { agentConfigs, auditLogs, documents, apiKeys } from '../db/schema'
import { eq, sql, count } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import crypto from 'crypto'
import { config } from '../config'

const ALGORITHM = 'aes-256-cbc'

const DEFAULT_AGENTS = [
  { agentName: 'Hermes', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Planner', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Writer', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'UML', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Tables', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
  { agentName: 'Reviewer', provider: 'ollama', modelId: 'llama3.1:8b', enabled: true },
]

function encryptKey(plaintext: string): string {
  const key = Buffer.from(config.encryptionKey, 'utf-8').subarray(0, 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export async function listAgents() {
  const agents = await db.select().from(agentConfigs)
  if (agents.length === 0) {
    const seeded = await db.insert(agentConfigs).values(DEFAULT_AGENTS).returning()
    return seeded.map(a => ({ name: a.agentName, provider: a.provider, enabled: a.enabled, modelId: a.modelId }))
  }
  return agents.map(a => ({ name: a.agentName, provider: a.provider, enabled: a.enabled, modelId: a.modelId }))
}

export async function patchAgent(name: string, data: Partial<typeof agentConfigs.$inferInsert>) {
  await db.update(agentConfigs).set(data).where(eq(agentConfigs.agentName, name))
}

export async function getMetrics() {
  const [docCount] = await db.select({ value: count() }).from(documents)
  const [activeCount] = await db.select({ value: count() }).from(agentConfigs).where(eq(agentConfigs.enabled, true))
  const collaborationScore = activeCount.value / 6

  const draftCount = await db.select({ value: count() }).from(documents).where(eq(documents.status, 'draft'))
  const reviewCount = await db.select({ value: count() }).from(documents).where(eq(documents.status, 'in_review'))
  const finalCount = await db.select({ value: count() }).from(documents).where(eq(documents.status, 'validated'))

  const recentLogs = await db.select().from(auditLogs).orderBy(auditLogs.timestamp).limit(10)

  return {
    total_documents: docCount.value,
    active_agents: activeCount.value,
    collaboration_score: Math.round(collaborationScore * 100) / 100,
    documents_by_status: {
      draft: draftCount[0].value,
      review: reviewCount[0].value,
      final: finalCount[0].value,
    },
    recent_activity: recentLogs.map(l => ({
      action: l.action,
      target: l.target ?? '',
      timestamp: l.timestamp?.toISOString() ?? new Date().toISOString(),
    })),
  }
}

export async function getLogs() {
  const logs = await db.select().from(auditLogs).orderBy(auditLogs.timestamp).limit(100)
  return logs.map(l => ({ action: l.action, target: l.target }))
}

export async function listApiKeys(userId: string) {
  const keys = await db.select({
    id: apiKeys.id,
    provider: apiKeys.provider,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(eq(apiKeys.userId, userId))
  return keys
}

export async function createApiKey(userId: string, provider: string, key: string) {
  const encryptedKey = encryptKey(key)
  const [created] = await db.insert(apiKeys).values({ userId, provider, encryptedKey }).returning({
    id: apiKeys.id,
    provider: apiKeys.provider,
    createdAt: apiKeys.createdAt,
  })
  return created
}

export async function deleteApiKey(id: string) {
  const [deleted] = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning({ id: apiKeys.id })
  if (!deleted) throw new AppError(404, 'not_found', 'API key not found')
  return deleted
}
