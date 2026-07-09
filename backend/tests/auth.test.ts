import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { getApp, cleanupTestUser } from './setup'

let app: ReturnType<typeof getApp>
const testUserIds: string[] = []
const uniqueSuffix = Date.now()

function randomEmail() {
  return `test-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`
}

beforeAll(async () => {
  app = getApp()
})

afterAll(async () => {
  for (const id of testUserIds) {
    await cleanupTestUser(id)
  }
})

describe('POST /auth/register', () => {
  it('creates a new user and returns token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test User', email: randomEmail(), password: 'testpass123' })
      .expect(201)

    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user).toHaveProperty('id')
    expect(res.body.user.email).toBeTruthy()
    testUserIds.push(res.body.user.id)
  })

  it('returns 409 for duplicate email', async () => {
    const email = randomEmail()
    const res1 = await request(app)
      .post('/auth/register')
      .send({ name: 'First', email, password: 'testpass123' })
      .expect(201)
    testUserIds.push(res1.body.user.id)

    const res2 = await request(app)
      .post('/auth/register')
      .send({ name: 'Second', email, password: 'testpass123' })
      .expect(409)

    expect(res2.body.error.code).toBe('email_exists')
  })
})

describe('POST /auth/login', () => {
  let email: string

  beforeEach(async () => {
    email = randomEmail()
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Login Test', email, password: 'correctpass' })
      .expect(201)
    testUserIds.push(res.body.user.id)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'correctpass' })
      .expect(200)

    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.email).toBe(email)
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401)

    expect(res.body.error.code).toBe('invalid_credentials')
  })

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@nowhere.dev', password: 'testpass123' })
      .expect(401)

    expect(res.body.error.code).toBe('invalid_credentials')
  })
})

describe('GET /auth/me', () => {
  let token: string

  beforeEach(async () => {
    const email = randomEmail()
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Me Test', email, password: 'testpass123' })
      .expect(201)
    token = res.body.token
    testUserIds.push(res.body.user.id)
  })

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('name')
    expect(res.body).toHaveProperty('email')
    expect(res.body).toHaveProperty('role')
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .expect(401)

    expect(res.body.error.code).toBe('unauthorized')
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token-that-is-not-real')
      .expect(401)

    expect(res.body.error.code).toBe('invalid_token')
  })
})
