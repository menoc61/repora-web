import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { updateDocumentSchema, createCommentSchema } from '../validation/schemas'
import { getDocument, listDocuments, createValidationToken, createVersion, listVersions, getVersion, getVersionByNumber, reconcileSectionsFromMarkdown, renameDocument, deleteDocument } from '../services/document.service'
import { exportDocument, getStoredExport } from '../services/export.service'
import { logAudit } from '../services/audit.service'
import { getGenerationState, streamGeneration, clearGenerationState } from '../ai/hermes'
import { listComments, addComment } from '../services/comment.service'
import { db } from '../db'
import { documents, sections } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export const documentRouter = Router()

type VersionSnapshot = { id: string; sections: Array<{ id?: string; title?: string; content?: string; order?: number; status?: string }>; documentStatus: string | null }

// Snapshot the current section state as a new version (so a restore is itself
// reversible), then overwrite the document's sections with the target snapshot.
async function restoreToVersion(id: string, userId: string, target: VersionSnapshot): Promise<void> {
  const currentSections = await db.select().from(sections).where(eq(sections.documentId, id)).orderBy(sections.order)
  const [currentDoc] = await db.select({ status: documents.status }).from(documents).where(eq(documents.id, id)).limit(1)
  await createVersion(
    id,
    userId,
    currentSections.map((s) => ({ id: s.id, title: s.title, content: s.content, order: s.order, status: s.status })),
    currentDoc?.status,
    'Auto-backup before restore',
  )

  const versionSections = target.sections
  if (Array.isArray(versionSections) && versionSections.length) {
    await db.delete(sections).where(eq(sections.documentId, id))
    for (const sec of versionSections) {
      await db.insert(sections).values({
        documentId: id,
        title: sec.title ?? '',
        content: sec.content ?? '',
        order: sec.order ?? 0,
        status: sec.status ?? 'draft',
      })
    }
  }

  if (target.documentStatus) {
    await db.update(documents).set({ status: target.documentStatus, updatedAt: new Date() }).where(eq(documents.id, id))
  }
}

documentRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined
    const docs = await listDocuments(req.user!.userId, req.user!.role, { status, search })
    res.json(docs)
  } catch (err) { next(err) }
})

documentRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocument(req.params.id as string, req.user!.userId, req.user!.role)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const docId = req.params.id as string
    await deleteDocument(docId, req.user!.userId, req.user!.role)
    await logAudit({ userId: req.user!.userId, action: 'document.deleted', target: docId })
    res.json({ ok: true, id: docId })
  } catch (err) { next(err) }
})

documentRouter.get('/:id/stream', requireAuth, async (req, res, next) => {
  try {
    const docId = req.params.id as string
    const state = getGenerationState(docId)

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    if (!state) {
      // No active generation — send done immediately so the frontend doesn't error
      res.write(`data: ${JSON.stringify({ type: 'done', document_id: docId })}\n\n`)
      res.end()
      return
    }

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Handle client disconnect — stop sending events but don't kill the pipeline
    let disconnected = false
    req.on('close', () => { disconnected = true })

    for await (const event of streamGeneration(docId)) {
      if (disconnected) break
      sendEvent(event)
    }

    if (!disconnected) res.end()
  } catch (err) {
    clearGenerationState(req.params.id as string)
    next(err)
  }
})

documentRouter.post('/:id/validation-token', requireAuth, async (req, res, next) => {
  try {
    const token = await createValidationToken(req.params.id as string, req.user!.userId, req.user!.role)
    await logAudit({ userId: req.user!.userId, action: 'validation.token_created', target: req.params.id as string, metadata: { token } })
    res.json({ token })
  } catch (err) { next(err) }
})

