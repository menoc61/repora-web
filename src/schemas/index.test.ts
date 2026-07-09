import { describe, it, expect } from 'vitest'
import { DocumentSchema, UserSchema, MetricsSchema } from './index'

describe('DocumentSchema', () => {
  it('validates a valid document', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Cahier des charges',
      status: 'draft',
      department: 'Engineering',
      author: { name: 'Repora AI' },
      collaborators: [],
      content: 'Lorem ipsum',
      version: 'v1.0.0',
    }
    const result = DocumentSchema.safeParse(doc)
    expect(result.success).toBe(true)
  })

  it('rejects a document missing required fields', () => {
    const result = DocumentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects a document with invalid status', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      status: 'invalid-status',
      department: 'Engineering',
      author: { name: 'Author' },
    }
    const result = DocumentSchema.safeParse(doc)
    expect(result.success).toBe(false)
  })

  it('rejects a document with empty title', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
      status: 'draft',
      department: 'Engineering',
      author: { name: 'Author' },
    }
    const result = DocumentSchema.safeParse(doc)
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    const validStatuses = ['draft', 'review', 'final', 'active', 'autonomous', 'archived']
    for (const status of validStatuses) {
      const doc = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        status,
        department: 'Engineering',
        author: { name: 'Author' },
      }
      const result = DocumentSchema.safeParse(doc)
      expect(result.success).toBe(true)
    }
  })
})

describe('UserSchema', () => {
  it('validates a valid user', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'editor',
    }
    const result = UserSchema.safeParse(user)
    expect(result.success).toBe(true)
  })

  it('rejects a user with invalid email', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'not-an-email',
      role: 'editor',
    }
    const result = UserSchema.safeParse(user)
    expect(result.success).toBe(false)
  })

  it('rejects a user with invalid role', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'superadmin',
    }
    const result = UserSchema.safeParse(user)
    expect(result.success).toBe(false)
  })

  it('accepts optional avatar and department', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Jane',
      email: 'jane@example.com',
      role: 'admin',
      avatar: 'https://example.com/avatar.png',
      department: 'Product',
    }
    const result = UserSchema.safeParse(user)
    expect(result.success).toBe(true)
  })
})

describe('MetricsSchema', () => {
  it('validates valid metrics', () => {
    const metrics = {
      totalDocuments: 42,
      activeAgents: 5,
      collaborationScore: 87,
      efficiencyIndex: 92,
      aiUtilization: 75,
      topContributor: 'Alice',
    }
    const result = MetricsSchema.safeParse(metrics)
    expect(result.success).toBe(true)
  })

  it('rejects metrics with missing fields', () => {
    const result = MetricsSchema.safeParse({ totalDocuments: 10 })
    expect(result.success).toBe(false)
  })

  it('rejects metrics with non-number fields', () => {
    const metrics = {
      totalDocuments: 'not-a-number',
      activeAgents: 5,
      collaborationScore: 87,
      efficiencyIndex: 92,
      aiUtilization: 75,
      topContributor: 'Alice',
    }
    const result = MetricsSchema.safeParse(metrics)
    expect(result.success).toBe(false)
  })
})
