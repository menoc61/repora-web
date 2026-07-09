import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
let token: string
let projectId: string
let userId: string

function randomEmail() {
  return `test-proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
})

beforeEach(async () => {
  const email = randomEmail()
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Project Test', email, password: 'testpass123' })
    .expect(201)
  token = res.body.token
  userId = res.body.user.id

  const projRes = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Project', brief: 'A test project for testing' })
    .expect(201)
  projectId = projRes.body.id
})

afterAll(async () => {
  if (userId) {
    await cleanupTestUser(userId)
  }
})

describe('GET /projects', () => {
  it('lists projects for authenticated user', async () => {
    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('name')
  })

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .get('/projects')
      .expect(401)

    expect(res.body.error.code).toBe('unauthorized')
  })
})

describe('POST /projects', () => {
  it('creates a new project', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Test Project', brief: 'Project brief description' })
      .expect(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('New Test Project')
    expect(res.body.brief).toBe('Project brief description')
    expect(res.body.status).toBe('draft')
  })

  it('creates a project without brief', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Briefless Project' })
      .expect(201)

    expect(res.body.name).toBe('Briefless Project')
    expect(res.body.brief).toBeNull()
  })
})

describe('GET /projects/:id', () => {
  it('gets a single project by id', async () => {
    const res = await request(app)
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.id).toBe(projectId)
    expect(res.body.name).toBe('Test Project')
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .get('/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body.error.code).toBe('not_found')
  })
})

describe('PATCH /projects/:id', () => {
  it('updates a project', async () => {
    const res = await request(app)
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project Name', brief: 'Updated brief' })
      .expect(200)

    expect(res.body.name).toBe('Updated Project Name')
    expect(res.body.brief).toBe('Updated brief')
  })

  it('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .patch('/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' })
      .expect(404)

    expect(res.body.error.code).toBe('not_found')
  })
})

describe('DELETE /projects/:id', () => {
  it('deletes a project', async () => {
    const createRes = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' })
      .expect(201)

    const deleteRes = await request(app)
      .delete(`/projects/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(deleteRes.body.ok).toBe(true)

    await request(app)
      .get(`/projects/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })
})

describe('GET /projects/:id/requirements', () => {
  it('lists requirements for a project', async () => {
    const res = await request(app)
      .get(`/projects/${projectId}/requirements`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /projects/:id/requirements', () => {
  it('adds a requirement to a project', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/requirements`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'functional', text: 'The system must do X', sourceActor: 'Product Owner' })
      .expect(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body.type).toBe('functional')
    expect(res.body.text).toBe('The system must do X')
    expect(res.body.sourceActor).toBe('Product Owner')
  })

  it('returns 400 without type and text', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/requirements`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400)

    expect(res.body.error.code).toBe('missing_fields')
  })
})
