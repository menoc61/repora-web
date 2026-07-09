import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { getActivity } from '../services/collaboration.service'
import { db } from '../db'
import { auditLogs, users } from '../db/schema'
import { logAudit } from '../services/audit.service'
import { eq, desc, inArray } from 'drizzle-orm'

export const collaborationRouter = Router()

collaborationRouter.get('/activity', requireAuth, async (req, res, next) => {
  try {
    const activity = await getActivity()
    res.json(activity)
  } catch (err) { next(err) }
})

collaborationRouter.post('/invite', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { email, documentId, role } = req.body
    if (!email || !documentId) {
      res.status(400).json({ error: { code: 'missing_fields', message: 'email and documentId are required' } })
      return
    }
    await logAudit({ userId: req.user!.userId, action: 'collaborator_added', target: documentId, metadata: { email, role: role || 'viewer' } })
    res.json({ ok: true, email, documentId, role: role || 'viewer' })
  } catch (err) { next(err) }
})

collaborationRouter.get('/collaborators', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const logs = await db.select().from(auditLogs)
      .where(eq(auditLogs.action, 'collaborator_added'))
      .orderBy(desc(auditLogs.timestamp))

    const collaboratorMap = new Map<string, { email: string; role: string; invitedAt: string }[]>()
    const emails = new Set<string>()

    for (const log of logs) {
      const meta = log.metadata as Record<string, unknown> | null
      const documentId = log.target ?? ''
      const email = (meta?.email as string) ?? 'unknown'
      const role = (meta?.role as string) ?? 'viewer'
      emails.add(email)

      if (!collaboratorMap.has(documentId)) {
        collaboratorMap.set(documentId, [])
      }
      collaboratorMap.get(documentId)!.push({
        email,
        role,
        invitedAt: log.timestamp?.toISOString() ?? new Date().toISOString(),
      })
    }

    const userRows = emails.size > 0
      ? await db.select({ email: users.email, name: users.name }).from(users)
          .where(inArray(users.email, Array.from(emails)))
      : []
    const nameByEmail = new Map(userRows.map(u => [u.email, u.name]))

    res.json(Array.from(collaboratorMap.entries()).map(([documentId, collaborators]) => ({
      documentId,
      collaborators: collaborators.map(c => ({
        name: nameByEmail.get(c.email) ?? c.email,
        email: c.email,
        role: c.role,
      })),
    })))
  } catch (err) { next(err) }
})

collaborationRouter.patch('/collaborators', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { email, role } = req.body
    if (!email || !role) {
      res.status(400).json({ error: { code: 'missing_fields', message: 'email and role are required' } })
      return
    }
    await logAudit({ userId: req.user!.userId, action: 'collaborator_updated', target: email, metadata: { role } })
    res.json({ ok: true, email, role })
  } catch (err) { next(err) }
})

collaborationRouter.delete('/collaborators', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const email = req.query.email as string
    if (!email) {
      res.status(400).json({ error: { code: 'missing_fields', message: 'email query parameter is required' } })
      return
    }
    await logAudit({ userId: req.user!.userId, action: 'collaborator_removed', target: email })
    res.json({ ok: true, email })
  } catch (err) { next(err) }
})
