import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function listUsers() {
  const all = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users)
  return all
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
  if (existing.length > 0) {
    throw new AppError(409, 'email_exists', 'Email already registered')
  }
  const passwordHash = await bcrypt.hash(data.password, 12)
  const [user] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  })
  return user
}

export async function updateUserRole(id: string, role: string) {
  const validRoles = ['redacteur', 'validateur', 'admin', 'super_admin']
  if (!validRoles.includes(role)) {
    throw new AppError(400, 'invalid_role', 'Invalid role')
  }
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  })
  if (!updated) throw new AppError(404, 'not_found', 'User not found')
  return updated
}

export async function deleteUser(id: string) {
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  if (!deleted) throw new AppError(404, 'not_found', 'User not found')
  return deleted
}
