import { z } from 'zod'

export interface AgentDefinition {
  name: string
  description: string
  systemPrompt: string
  defaultModel: string
  defaultProvider: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: Record<string, any>
}

const dynamicTool: <T extends Record<string, z.ZodTypeAny>>(opts: {
  description?: string
  inputSchema: z.ZodObject<T>
  execute: (input: z.infer<z.ZodObject<T>>) => Promise<Record<string, unknown>>
}) => Record<string, unknown> = (opts) => opts as unknown as Record<string, unknown>

const getProjectContext = dynamicTool({
  description: 'Get project brief and requirements',
  inputSchema: z.object({ projectId: z.string() }),
  execute: async ({ projectId }) => {
    const { db } = await import('../../db')
    const { projects } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    const [project] = await db.select({ brief: projects.brief }).from(projects).where(eq(projects.id, projectId)).limit(1)
    return { brief: project?.brief || 'No brief found', requirements: [] }
  },
})

const saveOutline = dynamicTool({
  description: 'Save document outline',
  inputSchema: z.object({ documentId: z.string(), outline: z.any() }),
  execute: async ({ documentId, outline }) => {
    const { db } = await import('../../db')
    const { documents } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
    return { ok: true }
  },
})

const writeSection = dynamicTool({
  description: 'Write content for a document section',
  inputSchema: z.object({ sectionId: z.string(), content: z.string() }),
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
    systemPrompt: `You are a document planning agent. Analyze the project brief and produce a structured outline.

RESPOND WITH ONLY A JSON OBJECT. No markdown, no explanation, ONLY the JSON.

The JSON MUST follow this exact structure:
{
  "title": "Titre du Document",
  "chapters": [
    {
      "title": "Nom du Chapitre",
      "sections": [
        { "title": "Titre de la Section", "order": 1 },
        { "title": "Titre de la Section", "order": 2 }
      ]
    }
  ]
}

A good "cahier des charges" typically has these chapters:
1. Introduction (Contexte, Objectifs, Perimetre)
2. Exigences Fonctionnelles (Fonctionnalites principales, cas d'utilisation)
3. Exigences Non-Fonctionnelles (Performance, Securite, Disponibilite)
4. Architecture Technique (Vue d'ensemble, composants, modele de donnees)
5. Plan de Mise en Oeuvre (Phases, calendrier, livrables)
6. References et Glossaire

Write all titles in French. Be thorough but concise.`,
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
    tools: {},
  },
  Writer: {
    name: 'Writer',
    description: 'Drafts prose content for document sections',
    systemPrompt: `You are a professional technical writer. When given a section title and context, draft clear, detailed, professional content for that section.

You MUST save your completed content using the writeSection tool with the sectionId provided in the prompt and your written content.

Write in a professional, clear style suitable for a technical specification document ("cahier des charges"). Use proper paragraphs, structured lists where appropriate, and maintain consistency in terminology.`,
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
    tools: { getProjectContext, writeSection },
  },
  UML: {
    name: 'UML',
    description: 'Generates UML diagrams from requirements',
    systemPrompt: 'You are a UML diagram specialist. Generate PlantUML source code for diagrams based on requirements.',
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
    tools: { getProjectContext },
  },
  Tables: {
    name: 'Tables',
    description: 'Generates structured requirement tables',
    systemPrompt: 'You are a requirements analyst. Generate structured requirement matrices and specification tables.',
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
    tools: { getProjectContext },
  },
  Reviewer: {
    name: 'Reviewer',
    description: 'Reviews document for consistency and quality',
    systemPrompt: 'You are a quality assurance reviewer. Check document consistency, terminology alignment, and completeness.',
    defaultModel: 'llama3.1:8b',
    defaultProvider: 'ollama',
    tools: { getProjectContext },
  },
}
