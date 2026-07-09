import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { updateRequirement, deleteRequirement } from '../services/requirement.service'
import { logAudit } from '../services/audit.service'
import { AppError } from '../middleware/error'

export const requirementRouter = Router()

requirementRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { type, text, sourceActor } = req.body
    const requirement = await updateRequirement(req.params.id as string, { type, text, sourceActor })
    await logAudit({ userId: req.user!.userId, action: 'requirement.updated', target: requirement.id })
    res.json(requirement)
  } catch (err) { next(err) }
})

requirementRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteRequirement(req.params.id as string)
    await logAudit({ userId: req.user!.userId, action: 'requirement.deleted', target: req.params.id as string })
    res.json({ ok: true })
  } catch (err) { next(err) }
})
