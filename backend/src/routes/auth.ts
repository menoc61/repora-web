import { Router } from 'express'
import { registerUser, loginUser } from '../services/auth.service'
import { requireAuth } from '../middleware/auth'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export const authRouter = Router()

authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const result = await registerUser(name, email, password)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await loginUser(email, password)
    res.json(result)
  } catch (err) { next(err) }
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users).where(eq(users.id, req.user!.userId)).limit(1)
    if (!user) return next(new AppError(404, 'not_found', 'User not found'))
    res.json(user)
  } catch (err) { next(err) }
})
