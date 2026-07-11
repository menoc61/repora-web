import { Router } from 'express'
import { config } from '../config'
import { getAvailableModels, probeToolSupport } from '../ai/hermes'

export const modelsRouter = Router()

// GET /models — simple list of model names
modelsRouter.get('/', async (_req, res) => {
  try {
    const cachedModels = getAvailableModels()
    if (cachedModels.length > 0) {
      res.json(cachedModels)
      return
    }

    const { execSync } = await import('child_process')
    const stdout = execSync('ollama list', { encoding: 'utf-8', timeout: 5000 })
    const lines = stdout.trim().split('\n').slice(1)
    const names = lines.map(line => line.trim().split(/\s+/)[0]).filter(Boolean)
    res.json(names)
  } catch {
    try {
      const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
      const response = await fetch(`${baseUrl}/api/tags`)
      if (!response.ok) { res.json([]); return }
      const data = (await response.json()) as { models?: Array<{ name: string }> }
      res.json((data.models || []).map(m => m.name))
    } catch {
      res.json([])
    }
  }
})

// GET /models/detailed — list with tool support, cloud/local info
modelsRouter.get('/detailed', async (_req, res) => {
  try {
    const cachedModels = getAvailableModels()
    const models = cachedModels.length > 0 ? cachedModels : await fetchModelList()

    const detailed = await Promise.all(
      models.map(async (name) => {
        const isCloud = name.includes(':cloud') || name.includes('-cloud')
        const supportsTools = await probeToolSupport('ollama', name)
        return { name, isCloud, supportsTools }
      })
    )

    res.json(detailed)
  } catch {
    res.json([])
  }
})

async function fetchModelList(): Promise<string[]> {
  try {
    const { execSync } = await import('child_process')
    const stdout = execSync('ollama list', { encoding: 'utf-8', timeout: 5000 })
    const lines = stdout.trim().split('\n').slice(1)
    return lines.map(line => line.trim().split(/\s+/)[0]).filter(Boolean)
  } catch {
    return []
  }
}
