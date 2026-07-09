import { streamText } from 'ai'
import { AGENT_REGISTRY } from './agents/registry'
import { getLanguageModel } from './providers/interface'
import type { ProviderType } from './providers/interface'

export interface HermesEvent {
  type: 'agent_status' | 'token' | 'tool_call' | 'tool_result' | 'section_complete' | 'done'
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

  const result = streamText({
    model,
    system: agentDef.systemPrompt,
    prompt,
    tools: agentDef.tools,
    maxSteps: 5,
  })

  for await (const event of result.fullStream) {
    switch (event.type) {
      case 'text-delta':
        yield { type: 'token', token: event.textDelta, agent: agentName }
        break
      case 'tool-call':
        yield { type: 'tool_call', agent: agentName, tool: event.toolName, args: event.args }
        break
      case 'tool-result':
        yield { type: 'tool_result', agent: agentName, tool: event.toolName, result: event.result }
        break
    }
  }

  yield { type: 'agent_status', agent: agentName, status: 'writing' }
  yield { type: 'done', agent: agentName }
}

export async function orchestrateGeneration(projectId: string, prompt: string, documentId: string): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate() {
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

    yield { type: 'done', document_id: documentId }
  }

  return orchestrate()
}