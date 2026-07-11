import { streamText, isStepCount } from 'ai'
import type { Tool } from 'ai'
import { AGENT_REGISTRY } from './agents/registry'
import { getLanguageModel, setDefaultModel, defaultModel, knownToolCallers } from './providers/interface'
import type { ProviderType } from './providers/interface'
import { config } from '../config'
import { db } from '../db'
import { agentConfigs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

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

let discoveredModel = config.ollamaModel
let availableModels: string[] = []

// Runtime tool-support cache: model name → supports tools
// Populated by probeToolSupport() at startup, queried by runAgent()
const toolSupportCache = new Map<string, boolean>()

/**
 * Probe whether a model actually supports tool calling by sending a minimal
 * request with tools. Caches the result so each model is only tested once.
 * This is the source of truth — the name-based heuristic in modelSupportsTools()
 * is a fallback for models not in the cache.
 */
export async function probeToolSupport(
  provider: ProviderType,
  modelId: string,
  apiKey?: string,
): Promise<boolean> {
  const cacheKey = `${provider}:${modelId}`
  if (toolSupportCache.has(cacheKey)) return toolSupportCache.get(cacheKey)!

  // For non-local providers, trust the name heuristic (they're well-tested APIs)
  if (provider !== 'ollama' && provider !== 'llama_cpp') {
    const result = modelId.toLowerCase().includes('gpt') || modelId.toLowerCase().includes('claude') || modelId.toLowerCase().includes('gemini')
    toolSupportCache.set(cacheKey, result)
    return result
  }

  console.log(`[Hermes] Probing tool support for ${modelId}...`)
  const probeTool = {
    description: 'Say hello',
    inputSchema: z.object({ name: z.string() }),
  }

  try {
    const model = getLanguageModel(provider, modelId, apiKey)
    const stream = await streamText({
      model,
      messages: [{ role: 'user', content: 'Say hello' }],
      tools: { hello: probeTool },
      stopWhen: isStepCount(1),
    })

    let gotToolCall = false
    let gotText = false
    for await (const event of stream.fullStream) {
      if (event.type === 'tool-call') gotToolCall = true
      if (event.type === 'text-delta') gotText = true
      if (event.type === 'error') throw event.error
    }
    // If the model produced a tool call, it supports tools.
    // If it produced text but no tool call, it doesn't (or chose not to).
    // If it errored, it doesn't.
    const supports = gotToolCall
    toolSupportCache.set(cacheKey, supports)
    console.log(`[Hermes] Tool support for ${modelId}: ${supports ? 'YES' : 'no'}`)
    return supports
  } catch (err) {
    toolSupportCache.set(cacheKey, false)
    console.log(`[Hermes] Tool support for ${modelId}: no (probe error: ${(err as Error).message?.slice(0, 80)})`)
    return false
  }
}

/**
 * Probe all available models at startup. Runs in background, non-blocking.
 */
export async function probeAllModels(provider: ProviderType, apiKey?: string): Promise<void> {
  for (const modelId of availableModels) {
    await probeToolSupport(provider, modelId, apiKey)
  }
}

async function enumerateOllamaModels(): Promise<string[]> {
  // Use ollama list CLI for reliable detection
  try {
    const { execSync } = await import('child_process')
    const stdout = execSync('ollama list', { encoding: 'utf-8', timeout: 5000 })
    const lines = stdout.trim().split('\n').slice(1) // skip header
    const models = lines
      .map(line => line.trim().split(/\s+/)[0])
      .filter(Boolean)
    if (models.length > 0) return models
  } catch { /* fall through to HTTP API */ }

  // Fallback: try Ollama HTTP API
  try {
    const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
    const res = await fetch(`${baseUrl}/api/tags`)
    if (res.ok) {
      const data = (await res.json()) as { models?: Array<{ name: string }> }
      if (data.models && data.models.length > 0) return data.models.map(m => m.name)
    }
  } catch { /* none found */ }

  return []
}

export async function discoverOllamaModel(): Promise<string> {
  // Always enumerate available models so they can be probed for tool support.
  const models = await enumerateOllamaModels()
  if (models.length > 0) {
    availableModels = models
    console.log(`[Hermes] Detected ${availableModels.length} Ollama model(s): ${availableModels.join(', ')}`)
  } else {
    console.log('[Hermes] No Ollama models detected via CLI or API')
  }

  // 1. Respect OLLAMA_MODEL env var if set — becomes the default.
  if (config.ollamaModel) {
    discoveredModel = config.ollamaModel
    setDefaultModel(discoveredModel)
    // Ensure the env-selected model is in the probe list even if `ollama list` missed it.
    if (!availableModels.includes(discoveredModel)) availableModels.unshift(discoveredModel)
    console.log(`[Hermes] Using OLLAMA_MODEL from env: ${discoveredModel}`)
    return discoveredModel
  }

  // 2. Otherwise pick the first detected model as default.
  if (availableModels.length > 0) {
    discoveredModel = availableModels[0]
    setDefaultModel(discoveredModel)
    console.log(`[Hermes] Default model: ${discoveredModel} (set OLLAMA_MODEL env var to override)`)
  }
  return discoveredModel
}

export function getDefaultModel(): string {
  return defaultModel
}

export function getAvailableModels(): string[] {
  return availableModels
}

/**
 * Check if a model actually supports tools. First checks the runtime probe
 * cache, then falls back to a name-based heuristic.
 */
export function supportsTools(modelId: string, provider?: ProviderType): boolean {
  const cacheKey = `${provider || 'unknown'}:${modelId}`
  if (toolSupportCache.has(cacheKey)) return toolSupportCache.get(cacheKey)!

  // Fallback heuristic for models not yet probed — shared list from interface.ts
  const normalized = modelId.toLowerCase()
  return knownToolCallers.some(k => normalized.includes(k))
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

  // Resolution order: DB config > registry defaults > discovered model
  let provider = agentDef.defaultProvider as ProviderType
  let modelId = agentDef.defaultModel
  let temperature: number | undefined
  let topP: number | undefined
  let maxTokens: number | undefined

  try {
    const [dbConfig] = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.agentName, agentName))
      .limit(1)
    if (dbConfig) {
      provider = (dbConfig.provider || agentDef.defaultProvider) as ProviderType
      modelId = dbConfig.modelId || agentDef.defaultModel
      temperature = dbConfig.temperature ?? undefined
      topP = dbConfig.topP ?? undefined
      maxTokens = dbConfig.maxTokens ?? undefined
    }
  } catch {
    // DB read failed — use registry defaults
  }

  // For Ollama: if no specific model set in DB, use the discovered model
  if (provider === 'ollama') {
    if (!modelId || modelId === agentDef.defaultModel) {
      modelId = discoveredModel
    }
    // Ollama doesn't need an API key
    apiKey = undefined
  }

  const model = getLanguageModel(provider, modelId, apiKey)
  const hasTools = Object.keys(agentDef.tools).length > 0

  // Use the runtime probe cache to decide whether to pass tools
  const supportsToolCalling = supportsTools(modelId, provider)
  const tools = supportsToolCalling && hasTools
    ? (agentDef.tools as Record<string, Tool>)
    : undefined

  // G6: maxSteps exhaustion handled by SDK stopWhen — stops after maxSteps LLM calls.
  const agentMaxSteps = supportsToolCalling ? 10 : 3

  async function* generateWithoutTools(): AsyncGenerator<HermesEvent> {
    const fallbackStream = await streamText({
      model,
      system: agentDef.systemPrompt,
      prompt,
      temperature,
      topP,
      stopWhen: isStepCount(3),
    })
    for await (const event of fallbackStream.fullStream) {
      switch (event.type) {
        case 'text-delta':
          yield { type: 'token', token: event.text, agent: agentName }
          break
      }
    }
  }

  try {
    const stream = await streamText({
      model,
      system: agentDef.systemPrompt,
      prompt,
      tools,
      temperature,
      topP,
      stopWhen: isStepCount(agentMaxSteps),
    })

    let hasOutput = false
    for await (const event of stream.fullStream) {
      switch (event.type) {
        case 'text-delta':
          hasOutput = true
          yield { type: 'token', token: event.text, agent: agentName }
          break
        case 'tool-call':
          hasOutput = true
          yield { type: 'tool_call', agent: agentName, tool: event.toolName, args: event.input }
          break
        case 'tool-result':
          yield { type: 'tool_result', agent: agentName, tool: event.toolName, result: event.output }
          break
      }
    }

    // If tools were passed but the model produced zero output,
    // the model silently failed to handle tools. Retry without.
    if (tools && !hasOutput) {
      console.warn(`[Hermes] ${agentName}: zero output with tools — retrying without tools`)
      yield* generateWithoutTools()
    }
  } catch (err) {
    // Any error when tools are passed → retry without tools
    if (tools) {
      console.warn(`[Hermes] ${agentName}: error with tools (${(err as Error).message?.slice(0, 80)}) — retrying without tools`)
      yield* generateWithoutTools()
    } else {
      throw err
    }
  }

  yield { type: 'agent_status', agent: agentName, status: 'done' }
  yield { type: 'done', agent: agentName }
}

