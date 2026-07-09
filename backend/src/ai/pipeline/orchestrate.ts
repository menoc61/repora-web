import { runAgent, clearActiveGeneration, type HermesEvent } from '../hermes'
import { createContext, type GenerationContext } from '../context'
import type { OutlineJson } from '../../services/outline.service'
import { createSectionsFromOutline, generateStaticOutline, mergeTemplateWithOutline } from '../../services/outline.service'
import { getTemplateForGeneration } from '../../services/template.service'
import { evaluateWriterOutput, rescopeHandoff, adjustContext } from './negotiate'
import { db } from '../../db'
import { requirements } from '../../db/schema'
import { eq } from 'drizzle-orm'

// JSON extraction helpers (moved from hermes.ts — needed by the Planner stage)
function extractJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch { /* continue */ }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>
    } catch { /* continue */ }
  }

  return null
}

function isOutlineJson(obj: unknown): obj is OutlineJson {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.title === 'string' &&
    Array.isArray(o.chapters) &&
    o.chapters.length > 0 &&
    o.chapters.every(
      (ch: unknown) =>
        typeof ch === 'object' &&
        ch !== null &&
        typeof (ch as Record<string, unknown>).title === 'string' &&
        Array.isArray((ch as Record<string, unknown>).sections),
    )
  )
}

// -- Orchestrator pipeline ---------------------------------------------------
//
// Generation order:
//   Planner (LLM outline, fallback to static) -> Writer (per section)
//   -> UML (diagrams) -> Tables (requirement matrices) -> Reviewer (quality pass)
//
// The pipeline is recoverable: if any stage fails (throws), the finally block still
// clears the active generation. All Writer sections committed before the failure
// remain in the DB — the document is in a partially-completed state that can be
// inspected via GET /documents/:id and re-generated if needed.

