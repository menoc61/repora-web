import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { config } from '../../config'

export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'openrouter' | 'byok'

function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'llama_cpp':
      return createOpenAICompatible({ name: 'llama', baseURL: config.llamaCppUrl })
    case 'ollama':
      return createOpenAICompatible({ name: 'ollama', baseURL: config.ollamaUrl })
    case 'openai':
      return createOpenAICompatible({ name: 'byok-openai', baseURL: 'https://api.openai.com/v1', apiKey: apiKey || '' })
    case 'anthropic':
      return createOpenAICompatible({ name: 'byok-anthropic', baseURL: 'https://api.anthropic.com/v1', apiKey: apiKey || '', headers: { 'anthropic-version': '2023-06-01' } })
    case 'google':
      return createOpenAICompatible({ name: 'byok-google', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: apiKey || '' })
    case 'openrouter':
      return createOpenAICompatible({ name: 'byok-openrouter', baseURL: 'https://openrouter.ai/api/v1', apiKey: apiKey || '' })
    default:
      return createOpenAICompatible({ name: 'byok', baseURL: config.ollamaUrl })
  }
}

export function getLanguageModel(provider: ProviderType, modelId: string, apiKey?: string) {
  const prov = createProvider(provider, apiKey)
  return prov.chatModel(modelId)
}
