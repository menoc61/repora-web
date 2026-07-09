import { streamText, isStepCount } from 'ai'
import { AGENT_REGISTRY } from './agents/registry'
import { getLanguageModel } from './providers/interface'
import type { ProviderType } from './providers/interface'

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

export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  const agentDef = AGENT_REGISTRY[agentName]
  if (!agentDef) throw new Error(`Unknown agent: ${agentName}`)

  yield { type: 'agent_status', agent: agentName, status: 'thinking' }

  const model = getLanguageModel(agentDef.defaultProvider as ProviderType, agentDef.defaultModel, apiKey)

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

  yield { type: 'agent_status', agent: agentName, status: 'writing' }
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
      const plannerGen = runAgent('Planner', prompt, { projectId, documentId })
      for await (const event of plannerGen) {
        yield event
      }

      const writerGen = runAgent('Writer', 'Draft each section from the outline', { projectId, documentId })
      for await (const event of writerGen) {
        yield event
      }

      const reviewerGen = runAgent('Reviewer', 'Review the complete document', { projectId, documentId })
      for await (const event of reviewerGen) {
        yield event
      }

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