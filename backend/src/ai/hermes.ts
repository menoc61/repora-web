import { streamText, isStepCount } from 'ai'
import type { Tool } from 'ai'
import { AGENT_REGISTRY } from './agents/registry'
import { getLanguageModel, modelSupportsTools, setDefaultModel, defaultModel } from './providers/interface'
import type { ProviderType } from './providers/interface'
import { config } from '../config'

// Re-export the orchestrator pipeline (refactored into pipeline/ directory)
export { orchestrateGeneration } from './pipeline/orchestrate'

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
  type: 'context_updated'
  agent: string
  key: string
  value: unknown
  [key: string]: unknown
} | {
  type: 'generation_error'
  agent: string
  message: string
  error_type?: string
  section_id?: string
  [key: string]: unknown
} | {
  type: 'done'
  document_id?: string
  [key: string]: unknown
}

// -- Model discovery ---------------------------------------------------------

let discoveredModel = 'llama3.1:8b'

export async function discoverOllamaModel(): Promise<string> {
  try {
    const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
    const res = await fetch(`${baseUrl}/api/tags`)
    if (!res.ok) return discoveredModel
    const data = (await res.json()) as { models?: Array<{ name: string }> }
    if (data.models && data.models.length > 0) {
      discoveredModel = data.models[0].name
      setDefaultModel(discoveredModel)
    }
  } catch { /* use default */ }
  return discoveredModel
}

export function getDefaultModel(): string {
  return defaultModel
}

// -- Agent runner ------------------------------------------------------------

export async function* runAgent(
  agentName: string,
  prompt: string,
  context: { documentId?: string; projectId?: string; sectionId?: string },
  apiKey?: string,
): AsyncGenerator<HermesEvent> {
  const agentDef = AGENT_REGISTRY[agentName]
  if (!agentDef) throw new Error(`Unknown agent: ${agentName}`)

  yield { type: 'agent_status', agent: agentName, status: 'thinking' }

  // For ollama we use the discovered model; for other providers use the agent default.
  const modelId = agentDef.defaultProvider === 'ollama'
    ? discoveredModel
    : agentDef.defaultModel

  // G5: BYOK boundary check — when provider is llama_cpp or ollama, no API key is sent.
  // The getLanguageModel fn routes to local provider when no apiKey is provided.
  const model = getLanguageModel(agentDef.defaultProvider as ProviderType, modelId, apiKey)

  // Check if the model name suggests tool-calling support. If not, skip tools
  // to avoid errors. If the heuristic is wrong and the model DOES support tools,
  // the agent still runs but without tool invocation — a safe degradation.
  const supportsTools = modelSupportsTools(modelId)
  const hasTools = Object.keys(agentDef.tools).length > 0
  const tools = supportsTools && hasTools
    ? (agentDef.tools as Record<string, Tool>)
    : undefined

  // G6: maxSteps exhaustion handled by SDK stopWhen — stops after maxSteps LLM calls.
  const maxSteps = supportsTools ? 10 : 3

  try {
    const stream = await streamText({
      model,
      system: agentDef.systemPrompt,
      prompt,
      tools,
      stopWhen: isStepCount(maxSteps),
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
  } catch (err) {
    // If the first attempt with tools failed (model doesn't actually support them),
    // retry with plain text generation (no tools).
    if (tools && (err as Error).message?.includes('tool')) {
      const fallbackStream = await streamText({
        model,
        system: agentDef.systemPrompt,
        prompt,
        stopWhen: isStepCount(3),
      })
      for await (const event of fallbackStream.fullStream) {
        switch (event.type) {
          case 'text-delta':
            yield { type: 'token', token: event.text, agent: agentName }
            break
        }
      }
    } else {
      throw err
    }
  }

  yield { type: 'agent_status', agent: agentName, status: 'done' }
  yield { type: 'done', agent: agentName }
}

// -- Generation tracking -----------------------------------------------------

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

import { orchestrateGeneration } from './pipeline/orchestrate'

export function initiateGeneration(projectId: string, prompt: string, documentId: string, templateId?: string): void {
  const gen = orchestrateGeneration(projectId, prompt, documentId, templateId)
  setActiveGeneration(documentId, gen)
}
