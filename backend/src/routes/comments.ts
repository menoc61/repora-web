import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { listComments, addComment, updateComment, deleteComment } from '../services/comment.service'
import { logAudit } from '../services/audit.service'

export const commentRouter = Router()

commentRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { text, resolved } = req.body
    const comment = await updateComment(req.params.id as string, { text, resolved })
    await logAudit({ userId: req.user!.userId, action: 'comment.updated', target: comment.id })
    res.json(comment)
  } catch (err) { next(err) }
})

commentRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteComment(req.params.id as string)
    await logAudit({ userId: req.user!.userId, action: 'comment.deleted', target: req.params.id as string })
    res.json({ ok: true })
  } catch (err) { next(err) }
})
