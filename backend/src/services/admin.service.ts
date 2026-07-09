import { db } from '../db'
import { agentConfigs, auditLogs, documents } from '../db/schema'
import { eq, sql, count } from 'drizzle-orm'

const DEFAULT_AGENTS = [
  { agentName: 'Hermes', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Planner', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Writer', provider: 'byok', modelId: 'gpt-4o', enabled: true },
  { agentName: 'UML', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Tables', provider: 'llama_cpp', modelId: 'hermes-3-llama-3.1-8b', enabled: true },
  { agentName: 'Reviewer', provider: 'byok', modelId: 'claude-sonnet-4-6', enabled: true },
]

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
  return {
    total_documents: docCount.value,
    active_agents: activeCount.value,
    collaboration_score: Math.round(collaborationScore * 100) / 100,
  }
}

export async function getLogs() {
  const logs = await db.select().from(auditLogs).orderBy(auditLogs.timestamp).limit(100)
  return logs.map(l => ({ action: l.action, target: l.target }))
}
