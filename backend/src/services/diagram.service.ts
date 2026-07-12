import { db } from '../db'
import { diagrams, documents, sections, projects } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AppError } from '../middleware/error'
import { deflateSync } from 'zlib'
import { config } from '../config'
import { getLanguageModel } from '../ai/providers/interface'
import type { ProviderType } from '../ai/providers/interface'
import * as fs from 'fs'
import * as path from 'path'

const DIAGRAMS_DIR = path.join(process.cwd(), 'uploads', 'diagrams')

function encodePlantUML(source: string): string {
  let cleaned = source
    .replace(/@startuml\s*\n?/g, '')
    .replace(/@enduml\s*\n?/g, '')
  const deflated = deflateSync(Buffer.from(cleaned, 'utf-8'))
  return encode64(deflated)
}

function encode64(data: Buffer): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
  let result = ''
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i]
    const b2 = data[i + 1] ?? 0
    const b3 = data[i + 2] ?? 0
    result += chars[b1 >> 2]
    result += chars[((b1 & 3) << 4) | (b2 >> 4)]
    result += i + 1 < data.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : ''
    result += i + 2 < data.length ? chars[b3 & 63] : ''
  }
  return result
}

const PLANTUML_TYPE_LABELS: Record<string, string> = {
  use_case: 'Use case diagram showing actors and their use cases',
  sequence: 'Sequence diagram showing key system interactions',
  activity: 'Activity diagram showing main business process flows',
  class: 'Class diagram showing domain model entities and relationships',
  deployment: 'Deployment diagram showing system infrastructure layout',
}

/**
 * Generate valid PlantUML source from project context and document content.
 * Falls back to a minimal valid diagram if the LLM fails.
 */
async function generatePlantUML(
  projectId: string,
  diagramType: string,
  source: string,
): Promise<string> {
  // Fetch project + document context
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  const [doc] = await db.select().from(documents).where(eq(documents.projectId, projectId)).limit(1)

  let sectionContent = ''
  if (doc) {
    const secs = await db.select({ title: sections.title, content: sections.content })
      .from(sections).where(eq(sections.documentId, doc.id)).orderBy(sections.order)
    sectionContent = secs.map(s => `## ${s.title}\n${s.content || '(vide)'}`).join('\n\n')
  }

  const brief = project?.brief || source
  const desc = PLANTUML_TYPE_LABELS[diagramType] || 'UML diagram'

  const prompt = `Generate a valid PlantUML diagram for a project specification document.

Project brief: "${brief}"
Diagram type: ${desc}
${sectionContent ? `\nDocument sections:\n${sectionContent.slice(0, 3000)}` : ''}

RULES:
- Output ONLY the PlantUML code. No explanation, no markdown fences.
- MUST start with @startuml and end with @enduml.
- Use French labels where appropriate.
- Keep the diagram simple and clear (max 15 elements).
- Use standard PlantUML syntax for the diagram type.`

  try {
    const provider = (config.ollamaUrl ? 'ollama' : 'llama_cpp') as ProviderType
    const model = getLanguageModel(provider, config.ollamaModel)
    const { streamText } = await import('ai')
    const stream = await streamText({ model, prompt, stopWhen: (await import('ai')).isStepCount(1) })

    let output = ''
    for await (const event of stream.fullStream) {
      if (event.type === 'text-delta') output += event.text
    }

    // Extract PlantUML from the output (strip markdown fences if present)
    const cleaned = output
      .replace(/^```(?:plantuml|puml)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim()

    if (cleaned.includes('@startuml') && cleaned.includes('@enduml')) {
      return cleaned
    }

    // If the model didn't produce valid PlantUML, wrap the output
    if (cleaned.length > 0) {
      return `@startuml\n${cleaned}\n@enduml`
    }
  } catch (err) {
    console.warn('[Diagram] LLM PlantUML generation failed:', (err as Error).message)
  }

  // Fallback: minimal valid PlantUML
  return `@startuml
title ${source || diagramType}
actor "Utilisateur" as user
rectangle "Systeme" as sys {
  usecase "Action" as uc
}
user --> uc
@enduml`
}

export async function createDiagram(projectId: string, type: string, source?: string, sectionId?: string) {
  // If source looks like valid PlantUML, use it directly.
  // Otherwise generate PlantUML from project context.
  let plantumlSource: string
  if (source && source.includes('@startuml')) {
    plantumlSource = source
  } else {
    plantumlSource = await generatePlantUML(projectId, type, source || '')
  }

  const encodedSource = encodePlantUML(plantumlSource)

  // Download PNG from PlantUML server and save locally
  let localPngUrl = ''
  try {
    const pngUrl = `${config.plantumlUrl}/png/~1${encodedSource}`
    const resp = await fetch(pngUrl)
    if (resp.ok) {
      const buffer = Buffer.from(await resp.arrayBuffer())
      fs.mkdirSync(DIAGRAMS_DIR, { recursive: true })
      const filename = `${projectId}_${type}_${Date.now()}.png`
      fs.writeFileSync(path.join(DIAGRAMS_DIR, filename), buffer)
      localPngUrl = `/uploads/diagrams/${filename}`
      console.log(`[Diagram] Saved PNG: ${localPngUrl} (${buffer.length} bytes)`)
    } else {
      console.warn(`[Diagram] PNG download failed (${resp.status}), using SVG URL`)
    }
  } catch (err) {
    console.warn('[Diagram] PNG download error:', (err as Error).message)
  }

  const renderedUrl = localPngUrl || `${config.plantumlUrl}/svg/~1${encodedSource}`

  const [diagram] = await db.insert(diagrams).values({
    projectId,
    sectionId: sectionId || null,
    type,
    plantumlSource,
    renderedUrl,
  }).returning()

  return {
    id: diagram.id,
    type: diagram.type,
    section_id: diagram.sectionId,
    plantuml_source: plantumlSource,
    rendered_url: renderedUrl,
  }
}

export async function getDiagram(id: string) {
  const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id)).limit(1)
  if (!diagram) throw new AppError(404, 'not_found', 'Diagram not found')

  const plantumlSource = diagram.plantumlSource || ''
  const encodedSource = plantumlSource ? encodePlantUML(plantumlSource) : ''
  const renderedUrl = plantumlSource
    ? `${config.plantumlUrl}/svg/~1${encodedSource}`
    : ''

  return {
    id: diagram.id,
    type: diagram.type,
    plantuml_source: plantumlSource,
    rendered_url: renderedUrl,
  }
}

export async function listDiagramsByProject(projectId: string) {
  const rows = await db.select().from(diagrams).where(eq(diagrams.projectId, projectId))
  return rows.map((d) => {
    const plantumlSource = d.plantumlSource || ''
    const renderedUrl = d.renderedUrl || (plantumlSource
      ? `${config.plantumlUrl}/svg/~1${encodePlantUML(plantumlSource)}`
      : '')
    return {
      id: d.id,
      type: d.type,
      section_id: d.sectionId,
      plantuml_source: plantumlSource,
      rendered_url: renderedUrl,
    }
  })
}