// -- Generation tracking -----------------------------------------------------

interface GenerationState {
  events: HermesEvent[]
  listeners: Set<(event: HermesEvent) => void>
  done: boolean
  error?: Error
}

const generationStates = new Map<string, GenerationState>()

export function getGenerationState(documentId: string): GenerationState | undefined {
  return generationStates.get(documentId)
}

export function clearGenerationState(documentId: string) {
  generationStates.delete(documentId)
}

import { orchestrateGeneration } from './pipeline/orchestrate'

/**
 * Start the pipeline in the background, independent of any stream connection.
 * Events are buffered and broadcast to any connected stream clients.
 * The pipeline runs to completion even if nobody is listening.
 */
export function initiateGeneration(projectId: string, prompt: string, documentId: string, templateId?: string, config?: Record<string, unknown>): void {
  const state: GenerationState = { events: [], listeners: new Set(), done: false }
  generationStates.set(documentId, state)

  // Run the pipeline eagerly in the background (fire-and-forget)
  ;(async () => {
    try {
      const gen = await orchestrateGeneration(projectId, prompt, documentId, templateId, config)
      for await (const event of gen) {
        state.events.push(event)
        // Broadcast to all connected stream listeners
        for (const listener of state.listeners) {
          try { listener(event) } catch { /* listener disconnected */ }
        }
      }
    } catch (err) {
      state.error = err as Error
      const errorEvent: HermesEvent = {
        type: 'generation_error',
        agent: 'Hermes',
        message: (err as Error).message,
        error_type: 'pipeline_error',
      }
      state.events.push(errorEvent)
      for (const listener of state.listeners) {
        try { listener(errorEvent) } catch { /* listener disconnected */ }
      }
    } finally {
      state.done = true
      // Signal completion to all listeners
      for (const listener of state.listeners) {
        try { listener({ type: 'done', document_id: documentId } as HermesEvent) } catch { /* ignore */ }
      }
    }
  })()
}

/**
 * Subscribe to a running generation's events.
 * Returns an async iterator that yields events.
 * If the pipeline already finished, yields buffered events immediately.
 */
export async function* streamGeneration(documentId: string): AsyncGenerator<HermesEvent> {
  const state = generationStates.get(documentId)
  if (!state) return

  // Yield already-buffered events first
  for (const event of state.events) {
    yield event
  }

  if (state.done) return

  // Subscribe for future events
  let resolve: (() => void) | null = null
  const queue: HermesEvent[] = []
  const onEvent = (event: HermesEvent) => {
    queue.push(event)
    resolve?.()
  }

  state.listeners.add(onEvent)
  try {
    while (!state.done || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise<void>((r) => { resolve = r })
      }
      while (queue.length > 0) {
        yield queue.shift()!
      }
    }
  } finally {
    state.listeners.delete(onEvent)
  }
}
