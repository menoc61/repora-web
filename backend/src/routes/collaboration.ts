import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { getActivity } from '../services/collaboration.service'

export const collaborationRouter = Router()

collaborationRouter.get('/activity', requireAuth, async (req, res, next) => {
  try {
    const activity = await getActivity()
    res.json(activity)
  } catch (err) { next(err) }
})

collaborationRouter.post('/invite', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true })
})

collaborationRouter.get('/collaborators', requireAuth, (_req: Request, res: Response) => {
  res.json([])
})
