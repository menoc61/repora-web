import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { exportDocument, getStoredExport } from '../services/export.service'
import { logAudit } from '../services/audit.service'
import { AppError } from '../middleware/error'

export const exportRouter = Router()

exportRouter.get('/documents/:id', requireAuth, async (req: Request, res: Response, next: any) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    if (!['pdf', 'docx', 'md'].includes(format)) {
      res.status(400).json({ error: { code: 'invalid_format', message: 'Format must be pdf, docx, or md' } })
      return
    }
    const docId = req.params.id as string

    const stored = await getStoredExport(docId, format)
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`)
      res.setHeader('X-Cache', 'HIT')
      res.send(stored.buffer)
      await logAudit({ userId: req.user!.userId, action: 'document.exported', target: docId, metadata: { format, cached: true } })
      return
    }

    const result = await exportDocument(docId, format as 'pdf' | 'docx' | 'md')
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('X-Cache', 'MISS')
    res.send(result.buffer)
    await logAudit({ userId: req.user!.userId, action: 'document.exported', target: docId, metadata: { format, cached: false } })
  } catch (err) {
    next(err)
  }
})
