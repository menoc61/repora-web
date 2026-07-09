import { Router, Request, Response } from 'express'

export const validationRouter = Router()

validationRouter.get('/:token', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

validationRouter.post('/:token/decision', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})
