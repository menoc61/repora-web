import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
let token: string
let documentId: string
let userId: string

function randomEmail() {
  return `test-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
  const email = randomEmail()
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Export Test', email, password: 'testpass123' })
    .expect(201)
  token = res.body.token
  userId = res.body.user.id

  const projRes = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Export Test Project', brief: 'Project for export tests' })
    .expect(201)

  const genRes = await request(app)
    .post(`/projects/${projRes.body.id}/generate`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
  documentId = genRes.body.document_id
})

afterAll(async () => {
  if (userId) await cleanupTestUser(userId)
})

describe('GET /documents/:id/export', () => {
  it('exports markdown format', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/export?format=md`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.headers['content-type']).toMatch(/text\/markdown/)
    expect(res.text).toContain('# ')
    expect(res.text).toContain('Introduction')
  })

  it('exports docx format', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/export?format=docx`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.headers['content-type']).toMatch(/vnd\.openxmlformats-officedocument/)
    expect(res.body instanceof ArrayBuffer || Buffer.isBuffer(res.body) || typeof res.body === 'object').toBe(true)
  })

  it('exports pdf format', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/export?format=pdf`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.headers['content-type']).toMatch(/application\/pdf/)
  })

  it('returns 400 for invalid format', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/export?format=txt`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
    expect(res.body.error.code).toBe('invalid_format')
  })

  it('returns 401 without auth', async () => {
    await request(app)
      .get(`/documents/${documentId}/export?format=md`)
      .expect(401)
  })
})
