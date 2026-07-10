import { Router, Request, Response } from 'express'
import { listTemplates, getTemplate } from '../services/template.service'
import { requireAuth } from '../middleware/auth'
import { db, schema } from '../db'
import { AppError } from '../middleware/error'
import { eq } from 'drizzle-orm'

export const templateRouter = Router()

templateRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    const category = req.query.category as string | undefined
    const templates = await listTemplates(category)
    res.json(templates)
  } catch (err) { next(err) }
})

templateRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const template = await getTemplate(req.params.id as string)
    if (!template) {
      res.status(404).json({ error: { code: 'not_found', message: 'Template not found' } })
      return
    }
    res.json(template)
  } catch (err) { next(err) }
})

templateRouter.post('/', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { name, category, description, sections } = req.body
    const [template] = await db.insert(schema.templates).values({
      name: name ?? 'Untitled',
      category: category ?? 'General',
      description: description ?? '',
      sections: sections ?? [],
    }).returning()
    res.status(201).json(template)
  } catch (err) { next(err) }
})

templateRouter.post('/use', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { templateId, projectId } = req.body
    if (!templateId) throw new AppError(400, 'missing_fields', 'templateId is required')

    const template = await getTemplate(templateId)
    if (!template) throw new AppError(404, 'not_found', 'Template not found')

    const templateSections = (template.sections as string[]) ?? []
    let resolvedProjectId = projectId as string | undefined

    if (!resolvedProjectId) {
      const [project] = await db.insert(schema.projects).values({
        ownerId: req.user!.userId,
        name: template.name,
        brief: template.description ?? '',
        status: 'draft',
      }).returning()
      resolvedProjectId = project.id
    }

    const [doc] = await db.insert(schema.documents).values({
      projectId: resolvedProjectId,
      status: 'draft',
      outline: { title: template.name, templateId: template.id },
    }).returning()

    for (let i = 0; i < templateSections.length; i++) {
      await db.insert(schema.sections).values({
        documentId: doc.id,
        order: i + 1,
        title: templateSections[i],
        content: '',
        status: 'draft',
      })
    }

    const sectionsList = await db.select().from(schema.sections)
      .where(eq(schema.sections.documentId, doc.id))
      .orderBy(schema.sections.order)

    res.status(201).json({ ...doc, sections: sectionsList, projectId: resolvedProjectId })
  } catch (err) { next(err) }
})
