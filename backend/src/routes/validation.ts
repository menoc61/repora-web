import { Router } from 'express'
import { db } from '../db'
import { validations, diagrams, documents } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import { getDocumentByValidationToken } from '../services/document.service'
import { logAudit } from '../services/audit.service'
import { broadcastNotification } from '../collaboration/ws'

export const validationRouter = Router()

validationRouter.get('/:token', async (req, res, next) => {
  try {
    const result = await getDocumentByValidationToken(req.params.token)
    res.json(result)
  } catch (err) { next(err) }
})

validationRouter.get('/:token/diagrams', async (req, res, next) => {
  try {
    const [validation] = await db.select({ documentId: validations.documentId })
      .from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')

    const [doc] = await db.select({ projectId: documents.projectId })
      .from(documents).where(eq(documents.id, validation.documentId)).limit(1)
    if (!doc) throw new AppError(404, 'not_found', 'Document not found')

    const diags = await db.select().from(diagrams).where(eq(diagrams.projectId, doc.projectId))
    res.json(diags.map(d => ({
      id: d.id,
      type: d.type,
      renderedUrl: d.renderedUrl,
    })))
  } catch (err) { next(err) }
})

validationRouter.post('/:token/decision', async (req, res, next) => {
  try {
    const [validation] = await db.select().from(validations).where(eq(validations.validatorToken, req.params.token)).limit(1)
    if (!validation) throw new AppError(404, 'not_found', 'Invalid validation token')
    if (validation.decision) throw new AppError(400, 'already_decided', 'Validation already completed')
    const { decision, section_reasons } = req.body
    if (!decision) throw new AppError(400, 'missing_fields', 'decision is required')
    await db.update(validations)
      .set({ decision, sectionReasons: section_reasons ?? null, decidedAt: new Date() })
      .where(eq(validations.id, validation.id))
    await logAudit({
      userId: null,
      action: `document.${decision}`,
      target: validation.documentId,
      metadata: { decision, section_reasons: section_reasons ?? null, validationId: validation.id },
    })
    broadcastNotification({
      type: 'validation',
      title: decision === 'approved' ? 'Document approuve' : 'Document rejete',
      message: decision === 'approved'
        ? 'Le client a approuve le document. Il est pret pour la suite.'
        : 'Le client a rejete le document. Consultez les motifs de rejet.',
      data: { documentId: validation.documentId, decision },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})
