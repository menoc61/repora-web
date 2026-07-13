import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
let token: string
let documentId: string
let userId: string

function randomEmail() {
  return `test-val-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
})

beforeEach(async () => {
  const email = randomEmail()
  const res = await request(app)
    .post('/auth/register')
    .send({ name: 'Validation Test', email, password: 'testpass123' })
    .expect(201)
  token = res.body.token
  userId = res.body.user.id

  const projRes = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Validation Test Project', brief: 'Project for validation tests' })
    .expect(201)

  const genRes = await request(app)
    .post(`/projects/${projRes.body.id}/generate`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201)

  documentId = genRes.body.document_id
})

afterAll(async () => {
  if (userId) {
    await cleanupTestUser(userId)
  }
})

async function getToken(): Promise<string> {
  const res = await request(app)
    .post(`/documents/${documentId}/validation-token`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  return res.body.token as string
}

describe('GET /validate/:token (read-only portal)', () => {
  it('returns the document for a valid token', async () => {
    const vt = await getToken()
    const res = await request(app).get(`/validate/${vt}`).expect(200)
    expect(res.body.document).toHaveProperty('id', documentId)
    expect(res.body.document).toHaveProperty('sections')
    expect(Array.isArray(res.body.document.sections)).toBe(true)
  })

  it('returns 404 for an invalid token', async () => {
    const res = await request(app).get('/validate/does-not-exist').expect(404)
    expect(res.body.error.code).toBe('not_found')
  })
})

describe('GET /validate/:token/diagrams', () => {
  it('returns a (possibly empty) diagram list for a valid token', async () => {
    const vt = await getToken()
    const res = await request(app).get(`/validate/${vt}/diagrams`).expect(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /validate/:token/decision', () => {
  it('accepts the document with an approved decision', async () => {
    const vt = await getToken()
    const res = await request(app)
      .post(`/validate/${vt}/decision`)
      .send({ decision: 'approved' })
      .expect(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('rejects the document with mandatory section reasons', async () => {
    const vt = await getToken()
    const res = await request(app)
      .post(`/validate/${vt}/decision`)
      .send({ decision: 'rejected', section_reasons: { 'sec-1': 'Missing budget section' } })
      .expect(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('returns 400 when decision is missing', async () => {
    const vt = await getToken()
    const res = await request(app)
      .post(`/validate/${vt}/decision`)
      .send({})
      .expect(400)
    expect(res.body.error.code).toBe('missing_fields')
  })

  it('returns 400 when the validation was already decided', async () => {
    const vt = await getToken()
    await request(app).post(`/validate/${vt}/decision`).send({ decision: 'approved' }).expect(200)
    const res = await request(app)
      .post(`/validate/${vt}/decision`)
      .send({ decision: 'rejected', section_reasons: {} })
      .expect(400)
    expect(res.body.error.code).toBe('already_decided')
  })

  it('returns 404 for an invalid token', async () => {
    const res = await request(app)
      .post('/validate/nope/decision')
      .send({ decision: 'approved' })
      .expect(404)
    expect(res.body.error.code).toBe('not_found')
  })
})
