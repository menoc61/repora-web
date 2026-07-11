import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as diagramService from '../services/diagram.service'
import { config } from '../config'

export const diagramRouter = Router()
diagramRouter.use(requireAuth)

diagramRouter.post('/:id/diagrams', async (req, res, next) => {
  try {
    const result = await diagramService.createDiagram(req.params.id, req.body.type, req.body.source)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

diagramRouter.get('/diagrams/:id', async (req, res, next) => {
  try {
    const result = await diagramService.getDiagram(req.params.id)
    res.json(result)
  } catch (err) { next(err) }
})

diagramRouter.get('/diagrams/:id/export', async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'svg'
    const diagram = await diagramService.getDiagram(req.params.id)

    if (!diagram.plantuml_source) {
      res.status(404).json({ error: { code: 'no_source', message: 'Diagram has no PlantUML source' } })
      return
    }

    const { deflateSync } = await import('zlib')
    const deflated = deflateSync(Buffer.from(diagram.plantuml_source, 'utf-8'))
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    let encodedSource = ''
    for (let i = 0; i < deflated.length; i += 3) {
      const b1 = deflated[i]
      const b2 = deflated[i + 1] ?? 0
      const b3 = deflated[i + 2] ?? 0
      encodedSource += chars[b1 >> 2]
      encodedSource += chars[((b1 & 3) << 4) | (b2 >> 4)]
      encodedSource += i + 1 < deflated.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : ''
      encodedSource += i + 2 < deflated.length ? chars[b3 & 63] : ''
    }
    const baseUrl = config.plantumlUrl

    if (format === 'png') {
      const response = await fetch(`${baseUrl}/png/~1${encodedSource}`)
      if (!response.ok) throw new Error('PlantUML render failed')
      const buffer = Buffer.from(await response.arrayBuffer())
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="diagram-${req.params.id.slice(0, 8)}.png"`)
      res.send(buffer)
    } else {
      const response = await fetch(`${baseUrl}/svg/~1${encodedSource}`)
      if (!response.ok) throw new Error('PlantUML render failed')
      const svg = await response.text()
      res.setHeader('Content-Type', 'image/svg+xml')
      res.setHeader('Content-Disposition', `attachment; filename="diagram-${req.params.id.slice(0, 8)}.svg"`)
      res.send(svg)
    }
  } catch (err) { next(err) }
})
