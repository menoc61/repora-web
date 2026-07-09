import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { listAgents, patchAgent, getMetrics, getLogs } from '../services/admin.service'
import { AppError } from '../middleware/error'

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

adminRouter.get('/agents', requireAuth, async (req, res, next) => {
  try {
    const agents = await listAgents()
    res.json(agents)
  } catch (err) { next(err) }
})

adminRouter.patch('/agents/:name', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.params.name)
    if (!name) return next(new AppError(400, 'missing_name', 'Agent name is required'))
    await patchAgent(name, req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
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

adminRouter.get('/logs', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const logs = await getLogs()
    res.json(logs)
  } catch (err) { next(err) }
})

adminRouter.get('/metrics', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const metrics = await getMetrics()
    res.json(metrics)
  } catch (err) { next(err) }
})
