import { Router, Request, Response } from 'express'

export const documentRouter = Router()

documentRouter.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

documentRouter.get('/:id/stream', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

documentRouter.get('/:id/export', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})
