import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getDocument, createValidationToken } from '../services/document.service'
import { logAudit } from '../services/audit.service'

export const documentRouter = Router()

documentRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.get('/:id/stream', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string)

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

    sendEvent({ type: 'agent_status', agent: 'Hermes', status: 'thinking' })
    await delay(200)

    for (const section of doc.sections) {
      sendEvent({ type: 'agent_status', agent: 'Hermes', status: 'writing' })
      await delay(200)
      sendEvent({ type: 'token', token: `# ${section.title}\n\nContent for ${section.title}...` })
      await delay(200)
      sendEvent({ type: 'section_complete', section_id: section.id, title: section.title })
      await delay(200)
    }

    sendEvent({ type: 'done', document_id: req.params.id as string })
    res.end()
  } catch (err) { next(err) }
})

documentRouter.post('/:id/validation-token', requireAuth, async (req, res, next) => {
  try {
    const token = await createValidationToken(req.params.id as string)
    await logAudit({ userId: req.user!.userId, action: 'validation.token_created', target: req.params.id as string, metadata: { token } })
    res.json({ token })
  } catch (err) { next(err) }
})
