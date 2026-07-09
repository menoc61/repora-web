import { Router, Request, Response } from 'express'
import { listTemplates, getTemplate } from '../services/template.service'

export const templateRouter = Router()

templateRouter.get('/', (_req: Request, res: Response) => {
  res.json(listTemplates())
})

templateRouter.get('/:id', (req: Request, res: Response) => {
  const template = getTemplate(req.params.id as string)
  if (!template) {
    res.status(404).json({ error: { code: 'not_found', message: 'Template not found' } })
    return
  }
  res.json(template)
})

templateRouter.post('/', (req: Request, res: Response) => {
  const { name, category, description, sections } = req.body
  const template = {
    id: String(Date.now()),
    name: name ?? 'Untitled',
    category: category ?? 'General',
    description: description ?? '',
    sections: sections ?? [],
  }
  res.status(201).json(template)
})
