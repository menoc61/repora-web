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
  // Stateless JWT: logout is handled by client-side token deletion.
  // No server-side token blacklist is maintained.
  res.json({ ok: true })
})

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, password } = req.body
    const updates: Record<string, any> = {}
    if (name) updates.name = name
    if (password) {
      const bcrypt = await import('bcryptjs')
      updates.passwordHash = bcrypt.default.hashSync(password, 12)
    }
    if (Object.keys(updates).length === 0) return next(new AppError(400, 'missing_fields', 'name or password required'))
    const [user] = await db.update(users).set(updates).where(eq(users.id, req.user!.userId)).returning({ id: users.id, name: users.name, email: users.email, role: users.role })
    res.json(user)
  } catch (err) { next(err) }
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users).where(eq(users.id, req.user!.userId)).limit(1)
    if (!user) return next(new AppError(401, 'user_not_found', 'User account not found'))
    res.json(user)
  } catch (err) { next(err) }
})
