import { Router, Request, Response } from 'express'
import { listTemplates, getTemplate } from '../services/template.service'
import { db, schema } from '../db'

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

templateRouter.post('/', async (req: Request, res: Response, next) => {
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
