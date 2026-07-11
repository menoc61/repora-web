import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { config } from '../../config'

export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'openrouter' | 'byok'

// Default model read from config (OLLAMA_MODEL env var or fallback).
// Updated at startup by discoverOllamaModel().
export let defaultModel = config.ollamaModel

export function setDefaultModel(model: string) {
  defaultModel = model
}

// Best-effort heuristic to guess whether a model name indicates tool-calling capability.
// This is NOT a guarantee — it's used to decide whether to include tools in the first
// attempt. If tool calling fails at runtime, runAgent retries without tools.
export const knownToolCallers = [
  'hermes', 'functionary',
  'command-r', 'c4ai',
  'llama-3', 'llama3', 'llama-4', 'llama4',
  'mistral', 'mixtral', 'codestral',
  'qwen2', 'qwen-2', 'qwen2.5', 'qwen-2.5',
  'gemma-2', 'gemma2', 'gemma-3', 'gemma3',
  'phi-3', 'phi-4',
  'deepseek',
  'gpt-3.5', 'gpt-4', 'gpt-4o', 'o1', 'o3', 'o4',
  'claude', 'gemini',
  'tool', 'agent', 'function',
  'orion', 'arcee', 'nemo', 'nemotron',
  'kimi', 'minimax', 'glm', 'granite',
  'ornith', 'oh-dcft-v2',
]

export function modelSupportsTools(modelId: string): boolean {
  const normalized = modelId.toLowerCase()
  return knownToolCallers.some(k => normalized.includes(k))
}

function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'llama_cpp':
      return createOpenAICompatible({
        name: 'llama',
        baseURL: config.llamaCppUrl,
      })
    case 'ollama':
      return createOpenAICompatible({
        name: 'ollama',
        baseURL: config.ollamaUrl,
      })
    case 'openai':
      return createOpenAICompatible({
        name: 'openai',
        baseURL: 'https://api.openai.com/v1',
        apiKey: apiKey || '',
      })
    case 'anthropic':
      // Native @ai-sdk/anthropic SDK — full Anthropic Messages API support
      // including proper tool-calling, extended thinking, and prompt caching.
      // Previously this used an OpenAI-compatible wrapper which lacked these features.
      return createAnthropic({
        apiKey: apiKey || '',
      })
    case 'google':
      // Native @ai-sdk/google SDK — full Google Generative AI API support
      // including proper tool-calling (functionCall), grounding, safety settings,
      // code execution, and file search. Previously this used an OpenAI-compatible
      // wrapper which limited available Google-native features.
      return createGoogleGenerativeAI({
        apiKey: apiKey || '',
      })
    case 'openrouter':
      return createOpenAICompatible({
        name: 'openrouter',
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey || '',
      })
    case 'byok':
      if (!config.byokUrl) throw new Error('BYOK_BASE_URL not configured — set BYOK_BASE_URL env var or disable BYOK usage')
      return createOpenAICompatible({
        name: 'byok',
        baseURL: config.byokUrl,
        apiKey: apiKey || '',
      })
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function getLanguageModel(provider: ProviderType, modelId: string, apiKey?: string) {
  const prov = createProvider(provider, apiKey)
  if (provider === 'anthropic') {
    return (prov as ReturnType<typeof createAnthropic>).chat(modelId)
  }
  if (provider === 'google') {
    return (prov as ReturnType<typeof createGoogleGenerativeAI>).chat(modelId)
  }
  return (prov as ReturnType<typeof createOpenAICompatible>).chatModel(modelId)
}
