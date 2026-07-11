import { db } from '../db'
import { projects, assistantSessions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { initiateGeneration, getDefaultModel } from '../ai/hermes'
import { getLanguageModel } from '../ai/providers/interface'
import { streamText, isStepCount } from 'ai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SessionContext {
  context: string[]
  features: string[]
  constraints: string[]
  actors: string[]
}

const SYSTEM_PROMPT = `Tu es un assistant conversationnel specialise dans le recueil du besoin pour la redaction de cahiers des charges. Ton role est de guider l'utilisateur a travers un dialogue structure pour collecter les informations necessaires.

Pose des questions ouvertes mais orientees. Adapte-toi au rythme de l'utilisateur. Quand un element est identifie, confirme-le avant de passer au suivant.

Categories a collecter :
1. Contexte : objectifs du projet, probleme a resoudre, perimetre
2. Exigences Fonctionnelles : fonctionnalites attendues, cas d'utilisation
3. Exigences Non-Fonctionnelles : performance, securite, disponibilite, scalabilite
4. Acteurs : utilisateurs, systemes externes, roles

Quand l'utilisateur est pret, dis-lui qu'il peut demander a "generer" le document.`

import { randomUUID } from 'crypto'

export function createSession(userId: string, projectId: string): string {
  const sessionId = randomUUID()
  const welcomeMessage: ChatMessage = {
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant pour la redaction du cahier des charges. Parlez-moi de votre projet : quels sont ses objectifs et le probleme qu\'il cherche a resoudre ?',
  }

  db.insert(assistantSessions).values({
    id: sessionId,
    userId,
    projectId,
    messages: [welcomeMessage],
    context: { context: [], features: [], constraints: [], actors: [] },
  }).execute().catch((err) => console.error('Failed to create assistant session:', err))

  return sessionId
}

export async function getSession(sessionId: string) {
  const rows = await db.select().from(assistantSessions).where(eq(assistantSessions.id, sessionId)).limit(1)
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    projectId: row.projectId,
    messages: (row.messages as ChatMessage[]) ?? [],
    ...(row.context as SessionContext ?? { context: [], features: [], constraints: [], actors: [] }),
  }
}

export async function processMessage(sessionId: string, message: string) {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')

  const userMsg: ChatMessage = { role: 'user', content: message }
  const updatedMessages = [...session.messages, userMsg]

  const reply = await generateReply(session, message)
  const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
  const finalMessages = [...updatedMessages, assistantMsg]

  const extraction = extractFromConversation(session, message)
  const updatedContext: SessionContext = {
    context: [...session.context, ...(extraction.context ?? [])],
    features: [...session.features, ...(extraction.features ?? [])],
    constraints: [...session.constraints, ...(extraction.constraints ?? [])],
    actors: [...session.actors, ...(extraction.actors ?? [])],
  }

  // Persist to DB
  db.update(assistantSessions)
    .set({ messages: finalMessages, context: updatedContext, updatedAt: new Date() })
    .where(eq(assistantSessions.id, sessionId))
    .execute()
    .catch((err) => console.error('Failed to persist assistant session:', err))

  return { reply, extraction }
}

async function generateReply(session: { messages: ChatMessage[] }, _userMessage: string): Promise<string> {
  const model = getLanguageModel('ollama', getDefaultModel())
  const history = session.messages.slice(-8).map(m => ({ role: m.role, content: m.content }))

  try {
    const result = await streamText({ model, system: SYSTEM_PROMPT, messages: history, stopWhen: isStepCount(3) })
    let reply = ''
    for await (const chunk of result.textStream) { reply += chunk }
    return reply
  } catch {
    return fallbackReply(session)
  }
}

function fallbackReply(session: { messages: ChatMessage[]; context?: string[]; features?: string[]; constraints?: string[]; actors?: string[] }): string {
  const lower = session.messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() ?? ''
  if (lower.includes('generer') || lower.includes('cree') || lower.includes('lancer')) {
    return 'Je lance la generation du cahier des charges avec les informations collectees.'
  }
  if (!session.context || session.context.length === 0) {
    return 'Parlez-moi des objectifs de votre projet : quel probleme cherchez-vous a resoudre ?'
  }
  if (!session.features || session.features.length === 0) {
    return 'Quelles fonctionnalites le systeme devrait-il offrir ?'
  }
  if (!session.constraints || session.constraints.length === 0) {
    return 'Y a-t-il des contraintes techniques ou de performance ?'
  }
  if (!session.actors || session.actors.length === 0) {
    return 'Quels sont les differents types d\'utilisateurs du systeme ?'
  }
  return 'Dites-moi "generer" pour lancer la creation du document.'
}

function extractFromConversation(session: { context: string[]; features: string[]; constraints: string[]; actors: string[] }, message: string) {
  const lower = message.toLowerCase()
  const result: { context?: string[]; features?: string[]; constraints?: string[]; actors?: string[] } = {}

  if (lower.includes('objectif') || lower.includes('but') || lower.includes('besoin') || lower.includes('probleme')) {
    result.context = [message]
  }
  if (lower.includes('fonctionnalite') || lower.includes('module') || lower.includes('doit pouvoir') || lower.includes('permettre')) {
    result.features = [message]
  }
  if (lower.includes('securite') || lower.includes('performance') || lower.includes('contrainte') || lower.includes('temps') || lower.includes('utilisateur') && lower.includes('simultan')) {
    result.constraints = [message]
  }
  if (lower.includes('utilisateur') || lower.includes('acteur') || lower.includes('admin') || lower.includes('client') || lower.includes('role')) {
    result.actors = [message]
  }

  return result
}

export async function generateFromSession(sessionId: string, documentId: string): Promise<void> {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (!session.projectId) throw new Error('Session has no associated project')

  const brief = [
    ...(session.context || []),
    ...(session.features || []).map(f => `- Fonctionnalite: ${f}`),
    ...(session.constraints || []).map(c => `- Contrainte: ${c}`),
    ...(session.actors || []).map(a => `- Acteur: ${a}`),
  ].join('\n')

  await db.update(projects)
    .set({ brief })
    .where(eq(projects.id, session.projectId!))

  initiateGeneration(session.projectId, brief, documentId)
}

export async function getSessionSummary(sessionId: string) {
  const session = await getSession(sessionId)
  if (!session) return null
  return {
    projectId: session.projectId,
    context: session.context || [],
    features: session.features || [],
    constraints: session.constraints || [],
    actors: session.actors || [],
    messageCount: session.messages.length,
  }
}
