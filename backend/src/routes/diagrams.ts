import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import * as diagramService from '../services/diagram.service'

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
