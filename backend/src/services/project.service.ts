import { db } from '../db'
import { projects, documents, sections } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../middleware/error'

export async function getProjects(ownerId: string) {
  return db.select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
    brief: projects.brief,
  }).from(projects).where(eq(projects.ownerId, ownerId))
}

export async function getProjectById(projectId: string, ownerId: string) {
  const [project] = await db.select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
    brief: projects.brief,
  }).from(projects).where(
    and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))
  ).limit(1)
  if (!project) throw new AppError(404, 'not_found', 'Project not found')
  return project
}

export async function createProject(ownerId: string, name: string, brief?: string) {
  const [project] = await db.insert(projects).values({ ownerId, name, brief }).returning()
  return { id: project.id, name: project.name, status: project.status, brief: project.brief }
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  data: { name?: string; brief?: string; status?: string }
) {
  const [project] = await db.update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .returning()
  if (!project) throw new AppError(404, 'not_found', 'Project not found')
  return { id: project.id, name: project.name, status: project.status, brief: project.brief }
}

export async function deleteProject(projectId: string, ownerId: string) {
  const [project] = await db.delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .returning({ id: projects.id })
  if (!project) throw new AppError(404, 'not_found', 'Project not found')
}

export async function generateDocument(projectId: string, ownerId: string) {
  const [project] = await db.select({ id: projects.id })
    .from(projects).where(
      and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))
    ).limit(1)
  if (!project) throw new AppError(404, 'not_found', 'Project not found')

  const [doc] = await db.insert(documents).values({ projectId }).returning()

  const [section] = await db.insert(sections).values({
    documentId: doc.id,
    order: 1,
    title: 'Introduction',
    content: '',
    status: 'pending',
  }).returning()

  return { document_id: doc.id, status: doc.status, prompt: 'Introduction' }
}
