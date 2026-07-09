import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { createValidationToken } from '../services/document.service'
import { logAudit } from '../services/audit.service'

export const sharingRouter = Router()

sharingRouter.post('/invite', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Invitation envoyee' })
})

sharingRouter.post('/resend/:id', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true })
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

sharingRouter.get('/access-logs', requireAuth, (_req: Request, res: Response) => {
  res.json([])
})
