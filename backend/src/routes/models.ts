import { Router } from 'express'
import { config } from '../config'

export const modelsRouter = Router()

modelsRouter.get('/', async (_req, res) => {
  try {
    // Use ollama list CLI for reliable detection
    const { execSync } = await import('child_process')
    const stdout = execSync('ollama list', { encoding: 'utf-8', timeout: 5000 })
    const lines = stdout.trim().split('\n').slice(1)
    const names = lines.map(line => line.trim().split(/\s+/)[0]).filter(Boolean)
    res.json(names)
  } catch {
    // Fallback: try HTTP API
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
