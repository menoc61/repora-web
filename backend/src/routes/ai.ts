import { Router, Request, Response, NextFunction } from 'express'
import { streamText } from 'ai'
import { requireAuth } from '../middleware/auth'
import { getLanguageModel, defaultModel } from '../ai/providers/interface'
import { AppError } from '../middleware/error'

export const aiRouter = Router()

/**
 * POST /ai/complete — inline AI completion for the editor.
 * Accepts a command (prompt) and optional selected text/context.
 * Streams the response as plain text (SSE).
 */
aiRouter.post('/complete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { command, selectedText, context } = req.body as {
      command: string
      selectedText?: string
      context?: string
    }

    if (!command || typeof command !== 'string') {
      throw new AppError(400, 'bad_request', 'command is required')
    }

    const model = getLanguageModel('ollama', defaultModel)

    const systemPrompt = `Tu es l'assistant IA de Repora, un outil de redaction de cahiers des charges techniques.
Tu aides l'utilisateur a rediger, ameliorer, reformuler, resumer ou traduire du contenu technique.
Tu reponds toujours en francais, sauf si la demande est explicitement de traduire.
Tu formates ta reponse en Markdown.
Sois precis, concis et professionnel.${context ? `\n\nContexte du document en cours:\n${context}` : ''}`

    const userMessage = selectedText
      ? `Commande: ${command}\n\nTexte selectionne:\n${selectedText}`
      : command

    const result = streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    next(err)
  }
})
