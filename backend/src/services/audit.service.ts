import { db } from '../db'
import { auditLogs } from '../db/schema'
import type { InferInsertModel } from 'drizzle-orm'

type InsertAuditLog = InferInsertModel<typeof auditLogs>

export async function logAudit(data: InsertAuditLog) {
  await db.insert(auditLogs).values(data)
}
