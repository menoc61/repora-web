import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { createValidationToken } from '../services/document.service'
import { logAudit } from '../services/audit.service'
import { db } from '../db'
import { auditLogs, validations } from '../db/schema'
import { eq, desc, inArray } from 'drizzle-orm'

export const sharingRouter = Router()

sharingRouter.post('/invite', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { email, documentId, role } = req.body
    if (!email || !documentId) {
      res.status(400).json({ error: { code: 'missing_fields', message: 'email and documentId are required' } })
      return
    }
    const token = await createValidationToken(documentId)
    await logAudit({ userId: req.user!.userId, action: 'sharing.invite_sent', target: documentId, metadata: { email, role: role || 'viewer', token } })
    res.json({ ok: true, token, email, documentId, role: role || 'viewer', message: 'Invitation envoyee' })
  } catch (err) { next(err) }
})

sharingRouter.post('/resend/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const param = req.params.id as string
    let validation: typeof validations.$inferSelect | undefined

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidPattern.test(param)) {
      const [result] = await db.select().from(validations).where(eq(validations.id, param)).limit(1)
      if (result) validation = result
    }

    if (!validation) {
      const [result] = await db.select().from(validations).where(eq(validations.validatorToken, param)).limit(1)
      if (result) validation = result
    }

    if (!validation) {
      const emailLogs = await db.select().from(auditLogs)
        .where(eq(auditLogs.action, 'sharing.invite_sent'))
        .orderBy(desc(auditLogs.timestamp))

      let documentId: string | null = null
      for (const log of emailLogs) {
        const meta = log.metadata as Record<string, unknown> | null
        if (meta?.email === param) {
          documentId = log.target ?? null
          break
        }
      }

      if (documentId) {
        const [latestValidation] = await db.select().from(validations)
          .where(eq(validations.documentId, documentId))
          .orderBy(desc(validations.createdAt))
          .limit(1)
        if (latestValidation) validation = latestValidation
      }
    }

    if (!validation) {
      res.status(404).json({ error: { code: 'not_found', message: 'Validation not found' } })
      return
    }

    const newToken = await createValidationToken(validation.documentId)
    await logAudit({ userId: req.user!.userId, action: 'sharing.invite_resent', target: validation.documentId, metadata: { validationId: validation.id, newToken, param } })
    res.json({ ok: true, token: newToken, message: 'Invitation renvoyee' })
  } catch (err) { next(err) }
})

sharingRouter.post('/generate-link', requireAuth, async (req, res, next) => {
  try {
    const { documentId } = req.body
    if (!documentId) {
      res.status(400).json({ error: { code: 'missing_document_id', message: 'documentId is required' } })
      return
    }
    const token = await createValidationToken(documentId)
    await logAudit({ userId: req.user!.userId, action: 'sharing.link_generated', target: documentId, metadata: { token } })
    res.json({ token })
  } catch (err) { next(err) }
})

sharingRouter.get('/access-logs', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const sharingActions = [
      'sharing.link_generated',
      'sharing.invite_sent',
      'sharing.invite_resent',
      'validation.token_created',
      'validation_viewed',
      'validation.decided',
    ]
    const logs = await db.select().from(auditLogs)
      .where(inArray(auditLogs.action, sharingActions))
      .orderBy(desc(auditLogs.timestamp))

    const entries = logs.map(l => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      target: l.target ?? '',
      metadata: l.metadata,
      timestamp: l.timestamp?.toISOString() ?? new Date().toISOString(),
    }))
    res.json(entries)
  } catch (err) { next(err) }
})

sharingRouter.patch('/settings', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { documentId, passwordProtect, expiration, nda } = req.body
    if (!documentId) {
      res.status(400).json({ error: { code: 'missing_document_id', message: 'documentId is required' } })
      return
    }
    await logAudit({ userId: req.user!.userId, action: 'sharing.settings_updated', target: documentId, metadata: { passwordProtect, expiration, nda } })
    res.json({ ok: true, documentId, passwordProtect, expiration, nda })
  } catch (err) { next(err) }
})
