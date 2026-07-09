import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'

export const infrastructureRouter = Router()

infrastructureRouter.get('/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    services: {
      api: { status: 'up' },
      database: { status: 'up' },
      llama: { status: 'unknown' },
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

infrastructureRouter.post('/restart', requireAuth, requireRole('super_admin'), (_req: Request, res: Response) => {
  res.json({ ok: true })
})