documentRouter.get('/:id/export', requireAuth, async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'pdf'
    if (!['pdf', 'docx', 'md'].includes(format)) {
      res.status(400).json({ error: { code: 'invalid_format', message: 'Format must be pdf, docx, or md' } })
      return
    }
    const docId = req.params.id as string

    // Try to serve from S3 cache first (fast path)
    const stored = await getStoredExport(docId, format)
    if (stored) {
      res.setHeader('Content-Type', stored.mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`)
      res.setHeader('X-Cache', 'HIT')
      res.send(stored.buffer)
      await logAudit({ userId: req.user!.userId, action: 'document.exported', target: docId, metadata: { format, cached: true } })
      return
    }

    // Generate fresh export (slow path, then stores in S3)
    const result = await exportDocument(docId, format as 'pdf' | 'docx' | 'md', req.user!.userId, req.user!.role)
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('X-Cache', 'MISS')
    res.send(result.buffer)
    await logAudit({ userId: req.user!.userId, action: 'document.exported', target: docId, metadata: { format, cached: false } })
  } catch (err) { next(err) }
})

documentRouter.get('/:id/versions', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string
    const versions = await listVersions(id)
    res.json(versions.map((v) => ({
      id: v.id,
      version: v.version,
      label: v.label,
      documentStatus: v.documentStatus,
      createdBy: v.createdBy,
      timestamp: v.createdAt?.toISOString() ?? new Date().toISOString(),
      sectionCount: Array.isArray(v.sections) ? v.sections.length : 0,
    })))
  } catch (err) { next(err) }
})

documentRouter.post('/:id/versions/restore', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string
    const versionId = req.body.versionId as string

    if (!versionId) {
      res.status(400).json({ error: { code: 'missing_version_id', message: 'versionId is required' } })
      return
    }

    const version = await getVersion(versionId, id)
    if (!version) {
      res.status(404).json({ error: { code: 'not_found', message: 'Version not found' } })
      return
    }

    await restoreToVersion(id, req.user!.userId, version)

    await logAudit({ userId: req.user!.userId, action: 'document.version_restored', target: id, metadata: { restoredFromVersion: versionId } })
    res.json({ ok: true, restoredFromVersion: versionId })
  } catch (err) { next(err) }
})

documentRouter.post('/:id/restore', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string
    const { versionId, version } = req.body

    let resolvedVersionId: string | undefined = versionId as string | undefined
    let target: Awaited<ReturnType<typeof getVersion>> | null = null

    if (resolvedVersionId) {
      target = await getVersion(resolvedVersionId, id)
    } else if (version != null) {
      const versionNum = parseInt(String(version).replace(/[^0-9]/g, ''), 10)
      if (isNaN(versionNum) || versionNum < 1) {
        res.status(400).json({ error: { code: 'invalid_version', message: 'version must be a positive number or valid version label' } })
        return
      }
      target = await getVersionByNumber(id, versionNum)
      if (!target) {
        const all = await listVersions(id)
        res.status(404).json({ error: { code: 'not_found', message: `Version ${versionNum} not found. Latest version is ${all.length}` } })
        return
      }
      resolvedVersionId = target.id
    }

    if (!target) {
      res.status(400).json({ error: { code: 'missing_version', message: 'versionId or version is required' } })
      return
    }

    await restoreToVersion(id, req.user!.userId, target)

    await logAudit({
      userId: req.user!.userId,
      action: 'document.version_restored',
      target: id,
      metadata: { restoredFromVersion: resolvedVersionId, versionRequested: version ?? versionId },
    })
    res.json({ ok: true, restoredFromVersion: resolvedVersionId })
  } catch (err) { next(err) }
})

documentRouter.patch('/:id', requireAuth, validate(updateDocumentSchema), async (req, res, next) => {
  try {
    const docId = req.params.id as string
    const { sections: incomingSections, title, status, content } = req.body

    if (title) {
      await renameDocument(docId, title, req.user!.userId, req.user!.role)
    }

    if (status) {
      await db.update(documents).set({ status, updatedAt: new Date() }).where(eq(documents.id, docId))
    }

    if (incomingSections && Array.isArray(incomingSections)) {
      for (const s of incomingSections) {
        if (s.id) {
          await db.update(sections)
            .set({ content: s.content ?? '', title: s.title ?? '', updatedAt: new Date() })
            .where(eq(sections.id, s.id))
        }
      }
    } else if (typeof content === 'string' && content.length > 0) {
      // Editor autosave sends the full document as markdown. Reconcile it into
      // structured sections so user edits actually persist.
      await reconcileSectionsFromMarkdown(docId, content)
    }

    const doc = await getDocument(docId, req.user!.userId, req.user!.role)

    // Record a version snapshot whenever content is actually saved (not on a
    // pure status ping), so version history is decoupled from audit logs.
    const contentChanged =
      (incomingSections && Array.isArray(incomingSections)) ||
      (typeof content === 'string' && content.length > 0)
    if (contentChanged) {
      await createVersion(
        docId,
        req.user!.userId,
        doc.sections.map((s) => ({ id: s.id, title: s.title, content: s.content, order: s.order, status: s.status })),
        (status as string) || doc.status,
        title ? `Save: ${title}` : 'Document save',
      )
    }

    await logAudit({ userId: req.user!.userId, action: 'document.updated', target: docId })
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const docId = req.params.id as string
    await db.update(documents).set({ status: 'validated', updatedAt: new Date() }).where(eq(documents.id, docId))
    await logAudit({ userId: req.user!.userId, action: 'document.changes_accepted', target: docId })
    const doc = await getDocument(docId, req.user!.userId, req.user!.role)
    res.json(doc)
  } catch (err) { next(err) }
})

documentRouter.patch('/:id/patch', requireAuth, async (req, res, next) => {
  try {
    const { sectionId, content } = req.body
    if (!sectionId) throw new AppError(400, 'missing_fields', 'sectionId is required')

    const [section] = await db.update(sections)
      .set({ content: content ?? '', updatedAt: new Date() })
      .where(eq(sections.id, sectionId))
      .returning()

    if (!section) throw new AppError(404, 'not_found', 'Section not found')
    await logAudit({ userId: req.user!.userId, action: 'section.patch_applied', target: sectionId, metadata: { documentId: req.params.id as string } })
    res.json(section)
  } catch (err) { next(err) }
})

documentRouter.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const documentId = req.params.id as string
    const docSections = await db.select().from(sections).where(eq(sections.documentId, documentId))
    let allComments: unknown[] = []
    for (const s of docSections) {
      const sectionComments = await listComments(s.id)
      allComments = allComments.concat(sectionComments)
    }
    res.json(allComments)
  } catch (err) { next(err) }
})

documentRouter.post('/:id/comments', requireAuth, validate(createCommentSchema), async (req, res, next) => {
  try {
    const { sectionId, text } = req.body
    const comment = await addComment(sectionId, req.user!.userId, text)
    await logAudit({ userId: req.user!.userId, action: 'comment.created', target: comment.id, metadata: { documentId: req.params.id as string } })
    res.status(201).json(comment)
  } catch (err) { next(err) }
})
