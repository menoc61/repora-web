import { tool } from 'ai'
import { z } from 'zod'

export interface AgentDefinition {
  name: string
  description: string
  systemPrompt: string
  defaultModel: string
  defaultProvider: string
  tools: Record<string, ReturnType<typeof tool>>
}

const getProjectContext = tool({
  description: 'Get project brief and requirements',
  parameters: z.object({ projectId: z.string() }),
  execute: async ({ projectId }) => {
    const { db } = await import('../../db')
    const { projects } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    const [project] = await db.select({ brief: projects.brief }).from(projects).where(eq(projects.id, projectId)).limit(1)
    return { brief: project?.brief || 'No brief found', requirements: [] }
  },
})

const saveOutline = tool({
  description: 'Save document outline',
  parameters: z.object({ documentId: z.string(), outline: z.any() }),
  execute: async ({ documentId, outline }) => {
    const { db } = await import('../../db')
    const { documents } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
    return { ok: true }
  },
})

const writeSection = tool({
  description: 'Write content for a document section',
  parameters: z.object({ sectionId: z.string(), content: z.string() }),
  execute: async ({ sectionId, content }) => {
    const { db } = await import('../../db')
    const { sections } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(sections).set({ content, status: 'draft' }).where(eq(sections.id, sectionId))
    return { ok: true }
  },
})

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  Planner: {
    name: 'Planner',
    description: 'Turns a raw brief into a structured document outline',
    systemPrompt: 'You are a document planning agent. Analyze the project brief and propose a structured outline with chapters and sections.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext, saveOutline },
  },
  Writer: {
    name: 'Writer',
    description: 'Drafts prose content for document sections',
    systemPrompt: 'You are a technical writer. Draft clear, professional content for each section based on the outline and requirements.',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    tools: { getProjectContext, writeSection },
  },
  UML: {
    name: 'UML',
    description: 'Generates UML diagrams from requirements',
    systemPrompt: 'You are a UML diagram specialist. Generate PlantUML source code for diagrams based on requirements.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext },
  },
  Tables: {
    name: 'Tables',
    description: 'Generates structured requirement tables',
    systemPrompt: 'You are a requirements analyst. Generate structured requirement matrices and specification tables.',
    defaultModel: 'hermes-3-llama-3.1-8b',
    defaultProvider: 'llama_cpp',
    tools: { getProjectContext },
  },
  Reviewer: {
    name: 'Reviewer',
    description: 'Reviews document for consistency and quality',
    systemPrompt: 'You are a quality assurance reviewer. Check document consistency, terminology alignment, and completeness.',
    defaultModel: 'claude-sonnet-4-6',
    defaultProvider: 'anthropic',
    tools: { getProjectContext },
  },
}