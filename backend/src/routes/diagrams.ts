import { Router, Request, Response } from 'express'

export const diagramRouter = Router()

diagramRouter.post('/:id/diagrams', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

diagramRouter.get('/diagrams/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

diagramRouter.post('/diagrams/:id/export', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})
