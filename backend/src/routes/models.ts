import { Router } from 'express'
import { config } from '../config'

export const modelsRouter = Router()

modelsRouter.get('/', async (_req, res) => {
  try {
    const baseUrl = config.ollamaUrl.replace(/\/v1\/?$/, '')
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) {
      res.json([])
      return
    }
    const data = (await response.json()) as { models?: Array<{ name: string }> }
    const names = (data.models || []).map((m) => m.name)
    res.json(names)
  } catch {
    res.json([])
  }
})
