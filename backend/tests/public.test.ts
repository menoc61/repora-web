import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
let token: string
let projectId: string
let documentId: string
let validationToken: string
let userId: string

function randomEmail() {
  return `test-pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
})

beforeEach(async () => {
  const email = randomEmail()
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Public Test', email, password: 'testpass123' })
    .expect(201)
  token = res.body.token
  userId = res.body.user.id

  const projRes = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Public Test Project', brief: 'For public endpoint tests' })
    .expect(201)
  projectId = projRes.body.id

  const genRes = await request(app)
    .post(`/projects/${projectId}/generate`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
  documentId = genRes.body.document_id

  const tokenRes = await request(app)
    .post(`/documents/${documentId}/validation-token`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  validationToken = tokenRes.body.token
})

afterAll(async () => {
  if (userId) {
    await cleanupTestUser(userId)
  }
})

describe('GET /healthz', () => {
  it('returns health status', async () => {
    const res = await request(app)
      .get('/healthz')
      .expect(200)

    expect(res.body).toHaveProperty('status')
    expect(res.body.status).toBe('ok')
  })
})

describe('GET /models', () => {
  it('returns a list of Ollama models (or empty array if unavailable)', async () => {
    const res = await request(app)
      .get('/models')
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /templates', () => {
  it('lists templates', async () => {
    const res = await request(app)
      .get('/templates')
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('name')
    expect(res.body[0]).toHaveProperty('category')
  })

  it('filters templates by category', async () => {
    const res = await request(app)
      .get('/templates?category=Juridique')
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    res.body.forEach((t: { category: string }) => {
      expect(t.category).toBe('Juridique')
    })
  })
})

describe('POST /templates/use', () => {
  let templateId: string

  beforeAll(async () => {
    const listRes = await request(app)
      .get('/templates')
      .expect(200)
    templateId = listRes.body[0].id
  })

  it('creates a document from a template', async () => {
    const res = await request(app)
      .post('/templates/use')
      .set('Authorization', `Bearer ${token}`)
      .send({
        templateId,
        projectId,
      })
      .expect(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('sections')
    expect(Array.isArray(res.body.sections)).toBe(true)
    expect(res.body.sections.length).toBeGreaterThanOrEqual(1)
    expect(res.body.status).toBe('draft')
  })

  it('creates a document from a template without projectId', async () => {
    const res = await request(app)
      .post('/templates/use')
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId, projectId })
      .expect(201)

    expect(res.body).toHaveProperty('id')
  })

  it('returns 400 without templateId', async () => {
    const res = await request(app)
      .post('/templates/use')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400)

    expect(res.body.error.code).toBe('missing_fields')
  })

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/templates/use')
      .send({ templateId })
      .expect(401)

    expect(res.body.error.code).toBe('unauthorized')
  })
})

describe('GET /validate/:token', () => {
  it('returns document info for a valid token', async () => {
    const res = await request(app)
      .get(`/validate/${validationToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('document_id')
    expect(res.body.document_id).toBe(documentId)
  })

  it('returns 404 for an invalid token', async () => {
    const res = await request(app)
      .get('/validate/invalid-token-that-does-not-exist')
      .expect(404)

    expect(res.body.error.code).toBe('not_found')
  })
})
