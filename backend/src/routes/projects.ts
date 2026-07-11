import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  generateDocument,
} from '../services/project.service'
import { listRequirements, createRequirement } from '../services/requirement.service'
import { logAudit } from '../services/audit.service'
import { initiateGeneration } from '../ai/hermes'
import { AppError } from '../middleware/error'

export const projectRouter = Router()

projectRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const list = await getProjects(req.user!.userId, req.user!.role)
    res.json(list)
  } catch (err) { next(err) }
})

projectRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id as string, req.user!.userId, req.user!.role)
    res.json(project)
  } catch (err) { next(err) }
})

projectRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, brief } = req.body
    const project = await createProject(req.user!.userId, name, brief)
    await logAudit({ userId: req.user!.userId, action: 'project.created', target: project.id })
    res.status(201).json(project)
  } catch (err) { next(err) }
})

projectRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, brief, status } = req.body
    const project = await updateProject(req.params.id as string, req.user!.userId, { name, brief, status })
    await logAudit({ userId: req.user!.userId, action: 'project.updated', target: project.id })
    res.json(project)
  } catch (err) { next(err) }
})

projectRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteProject(req.params.id as string, req.user!.userId)
    await logAudit({ userId: req.user!.userId, action: 'project.deleted', target: req.params.id as string })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

projectRouter.post('/:id/generate', requireAuth, async (req, res, next) => {
  try {
    const { templateId, config } = req.body ?? {}
    const result = await generateDocument(req.params.id as string, req.user!.userId, req.user!.role, config)
    const project = await getProjectById(req.params.id as string, req.user!.userId, req.user!.role)
    initiateGeneration(req.params.id as string, project.brief || '', result.document_id, templateId, config)
    await logAudit({ userId: req.user!.userId, action: 'document.generated', target: result.document_id, metadata: { projectId: req.params.id as string, templateId: templateId || null } })
    res.status(201).json(result)
  } catch (err) { next(err) }
})

projectRouter.get('/:id/requirements', requireAuth, async (req, res, next) => {
  try {
    const requirements = await listRequirements(req.params.id as string)
    res.json(requirements)
  } catch (err) { next(err) }
})

projectRouter.post('/:id/requirements', requireAuth, async (req, res, next) => {
  try {
    const { type, text, sourceActor } = req.body
    if (!type || !text) throw new AppError(400, 'missing_fields', 'type and text are required')
    const requirement = await createRequirement(req.params.id as string, { type, text, sourceActor })
    await logAudit({ userId: req.user!.userId, action: 'requirement.created', target: requirement.id, metadata: { projectId: req.params.id as string } })
    res.status(201).json(requirement)
  } catch (err) { next(err) }
})
