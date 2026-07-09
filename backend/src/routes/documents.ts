import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getDocument, createValidationToken } from '../services/document.service'
import { exportDocument } from '../services/export.service'
import { logAudit } from '../services/audit.service'
import { getActiveGeneration, clearActiveGeneration } from '../ai/hermes'

export const documentRouter = Router()

documentRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.get('/:id/stream', requireAuth, async (req, res, next) => {
  try {
    const generation = getActiveGeneration(req.params.id as string)
    if (!generation) {
      res.status(404).json({ error: { code: 'no_active_generation', message: 'No active generation for this document' } })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const gen = await generation
    for await (const event of gen) {
      sendEvent(event)
    }

    res.end()
  } catch (err) {
    clearActiveGeneration(req.params.id as string)
    next(err)
  }
})

documentRouter.post('/:id/validation-token', requireAuth, async (req, res, next) => {
  try {
    const token = await createValidationToken(req.params.id as string)
    await logAudit({ userId: req.user!.userId, action: 'validation.token_created', target: req.params.id as string, metadata: { token } })
    res.json({ token })
  } catch (err) { next(err) }
})

documentRouter.get('/:id/export', requireAuth, async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    if (!['pdf', 'docx', 'md'].includes(format)) {
      res.status(400).json({ error: { code: 'invalid_format', message: 'Format must be pdf, docx, or md' } })
      return
    }
    const result = await exportDocument(req.params.id as string, format as 'pdf' | 'docx' | 'md')
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.buffer)
    await logAudit({ userId: req.user!.userId, action: 'document.exported', target: req.params.id as string, metadata: { format } })
  } catch (err) { next(err) }})
