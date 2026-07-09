/**
 * GenerationContext — shared state object passed through the Hermes pipeline.
 *
 * All agents (Planner, Writer, UML, Tables, Reviewer) receive this context and
 * can mutate it to communicate progress and discovered state. The context is
 * NOT persisted to DB between pipeline stages — DB is the state store.
 * Context transitions through DB: outline → sections → content → diagrams → review.
 *
 * @module ai/context
 */

import type { OutlineJson } from '../services/outline.service'

/** A section the Writer agent has completed drafting. */
export interface CompletedSection {
  id: string
  title: string
  order: number
}

/** A diagram saved by the UML agent during generation. */
export interface ContextDiagram {
  id: string
  type: string
  plantumlSource: string
}

/** A requirements table section saved by the Tables agent. */
export interface ContextTable {
  id: string
  title: string
}

/**
 * Shared generation context for a single document generation run.
 *
 * Passed through all pipeline stages (Planner → Writer → UML → Tables → Reviewer).
 * Each agent reads from and writes to relevant fields. DB queries use documentId/projectId
 * directly — the context does not cache full DB state, only generation progress metadata.
 */
export interface GenerationContext {
  /** ID of the document being generated */
  documentId: string

  /** ID of the parent project */
  projectId: string

  /** Parsed document outline — null until Planner completes */
  outline: OutlineJson | null

  /** Sections the Writer has finished drafting, in order */
  completedSections: CompletedSection[]

  /** Diagrams saved during this generation run */
  diagrams: ContextDiagram[]

  /** Requirement table sections saved during this generation run */
  tables: ContextTable[]

  /** Extensible key-value bag for agent-specific state (e.g., "lastSectionIndex": 3) */
  metadata: Record<string, unknown>

  /** Tracks rescope attempts per sectionId (G2 guardrail — max 3 rescopes per section) */
  rescopeCount: Map<string, number>

  /** Timestamp of context creation */
  startedAt: Date
}

/**
 * Factory: create a fresh {@link GenerationContext} initialized with empty arrays,
 * empty metadata, and the current timestamp.
 *
 * @param documentId - The UUID of the document being generated
 * @param projectId - The UUID of the parent project
 * @returns A new, empty GenerationContext
 */
export function createContext(documentId: string, projectId: string): GenerationContext {
  return {
    documentId,
    projectId,
    outline: null,
    completedSections: [],
    diagrams: [],
    tables: [],
    metadata: {},
    rescopeCount: new Map<string, number>(),
    startedAt: new Date(),
  }
}
