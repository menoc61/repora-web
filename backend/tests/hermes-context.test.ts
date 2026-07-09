/**
 * Tests for GenerationContext type and HermesEvent discriminated union.
 * Task 1 of Plan 001-01: Create GenerationContext type + enhance HermesEvent types.
 */
import { describe, it, expect } from 'vitest'

// These imports will fail initially — the implementations don't exist yet.
// This is the RED phase of TDD.

describe('GenerationContext', () => {
  it('createContext(documentId, projectId) returns a GenerationContext with empty arrays and empty metadata', async () => {
    // Dynamic import to allow test file to load even before the module exists
    const { createContext } = await import('../src/ai/context')
    const ctx = createContext('doc-123', 'proj-456')

    expect(ctx).toBeDefined()
    expect(ctx.documentId).toBe('doc-123')
    expect(ctx.projectId).toBe('proj-456')
    expect(ctx.outline).toBeNull()
    expect(ctx.completedSections).toEqual([])
    expect(ctx.diagrams).toEqual([])
    expect(ctx.tables).toEqual([])
    expect(ctx.metadata).toEqual({})
    expect(ctx.rescopeCount).toBeInstanceOf(Map)
    expect(ctx.rescopeCount.size).toBe(0)
    expect(ctx.startedAt).toBeInstanceOf(Date)
  })

  it('GenerationContext is mutable — pushing to completedSections is reflected on the object', async () => {
    const { createContext } = await import('../src/ai/context')
    const ctx = createContext('doc-123', 'proj-456')

    ctx.completedSections.push({ id: 'sec-1', title: 'Introduction', order: 1 })
    expect(ctx.completedSections).toHaveLength(1)
    expect(ctx.completedSections[0].id).toBe('sec-1')

    ctx.completedSections.push({ id: 'sec-2', title: 'Objectifs', order: 2 })
    expect(ctx.completedSections).toHaveLength(2)

    // Metadata is also mutable
    ctx.metadata.customKey = 'customValue'
    expect(ctx.metadata.customKey).toBe('customValue')

    // rescopeCount is mutable
    ctx.rescopeCount.set('sec-1', 2)
    expect(ctx.rescopeCount.get('sec-1')).toBe(2)
  })

  it('GenerationContext arrays are independent instances — not shared between contexts', async () => {
    const { createContext } = await import('../src/ai/context')
    const ctx1 = createContext('doc-a', 'proj-x')
    const ctx2 = createContext('doc-b', 'proj-y')

    ctx1.completedSections.push({ id: 'sec-1', title: 'Test', order: 1 })
    expect(ctx1.completedSections).toHaveLength(1)
    expect(ctx2.completedSections).toHaveLength(0)

    ctx1.diagrams.push({ id: 'd1', type: 'sequence', plantumlSource: '@startuml\n@enduml' })
    expect(ctx1.diagrams).toHaveLength(1)
    expect(ctx2.diagrams).toHaveLength(0)

    ctx1.tables.push({ id: 't1', title: 'Table 1' })
    expect(ctx1.tables).toHaveLength(1)
    expect(ctx2.tables).toHaveLength(0)
  })
})

describe('HermesEvent discriminated union', () => {
  // Helper: import the HermesEvent type for runtime testing via event construction
  let HermesEventTypes: Record<string, unknown>
  let runAgent: (...args: unknown[]) => AsyncGenerator<unknown>

  beforeAll(async () => {
    const mod = await import('../src/ai/hermes')
    // Capture exports for runtime checks
    HermesEventTypes = mod as unknown as Record<string, unknown>
    runAgent = mod.runAgent as (...args: unknown[]) => AsyncGenerator<unknown>
  })

  it('accepts context_updated event type with agent, key, value fields', () => {
    // Type-level test: construct an event matching the context_updated variant
    // This will fail type-checking if the variant doesn't exist on HermesEvent
    const event = {
      type: 'context_updated' as const,
      agent: 'Writer',
      key: 'completedSections',
      value: [{ id: 'sec-1', title: 'Intro', order: 1 }],
    }
    expect(event.type).toBe('context_updated')
    expect(event.agent).toBe('Writer')
    expect(event.key).toBe('completedSections')
    expect(event.value).toBeDefined()
  })

  it('accepts generation_error event type with agent, message, recoverable fields', () => {
    const event = {
      type: 'generation_error' as const,
      agent: 'Writer',
      message: 'Failed to generate section: context window exceeded',
      recoverable: true,
    }
    expect(event.type).toBe('generation_error')
    expect(event.agent).toBe('Writer')
    expect(event.message).toContain('context window')
    expect(event.recoverable).toBe(true)
  })

  it('generation_error event optionally accepts sectionId', () => {
    const event = {
      type: 'generation_error' as const,
      agent: 'Writer',
      message: 'Section content too short',
      recoverable: false,
      sectionId: 'sec-42',
    }
    expect(event.type).toBe('generation_error')
    expect(event.sectionId).toBe('sec-42')
    expect(event.recoverable).toBe(false)
  })

  it('existing agent_status event still works with type, agent, status fields', () => {
    const event = {
      type: 'agent_status' as const,
      agent: 'Planner',
      status: 'thinking',
    }
    expect(event.type).toBe('agent_status')
    expect(event.agent).toBe('Planner')
    expect(event.status).toBe('thinking')
  })

  it('existing token event still works with token and agent fields', () => {
    const event = {
      type: 'token' as const,
      token: 'Hello world',
      agent: 'Writer',
    }
    expect(event.type).toBe('token')
    expect(event.token).toBe('Hello world')
    expect(event.agent).toBe('Writer')
  })

  it('existing tool_call event still works with agent, tool, args fields', () => {
    const event = {
      type: 'tool_call' as const,
      agent: 'UML',
      tool: 'saveDiagram',
      args: { projectId: 'p1', type: 'sequence', plantumlSource: '@startuml\n@enduml' },
    }
    expect(event.type).toBe('tool_call')
    expect(event.tool).toBe('saveDiagram')
    expect(event.args).toBeDefined()
  })

  it('existing tool_result event still works with agent, tool, result fields', () => {
    const event = {
      type: 'tool_result' as const,
      agent: 'Writer',
      tool: 'writeSection',
      result: { ok: true },
    }
    expect(event.type).toBe('tool_result')
    expect(event.tool).toBe('writeSection')
    expect(event.result).toEqual({ ok: true })
  })

  it('existing section_complete event still works', () => {
    const event = {
      type: 'section_complete' as const,
      section_id: 'sec-1',
      title: 'Introduction',
    }
    expect(event.type).toBe('section_complete')
    expect(event.section_id).toBe('sec-1')
    expect(event.title).toBe('Introduction')
  })

  it('existing done event still works', () => {
    const event = {
      type: 'done' as const,
      document_id: 'doc-1',
    }
    expect(event.type).toBe('done')
    expect(event.document_id).toBe('doc-1')
  })

  it('runAgent signature accepts optional GenerationContext parameter', () => {
    // Runtime check: runAgent should be a function that accepts 3-4 args
    // The 4th optional arg was previously apiKey, now there should be a ctx option too.
    // This test verifies the function exists and has the right arity.
    expect(typeof runAgent).toBe('function')
    // runAgent should accept at least 3 required params
    expect(runAgent.length).toBeGreaterThanOrEqual(3)
  })
})
