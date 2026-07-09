import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { config } from '../../config'

export type ProviderType = 'llama_cpp' | 'openai' | 'anthropic' | 'google'

function createProvider(provider: ProviderType, apiKey?: string) {
  switch (provider) {
    case 'llama_cpp':
      return createOpenAICompatible({ name: 'llama', baseURL: config.llamaCppUrl })
    case 'openai':
      return createOpenAICompatible({ name: 'byok-openai', baseURL: 'https://api.openai.com/v1', apiKey: apiKey || '' })
    case 'anthropic':
      return createOpenAICompatible({ name: 'byok-anthropic', baseURL: 'https://api.anthropic.com/v1', apiKey: apiKey || '', headers: { 'anthropic-version': '2023-06-01' } })
    case 'google':
      return createOpenAICompatible({ name: 'byok-google', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: apiKey || '' })
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

export function getLanguageModel(provider: ProviderType, modelId: string, apiKey?: string) {
  const prov = createProvider(provider, apiKey)
  return prov.chatModel(modelId)
}