export async function orchestrateGeneration(
  projectId: string,
  prompt: string,
  documentId: string,
  templateId?: string,
): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate(): AsyncGenerator<HermesEvent> {
    try {
      // Create shared context for pipeline stages
      const ctx: GenerationContext = createContext(documentId, projectId)

      // ==================================================================
      // STEP 0: TEMPLATE SEEDING — if a template is provided, inject its
      // structure into the Planner prompt before generation begins.
      // ==================================================================
      let templateOutline: OutlineJson | null = null

      if (templateId) {
        const template = await getTemplateForGeneration(templateId)
        if (template) {
          templateOutline = template.outline
          adjustContext(ctx, 'templateId', templateId)
          adjustContext(ctx, 'templateName', template.name)
          yield { type: 'context_updated', agent: 'Hermes', key: 'templateName', value: template.name }
          console.log(`[Hermes] Template "${template.name}" loaded for generation`)
        } else {
          console.warn(`[Hermes] Template ${templateId} not found, proceeding without template`)
          yield {
            type: 'generation_error',
            agent: 'Hermes',
            message: `Template ${templateId} not found`,
            error_type: 'template_not_found',
          }
        }
      }

      // ==================================================================
      // STEP 1: PLANNER — generate dynamic outline via LLM
      // ==================================================================
      yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'planner' }
      yield { type: 'agent_status', agent: 'Planner', status: 'structuring' }

      let outlineJson: OutlineJson | null = null
      let collectedText = ''

      // Pre-fetch requirements from DB and inject into Planner prompt
      const reqs = await db
        .select({ type: requirements.type, text: requirements.text, sourceActor: requirements.sourceActor })
        .from(requirements)
        .where(eq(requirements.projectId, projectId))

      const funcReqs = reqs.filter(r => r.type === 'functional')
      const nonFuncReqs = reqs.filter(r => r.type === 'non_functional')

      let reqsText = ''
      if (funcReqs.length > 0) {
        reqsText += '\n\nExigences Fonctionnelles du projet :\n'
        funcReqs.forEach((r, i) => { reqsText += `  ${i + 1}. ${r.text}${r.sourceActor ? ` (Acteur: ${r.sourceActor})` : ''}\n` })
      }
      if (nonFuncReqs.length > 0) {
        reqsText += '\nExigences Non-Fonctionnelles du projet :\n'
        nonFuncReqs.forEach((r, i) => { reqsText += `  ${i + 1}. ${r.text}\n` })
      }

      // Build planner prompt (with requirements + template seeding)
      let plannerPrompt = `Analyze the following project brief and produce a structured document outline as a JSON object:\n\n"${prompt}"${reqsText}`

      if (funcReqs.length > 0 || nonFuncReqs.length > 0) {
        plannerPrompt += '\n\nIMPORTANT: The outline MUST include chapters and sections that directly address the requirements listed above. Do NOT produce a generic outline — each functional requirement should map to a specific section.'
      }

      if (templateOutline) {
        const chapterTitles = templateOutline.chapters.map(c => `- ${c.title}`).join('\n')
        plannerPrompt += `\n\nUtilise la structure suivante comme base pour le plan du document :\n${chapterTitles}`
      }

      const plannerGen = runAgent(
        'Planner',
        plannerPrompt,
        { projectId, documentId },
      )

      for await (const event of plannerGen) {
        if (event.type === 'token') {
          collectedText += (event as { token: string }).token
        }
        yield event
      }

      // Parse the Planner's JSON output. Fall back to static outline if invalid.
      const parsed = extractJson(collectedText)
      if (parsed && isOutlineJson(parsed)) {
        outlineJson = parsed
        ctx.outline = outlineJson
        adjustContext(ctx, 'outlineSource', 'planner')
        console.log('[Hermes] Planner generated custom outline:', outlineJson.title)
      } else {
        console.warn('[Hermes] Planner response was not valid JSON outline, using static fallback')
      }

      if (!outlineJson) {
        outlineJson = generateStaticOutline(prompt)
        ctx.outline = outlineJson
        adjustContext(ctx, 'outlineSource', 'static_fallback')
      }

      // Merge template outline with planner outline (after Planner completes)
      if (templateOutline && outlineJson) {
        try {
          outlineJson = mergeTemplateWithOutline(templateOutline, outlineJson)
          ctx.outline = outlineJson
          adjustContext(ctx, 'outlineSource', 'template_merged')
          console.log('[Hermes] Template outline merged with Planner output')
        } catch (err) {
          console.warn('[Hermes] Template merge failed, using Planner output only:', err)
          yield {
            type: 'generation_error',
            agent: 'Hermes',
            message: `Template merge failed: ${(err as Error).message}`,
            error_type: 'template_merge_error',
          }
        }
      }

      // Adjust context with outline metadata
      adjustContext(ctx, 'chapterCount', outlineJson.chapters.length)

      const sections = await createSectionsFromOutline(documentId, outlineJson)
      const sectionCount = sections.length
      yield { type: 'agent_status', agent: 'Planner', status: 'done' }
      yield { type: 'agent_status', agent: 'System', status: 'outline_created', sections_created: sectionCount }
      yield { type: 'context_updated', agent: 'Hermes', key: 'sectionCount', value: sectionCount }

      // ==================================================================
      // STEP 2: WRITER — draft each section with quality evaluation
      // ==================================================================
      if (sectionCount > 0) {
        yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'writer' }
        yield { type: 'agent_status', agent: 'Writer', status: 'thinking' }
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          yield {
            type: 'agent_status',
            agent: 'Writer',
            status: 'writing',
            section: `${i + 1}/${sectionCount}`,
            section_title: section.title,
          }

          const sectionPrompt = `Write the section titled "${section.title}" (sectionId: "${section.id}") for document ${documentId}.

First call getProjectContext(projectId: "${projectId}") to understand the project context and requirements relevant to this section.

Then call writeSection with sectionId="${section.id}" and your prose content.

This is part of a professional specification document ("cahier des charges"). Write clear, detailed, specific prose in French. Reference the actual requirements when writing — not generic placeholder text. Be technical and precise.`

          // Track rescope attempts for this section
          let rescopeCount = ctx.rescopeCount.get(section.id) || 0
          let sectionContent = ''

          // Try writing the section (with rescope loop for quality issues)
          let writerDone = false
          while (!writerDone && rescopeCount < 3) {
            const writerGen = runAgent('Writer', sectionPrompt, { projectId, documentId, sectionId: section.id })
            for await (const event of writerGen) {
              if (event.type === 'token') {
                sectionContent += (event as { token: string }).token
              }
              yield event
            }

            // Evaluate the output
            const quality = evaluateWriterOutput(sectionContent)
            if (!quality.passed) {
              rescopeCount++
              ctx.rescopeCount.set(section.id, rescopeCount)

              const decision = rescopeHandoff(
                'Writer',
                section.id,
                quality.issues.join('; '),
                rescopeCount,
              )

              if (decision.decision === 'abort') {
                // G2: loop breaker — mark for human review
                yield {
                  type: 'generation_error',
                  agent: 'Writer',
                  section_id: section.id,
                  message: decision.reason,
                  error_type: 'rescope_aborted',
                }
                writerDone = true
              } else {
                // Rescope: re-run with feedback injected
                yield {
                  type: 'context_updated',
                  agent: 'Hermes',
                  key: 'writer_rescope',
                  value: { sectionId: section.id, attempt: rescopeCount, feedback: quality.issues },
                }
                yield {
                  type: 'agent_status',
                  agent: 'Writer',
                  status: 'rescoping',
                  section: section.id,
                  attempt: rescopeCount,
                }
                // Modify prompt with feedback for next iteration
                const feedbackPrompt = `[FEEDBACK: ${quality.issues.join('. ')}] Please rewrite the section with more substantive content.`
                sectionContent = '' // Reset collected content for re-run
                // Note: we re-use the same prompt + feedback appended
                // The Writer is re-invoked with the original prompt plus feedback
                const rescopePrompt = `${sectionPrompt}\n\n${feedbackPrompt}`
                // Re-invoke the Writer for this section
                const rescopeGen = runAgent('Writer', rescopePrompt, { projectId, documentId, sectionId: section.id })
                for await (const event of rescopeGen) {
                  if (event.type === 'token') {
                    sectionContent += (event as { token: string }).token
                  }
                  yield event
                }
              }
            } else {
              writerDone = true
            }
          }

          yield { type: 'section_complete', section_id: section.id, title: section.title }
        }

        // G3: fabrication pattern scan (future — Phase 2)
        // G4: PII scan (future — Phase 2)
        yield { type: 'agent_status', agent: 'Writer', status: 'done' }
      }

      // ==================================================================
      // STEP 3: UML — generate diagrams from document content
      // ==================================================================
      yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'uml' }
      yield { type: 'agent_status', agent: 'UML', status: 'thinking' }

      // G1: before UML, verify ctx.outline exists (context_updated already handles this)
      if (!ctx.outline) {
        yield {
          type: 'generation_error',
          agent: 'UML',
          message: 'No outline available for UML generation — proceeding with document content only',
          error_type: 'missing_context',
        }
      }

      const umlPrompt = `Generate UML diagrams for project ${projectId} based on document ${documentId}.

First call getProjectContext and getDocumentContent to understand the project scope and requirements.

Then for each appropriate diagram type, call saveDiagram with:
  - projectId: "${projectId}"
  - type: one of "use_case", "sequence", "activity", "class", "deployment"
  - plantumlSource: valid PlantUML code with @startuml/@enduml

Generate at minimum a use case diagram and a sequence diagram. Add class and activity diagrams if relevant.`
      const umlGen = runAgent('UML', umlPrompt, { projectId, documentId })
      for await (const event of umlGen) {
        yield event
      }
      // G1: PlantUML syntax check (future — Phase 2)
      yield { type: 'agent_status', agent: 'UML', status: 'done' }

      // ==================================================================
      // STEP 4: TABLES — generate requirement matrices
      // ==================================================================
      yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'tables' }
      yield { type: 'agent_status', agent: 'Tables', status: 'thinking' }
      const tablesPrompt = `Generate structured requirement tables for document ${documentId}.

First call getProjectContext and getDocumentContent to understand the project.

Then for each table, call saveRequirementSection with:
  - documentId: "${documentId}"
  - title: descriptive title (e.g. "Matrice des exigences fonctionnelles")
  - content: markdown table format
  - order: numbers starting from 100

Generate tables for:
  1. Functional requirements matrix (columns: ID, Exigence, Description, Priorité, Acteur)
  2. Non-functional requirements matrix (columns: ID, Catégorie, Description, Métrique)
  3. Glossary / terminology table`
      const tablesGen = runAgent('Tables', tablesPrompt, { projectId, documentId })
      for await (const event of tablesGen) {
        yield event
      }
      yield { type: 'agent_status', agent: 'Tables', status: 'done' }

      // ==================================================================
      // STEP 5: REVIEWER — quality audit with write-back to comments and sections
      // ==================================================================
      yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'reviewer' }
      yield { type: 'agent_status', agent: 'Reviewer', status: 'thinking' }
      const reviewerPrompt = `Review the complete document ${documentId} for project ${projectId}.

Your workflow:
  1. Call getProjectContext and getDocumentContent
  2. For EACH section, take exactly ONE action:
     - approveSection(sectionId) — the section is acceptable
     - flagIssue(sectionId, message) — a problem was found
     - suggestFix(sectionId, text) — a concrete improvement is offered
  3. After all sections are reviewed, call updateDocumentStatus(documentId, "reviewed")

Check: consistency between sections, terminology alignment, completeness (no empty/generic content), professional tone, alignment with the project brief. Every section MUST be explicitly acted upon.`
      const reviewerGen = runAgent('Reviewer', reviewerPrompt, { projectId, documentId })
      for await (const event of reviewerGen) {
        yield event
      }
      yield { type: 'agent_status', agent: 'Reviewer', status: 'done' }

      yield { type: 'done' as const, document_id: documentId }
    } finally {
      clearActiveGeneration(documentId)
    }
  }

  return orchestrate()
}
