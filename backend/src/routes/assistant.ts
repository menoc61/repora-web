import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createSession, getSession, processMessage, generateFromSession, getSessionSummary } from '../services/assistant.service'
import { generateDocument } from '../services/project.service'

export const assistantRouter = Router()

assistantRouter.post('/start', requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.body
    if (!projectId) return res.status(400).json({ error: { code: 'missing_fields', message: 'projectId is required' } })
    const sessionId = createSession(projectId)
    const session = getSession(sessionId)
    res.status(201).json({ sessionId, reply: session!.messages[0].content })
  } catch (err) { next(err) }
})

assistantRouter.post('/chat', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, message } = req.body
    if (!sessionId || !message) return res.status(400).json({ error: { code: 'missing_fields', message: 'sessionId and message are required' } })
    const result = await processMessage(sessionId, message)
    res.json(result)
  } catch (err) { next(err) }
})

assistantRouter.get('/session/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const summary = getSessionSummary(req.params.sessionId as string)
    if (!summary) return res.status(404).json({ error: { code: 'not_found', message: 'Session not found' } })
    res.json(summary)
  } catch (err) { next(err) }
})

assistantRouter.post('/generate', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) return res.status(400).json({ error: { code: 'missing_fields', message: 'sessionId is required' } })
    const session = getSession(sessionId)
    if (!session) return res.status(404).json({ error: { code: 'not_found', message: 'Session not found' } })
    const genResult = await generateDocument(session.projectId, req.user!.userId)
    await generateFromSession(sessionId, genResult.document_id)
    res.status(201).json({ document_id: genResult.document_id, status: genResult.status })
  } catch (err) { next(err) }
})
