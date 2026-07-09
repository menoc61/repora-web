import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { config } from '../config'
import { AppError } from '../middleware/error'

export interface JwtPayload {
  userId: string
  role: string
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    throw new AppError(409, 'email_exists', 'Email already registered')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning()
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as StringValue })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'invalid_credentials', 'Invalid email or password')
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as StringValue })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    throw new AppError(401, 'invalid_token', 'Invalid or expired token')
  }
}
