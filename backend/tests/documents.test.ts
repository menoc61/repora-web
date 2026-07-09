import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
let token: string
let documentId: string
let sectionId: string
let userId: string

function randomEmail() {
  return `test-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
})

beforeEach(async () => {
  const email = randomEmail()
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Doc Test', email, password: 'testpass123' })
    .expect(201)
  token = res.body.token
  userId = res.body.user.id

  const projRes = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Document Test Project', brief: 'Project for document tests' })
    .expect(201)

  const genRes = await request(app)
    .post(`/projects/${projRes.body.id}/generate`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201)

  documentId = genRes.body.document_id

  const docRes = await request(app)
    .get(`/documents/${documentId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  if (docRes.body.sections && docRes.body.sections.length > 0) {
    sectionId = docRes.body.sections[0].id
  }
})

afterAll(async () => {
  if (userId) {
    await cleanupTestUser(userId)
  }
})

describe('GET /documents', () => {
  it('lists documents for authenticated user', async () => {
    const res = await request(app)
      .get('/documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('status')
  })

  it('filters documents by status', async () => {
    const res = await request(app)
      .get('/documents?status=draft')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    res.body.forEach((d: { status: string }) => {
      expect(d.status).toBe('draft')
    })
  })
})

describe('GET /documents/:id', () => {
  it('gets a document with its sections', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('sections')
    expect(Array.isArray(res.body.sections)).toBe(true)
  })

  it('returns 404 for non-existent document', async () => {
    const res = await request(app)
      .get('/documents/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body.error.code).toBe('not_found')
  })
})

describe('PATCH /documents/:id', () => {
  it('saves document content and updates sections', async () => {
    const res = await request(app)
      .patch(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        status: 'draft',
        sections: [{ id: sectionId, title: 'Updated Section', content: 'Updated content for testing' }],
      })
      .expect(200)

    expect(res.body).toHaveProperty('id')
  })
})

describe('POST /documents/:id/validation-token', () => {
  it('creates a validation token', async () => {
    const res = await request(app)
      .post(`/documents/${documentId}/validation-token`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).toHaveProperty('token')
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.length).toBeGreaterThan(0)
  })
})

describe('GET /documents/:id/versions', () => {
  it('returns version history for a document', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /documents/:id/comments', () => {
  it('adds a comment to a document section', async () => {
    const res = await request(app)
      .post(`/documents/${documentId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ sectionId, text: 'This is a test comment' })
      .expect(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body.text).toBe('This is a test comment')
    expect(res.body.sectionId).toBe(sectionId)
  })

  it('returns 400 without sectionId and text', async () => {
    const res = await request(app)
      .post(`/documents/${documentId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400)

    expect(res.body.error.code).toBe('missing_fields')
  })
})

describe('GET /documents/:id/comments', () => {
  it('lists comments for a document', async () => {
    const res = await request(app)
      .get(`/documents/${documentId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(res.body)).toBe(true)
  })
})
