import { describe, it, expect } from 'vitest'
import {
  acceptHandoff,
  rescopeHandoff,
  adjustContext,
  evaluateWriterOutput,
} from '../src/ai/pipeline/negotiate'
import type { GenerationContext } from '../src/ai/context'

function makeCtx(overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    documentId: 'doc-1',
    projectId: 'proj-1',
    metadata: {},
    rescopeCount: new Map(),
    ...overrides,
  }
}

describe('acceptHandoff', () => {
  it('returns accept decision with agent name and reason', () => {
    const result = acceptHandoff('Writer', '6 sections drafted')
    expect(result.decision).toBe('accept')
    expect(result.reason).toContain('Writer')
  })
})

describe('rescopeHandoff', () => {
  it('returns rescope decision when rescopeCount < 3', () => {
    const result = rescopeHandoff('Writer', 'sec-1', 'content too short', 1)
    expect(result.decision).toBe('rescope')
    expect(result.feedback).toBe('content too short')
    expect(result.sectionId).toBe('sec-1')
  })

  it('returns abort decision when rescopeCount >= 3 (G2 loop breaker)', () => {
    const result = rescopeHandoff('Writer', 'sec-1', 'content too short', 3)
    expect(result.decision).toBe('abort')
    expect(result.reason).toContain('sec-1')
    expect(result.reason).toContain('max rescope')
  })

  it('returns abort for rescopeCount > 3', () => {
    const result = rescopeHandoff('Writer', 'sec-x', 'placeholder detected', 5)
    expect(result.decision).toBe('abort')
  })
})

describe('adjustContext', () => {
  it('mutates ctx.metadata and returns the mutated context', () => {
    const ctx = makeCtx()
    const result = adjustContext(ctx, 'outlineSource', 'template')
    expect(result.metadata.outlineSource).toBe('template')
    // identity: returned reference === input reference
    expect(result).toBe(ctx)
  })

  it('supports chaining multiple adjustContext calls', () => {
    const ctx = makeCtx()
    adjustContext(ctx, 'key1', 'val1')
    adjustContext(ctx, 'key2', 42)
    expect(ctx.metadata.key1).toBe('val1')
    expect(ctx.metadata.key2).toBe(42)
  })
})

describe('evaluateWriterOutput', () => {
  it('flags content shorter than 50 chars', () => {
    const result = evaluateWriterOutput('Too short')
    expect(result.passed).toBe(false)
    expect(result.issues).toContain('content too short')
  })

  it('flags placeholder content (Lorem ipsum)', () => {
    const result = evaluateWriterOutput('Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor')
    expect(result.passed).toBe(false)
    expect(result.issues.some(i => i.includes('placeholder'))).toBe(true)
  })

  it('flags content that may not be in French (warning only, not hard fail)', () => {
    // No common French words — this is a warning, not a hard failure
    const result = evaluateWriterOutput('The system shall provide user authentication and authorization services')
    // French check is a warning only — content with sufficient length still passes
    expect(result.issues.some(i => i.includes('French'))).toBe(true)
  })

  it('passes content that is long enough, substantive, and in French', () => {
    const result = evaluateWriterOutput(
      'Le système doit assurer la gestion des utilisateurs et des droits d\'accès. ' +
      'Dans ce contexte, il est important de définir les rôles pour chaque acteur du projet.'
    )
    expect(result.passed).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('detects repeated section title as placeholder', () => {
    const result = evaluateWriterOutput('Introduction\nIntroduction\nIntroduction\nIntroduction\nIntroduction')
    expect(result.passed).toBe(false)
    expect(result.issues.some(i => i.includes('placeholder'))).toBe(true)
  })

  it('flags whitespace-only content', () => {
    const result = evaluateWriterOutput('   \n  \t  \n   ')
    expect(result.passed).toBe(false)
    expect(result.issues).toContain('content too short')
  })

  it('passes long English content as French warning is not a hard fail', () => {
    // The French check is only a warning — content can still pass if long enough
    const result = evaluateWriterOutput(
      'The system architecture consists of three main layers that communicate through well-defined APIs. ' +
      'Each layer is independently deployable and can scale horizontally based on demand patterns.'
    )
    // French warning is triggered but doesn't cause failure on its own
    // (only length check and placeholder check are hard failures)
    expect(result.passed).toBe(true)
    expect(result.issues).toEqual(['content may not be in French'])
  })

  it('detects French content correctly via common French words', () => {
    // "le", "les", "des" are common French words
    const result = evaluateWriterOutput(
      'Le présent document décrit les exigences fonctionnelles du système. ' +
      'Il détaille les différentes interfaces et les interactions entre les composants.'
    )
    expect(result.passed).toBe(true)
    expect(result.issues).toEqual([])
  })
})
