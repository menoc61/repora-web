import { Router, Request, Response } from 'express'

export const exportRouter = Router()

exportRouter.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})
