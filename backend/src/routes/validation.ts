import { Router } from 'express'
import { db } from '../db'
import { validations } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export const validationRouter = Router()

validationRouter.get('/:token', async (req, res, next) => {
  try {
    const [validation] = await db.select().from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')
    res.json({ document_id: validation.documentId, decision: validation.decision })
  } catch (err) { next(err) }
})

validationRouter.post('/:token/decision', async (req, res, next) => {
  try {
    const [validation] = await db.select().from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')
    if (validation.decision) throw new AppError(400, 'already_decided', 'Validation already completed')
    const { decision, section_reasons } = req.body
    await db.update(validations)
      .set({ decision, sectionReasons: section_reasons, decidedAt: new Date() })
      .where(eq(validations.id, validation.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
})
