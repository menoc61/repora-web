import { streamText, isStepCount } from 'ai'
import { AGENT_REGISTRY } from './agents/registry'
import { getLanguageModel } from './providers/interface'
import type { ProviderType } from './providers/interface'
import { generateOutline, type GeneratedSection } from '../services/outline.service'
import { config } from '../config'

export type HermesEvent = {
  type: 'agent_status'
  agent: string
  status: string
  [key: string]: unknown
} | {
  type: 'token'
  token: string
  agent: string
  [key: string]: unknown
} | {
  type: 'tool_call'
  agent: string
  tool: string
  args: unknown
  [key: string]: unknown
} | {
  type: 'tool_result'
  agent: string
  tool: string
  result: unknown
  [key: string]: unknown
} | {
  type: 'section_complete'
  section_id?: string
  title?: string
  [key: string]: unknown
} | {
  type: 'done'
  document_id?: string
  [key: string]: unknown
}

let discoveredModel = 'llama3.1:8b'

export async function discoverOllamaModel(): Promise<string> {
  try {
    const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
    const res = await fetch(`${baseUrl}/api/tags`)
    if (!res.ok) return discoveredModel
    const data = (await res.json()) as { models?: Array<{ name: string }> }
    if (data.models && data.models.length > 0) {
      discoveredModel = data.models[0].name
    }
  } catch { /* use default */ }
  return discoveredModel
}

export function getDefaultModel(): string {
  return discoveredModel
}

export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string; sectionId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  const agentDef = AGENT_REGISTRY[agentName]
  if (!agentDef) throw new Error(`Unknown agent: ${agentName}`)

  yield { type: 'agent_status', agent: agentName, status: 'thinking' }

  const modelId = agentDef.defaultProvider === 'ollama' ? discoveredModel : agentDef.defaultModel
  const model = getLanguageModel(agentDef.defaultProvider as ProviderType, modelId, apiKey)

  const stream = await streamText({
    model,
    system: agentDef.systemPrompt,
    prompt,
    tools: agentDef.tools as Parameters<typeof streamText>[0]['tools'],
    stopWhen: isStepCount(5),
  })

  for await (const event of stream.fullStream) {
    switch (event.type) {
      case 'text-delta':
        yield { type: 'token', token: event.text, agent: agentName }
        break
      case 'tool-call':
        yield { type: 'tool_call', agent: agentName, tool: event.toolName, args: event.input }
        break
      case 'tool-result':
        yield { type: 'tool_result', agent: agentName, tool: event.toolName, result: event.output }
        break
    }
  }

  yield { type: 'agent_status', agent: agentName, status: 'done' }
  yield { type: 'done', agent: agentName }
}

const activeGenerations = new Map<string, Promise<AsyncGenerator<HermesEvent>>>()

export function setActiveGeneration(documentId: string, gen: Promise<AsyncGenerator<HermesEvent>>) {
  activeGenerations.set(documentId, gen)
}

export function getActiveGeneration(documentId: string): Promise<AsyncGenerator<HermesEvent>> | undefined {
  return activeGenerations.get(documentId)
}

export function clearActiveGeneration(documentId: string) {
  activeGenerations.delete(documentId)
}

export async function orchestrateGeneration(projectId: string, prompt: string, documentId: string): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate(): AsyncGenerator<HermesEvent> {
    try {
      yield { type: 'agent_status', agent: 'Planner', status: 'structuring' }
      const sections: GeneratedSection[] = await generateOutline(prompt, documentId)
      const sectionCount = sections.length
      yield { type: 'agent_status', agent: 'Planner', status: 'done' }
      yield { type: 'agent_status', agent: 'System', status: 'outline_created', sections_created: sectionCount }

      if (sectionCount > 0) {
        yield { type: 'agent_status', agent: 'Writer', status: 'thinking' }
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          yield {
            type: 'agent_status',
            agent: 'Writer',
            status: 'writing',
            section: `${i + 1}/${sectionCount}`,
            section_title: section.title,
          }

          const sectionPrompt = `Write the section titled "${section.title}" (sectionId: "${section.id}") for document ${documentId}. Call the writeSection tool with sectionId="${section.id}" and your prose content. This is part of a professional specification document ("cahier des charges"). Write clear, detailed, professional prose in French.`
          const writerGen = runAgent('Writer', sectionPrompt, { projectId, documentId, sectionId: section.id })
          for await (const event of writerGen) {
            yield event
          }

          yield { type: 'section_complete', section_id: section.id, title: section.title }
        }
        yield { type: 'agent_status', agent: 'Writer', status: 'done' }
      }

      yield { type: 'agent_status', agent: 'Reviewer', status: 'thinking' }
      const reviewerGen = runAgent('Reviewer', "Relis le document complet. Verifie la coherence, la completude, l'alignement terminologique et la qualite. Note tout probleme en francais.", { projectId, documentId })
      for await (const event of reviewerGen) {
        yield event
      }
      yield { type: 'agent_status', agent: 'Reviewer', status: 'done' }

      yield { type: 'done' as const, document_id: documentId }
    } finally {
      clearActiveGeneration(documentId)
    }
  }

  return orchestrate()
}

export function initiateGeneration(projectId: string, prompt: string, documentId: string): void {
  const gen = orchestrateGeneration(projectId, prompt, documentId)
  setActiveGeneration(documentId, gen)
}
