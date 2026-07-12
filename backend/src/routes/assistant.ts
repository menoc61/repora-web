import { Router, Request, Response, NextFunction } from 'express'
import { streamText } from 'ai'
import { requireAuth } from '../middleware/auth'
import { createSession, getSession, generateFromSession, getSessionSummary } from '../services/assistant.service'
import { generateDocument } from '../services/project.service'
import { getLanguageModel, defaultModel } from '../ai/providers/interface'
import { AppError } from '../middleware/error'

export const assistantRouter = Router()

const SYSTEM_PROMPT = `Tu es un assistant conversationnel specialise dans le recueil du besoin pour la redaction de cahiers des charges. Ton role est de guider l'utilisateur a travers un dialogue structure pour collecter les informations necessaires.

FORMAT DE REPONSE:
- Utilise Markdown pour formater tes reponses: **gras** pour les termes importants, listes a puces pour les options, et blocs de citation pour les questions.
- Sois structuré: commence par confirmer ce que l'utilisateur a dit, puis pose ta prochaine question.
- Utilise des emojis avec parcimonie pour rendre le dialogue plus agreable.

Pose des questions ouvertes mais orientees. Adapte-toi au rythme de l'utilisateur. Quand un element est identifie, confirme-le avant de passer au suivant.

Categories a collecter :
1. Contexte : objectifs du projet, probleme a resoudre, perimetre
2. Exigences Fonctionnelles : fonctionnalites attendues, cas d'utilisation
3. Exigences Non-Fonctionnelles : performance, securite, disponibilite, scalabilite
4. Acteurs : utilisateurs, systemes externes, roles

Quand l'utilisateur est pret, dis-lui qu'il peut demander a "generer" le document.`

assistantRouter.post('/start', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.body
    if (!projectId) throw new AppError(400, 'missing_fields', 'projectId is required')
    const sessionId = createSession(req.user!.userId, projectId)
    await new Promise(resolve => setTimeout(resolve, 100))
    const session = await getSession(sessionId)
    res.status(201).json({ sessionId, reply: session!.messages[0].content })
  } catch (err) { next(err) }
})

assistantRouter.post('/chat', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, message } = req.body
    if (!sessionId || !message) throw new AppError(400, 'missing_fields', 'sessionId and message are required')

    const session = await getSession(sessionId)
    if (!session) throw new AppError(404, 'not_found', 'Session not found')

    // Persist user message immediately
    const userMsg = { role: 'user' as const, content: message }
    const updatedMessages = [...session.messages, userMsg]

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const model = getLanguageModel('ollama', defaultModel)
    const history = updatedMessages.slice(-8).map(m => ({ role: m.role, content: m.content }))

    let reply = ''
    try {
      const result = streamText({ model, system: SYSTEM_PROMPT, messages: history })
      for await (const chunk of result.textStream) {
        reply += chunk
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
      }
    } catch {
      // Fallback if LLM fails
      reply = 'Je suis desole, une erreur est survenue. Pourriez-vous reformuler votre message ?'
      res.write(`data: ${JSON.stringify({ token: reply })}\n\n`)
    }

    res.write('data: [DONE]\n\n')

    // Persist full conversation to DB (fire-and-forget)
    const assistantMsg = { role: 'assistant' as const, content: reply }
    const { db } = await import('../db')
    const { assistantSessions } = await import('../db/schema')
    const { eq } = await import('drizzle-orm')
    db.update(assistantSessions)
      .set({ messages: [...updatedMessages, assistantMsg], updatedAt: new Date() })
      .where(eq(assistantSessions.id, sessionId))
      .execute()
      .catch((err: unknown) => console.error('Failed to persist assistant session:', err))

    res.end()
  } catch (err) { next(err) }
})

assistantRouter.get('/session/:sessionId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getSessionSummary(req.params.sessionId as string)
    if (!summary) throw new AppError(404, 'not_found', 'Session not found')
    res.json(summary)
  } catch (err) { next(err) }
})

assistantRouter.post('/generate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) throw new AppError(400, 'missing_fields', 'sessionId is required')
    const session = await getSession(sessionId)
    if (!session) throw new AppError(404, 'not_found', 'Session not found')
    if (!session.projectId) throw new AppError(400, 'bad_request', 'Session has no associated project')
    const genResult = await generateDocument(session.projectId, req.user!.userId)
    await generateFromSession(sessionId, genResult.document_id)
    res.status(201).json({ document_id: genResult.document_id, status: genResult.status })
  } catch (err) { next(err) }
})
