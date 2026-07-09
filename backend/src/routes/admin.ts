import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { listAgents, patchAgent, getMetrics, getLogs, listApiKeys, createApiKey, deleteApiKey } from '../services/admin.service'
import { listUsers, createUser, updateUserRole, deleteUser } from '../services/user.service'
import { AppError } from '../middleware/error'

export const adminRouter = Router()

adminRouter.get('/users', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const users = await listUsers()
    res.json(users)
  } catch (err) { next(err) }
})

adminRouter.post('/users', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      return next(new AppError(400, 'missing_fields', 'name, email, and password are required'))
    }
    const user = await createUser({ name, email, password, role: role ?? 'redacteur' })
    res.status(201).json(user)
  } catch (err) { next(err) }
})

adminRouter.patch('/users/:id', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { role } = req.body
    if (!role) return next(new AppError(400, 'missing_role', 'role is required'))
    const user = await updateUserRole(req.params.id as string, role)
    res.json(user)
  } catch (err) { next(err) }
})

adminRouter.delete('/users/:id', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    await deleteUser(req.params.id as string)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

adminRouter.get('/agents', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const agents = await listAgents()
    res.json(agents)
  } catch (err) { next(err) }
})

adminRouter.patch('/agents/:name', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const name = String(req.params.name)
    if (!name) return next(new AppError(400, 'missing_name', 'Agent name is required'))
    await patchAgent(name, req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

adminRouter.get('/api-keys', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const keys = await listApiKeys(req.user!.userId)
    res.json(keys)
  } catch (err) { next(err) }
})

adminRouter.post('/api-keys', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { provider, key } = req.body
    if (!provider || !key) {
      return next(new AppError(400, 'missing_fields', 'provider and key are required'))
    }
    const apiKey = await createApiKey(req.user!.userId, provider, key)
    res.status(201).json(apiKey)
  } catch (err) { next(err) }
})

adminRouter.delete('/api-keys/:id', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    await deleteApiKey(req.params.id as string)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

adminRouter.get('/logs', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const logs = await getLogs()
    res.json(logs)
  } catch (err) { next(err) }
})

adminRouter.get('/metrics', requireAuth, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const metrics = await getMetrics()
    res.json(metrics)
  } catch (err) { next(err) }
})
