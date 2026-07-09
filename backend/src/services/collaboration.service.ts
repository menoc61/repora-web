import { db } from '../db'
import { auditLogs } from '../db/schema'
import { desc } from 'drizzle-orm'

export async function getActivity() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(20)
  return logs.map(l => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    target: l.target ?? '',
    timestamp: l.timestamp?.toISOString() ?? new Date().toISOString(),
    metadata: l.metadata,
  }))
}
