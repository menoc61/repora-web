import { Router, Request, Response } from 'express'

export const adminRouter = Router()

adminRouter.get('/users', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.post('/users', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.patch('/users/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.delete('/users/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.get('/agents', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.patch('/agents', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.get('/api-keys', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.post('/api-keys', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.delete('/api-keys/:id', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.get('/logs', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})

adminRouter.get('/metrics', (_req: Request, res: Response) => {
  res.status(501).json({ error: { code: 'not_implemented', message: 'Not implemented' } })
})
