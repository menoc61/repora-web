import { runAgent, clearGenerationState, type HermesEvent } from '../hermes'
import { createContext, type GenerationContext } from '../context'
import type { OutlineJson } from '../../services/outline.service'
import { createSectionsFromOutline, generateStaticOutline, mergeTemplateWithOutline } from '../../services/outline.service'
import { getTemplateForGeneration } from '../../services/template.service'
import { evaluateWriterOutput, rescopeHandoff, adjustContext } from './negotiate'
import { db } from '../../db'
import { requirements, documents, sections as sectionsTable, diagrams } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { broadcastNotification } from '../../collaboration/ws'
import { createDiagram } from '../../services/diagram.service'
import { generateTablesFromRequirements } from '../tools/tables'

// ── Document status persistence ──

async function saveDocumentStatus(documentId: string, status: string) {
  try {
    await db
      .update(documents)
      .set({ status, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
  } catch (err) {
    console.warn(`[Hermes] Failed to save document status "${status}":`, err)
  }
}

// ── Pipeline stage tracking (stored in document.outline JSON) ──

async function savePipelineStage(documentId: string, stage: string) {
  try {
    const [doc] = await db.select({ outline: documents.outline }).from(documents).where(eq(documents.id, documentId)).limit(1)
    const outline = (doc?.outline as Record<string, unknown>) || {}
    await db.update(documents).set({ outline: { ...outline, _pipelineStage: stage }, updatedAt: new Date() }).where(eq(documents.id, documentId))
  } catch (err) {
    console.warn(`[Hermes] Failed to save pipeline stage "${stage}":`, err)
  }
}

async function getPipelineStage(documentId: string): Promise<string | null> {
  try {
    const [doc] = await db.select({ outline: documents.outline }).from(documents).where(eq(documents.id, documentId)).limit(1)
    const outline = (doc?.outline as Record<string, unknown>) || null
    return (outline?._pipelineStage as string) || null
  } catch {
    return null
  }
}

// ── Resume detection: inspect document state to find the right restart point ──

type PipelineStage = 'planner' | 'writer' | 'uml' | 'tables' | 'reviewer'

async function detectResumeStage(documentId: string, projectId: string): Promise<PipelineStage> {
  // Check stored pipeline stage first
  const stored = await getPipelineStage(documentId)
  if (stored && ['planner', 'writer', 'uml', 'tables', 'reviewer'].includes(stored)) {
    console.log(`[Hermes] Resume from stored pipeline stage: ${stored}`)
    return stored as PipelineStage
  }

  // Check document state
  const [doc] = await db.select({ status: documents.status, outline: documents.outline })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)

  if (!doc) return 'planner'

  // If document has no outline yet, start from planner (fresh generation)
  const outline = doc.outline as Record<string, unknown> | null
  if (!outline || !outline._pipelineStage) {
    // Check if sections have real content (not just placeholder)
    const docSections = await db.select({ id: sectionsTable.id, content: sectionsTable.content, title: sectionsTable.title })
      .from(sectionsTable)
      .where(eq(sectionsTable.documentId, documentId))

    if (docSections.length === 0) return 'planner'

    const hasRealContent = docSections.some(s => s.content && s.content.trim().length > 50)
    if (!hasRealContent) {
      // Only 1 placeholder section with no content = fresh generation, start from planner
      if (docSections.length <= 1) return 'planner'
      // Multiple sections but no content = writer needs to fill them
      return 'writer'
    }
  }

  // Document has outline with stored pipeline stage — use it
  if (outline?._pipelineStage) {
    return outline._pipelineStage as PipelineStage
  }

  // Fallback: inspect DB state for documents with content but no stored stage
  const docSections = await db.select({ id: sectionsTable.id, content: sectionsTable.content, title: sectionsTable.title })
    .from(sectionsTable)
    .where(eq(sectionsTable.documentId, documentId))

  if (docSections.length === 0) return 'planner'

  const hasContent = docSections.some(s => s.content && s.content.trim().length > 50)
  if (!hasContent) return 'writer'

  const diagramRows = await db.select({ id: diagrams.id })
    .from(diagrams)
    .where(eq(diagrams.projectId, projectId))
  if (diagramRows.length === 0) return 'uml'

  return 'reviewer'
}

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
  docConfig?: Record<string, unknown>,
): Promise<AsyncGenerator<HermesEvent>> {
  async function* orchestrate(): AsyncGenerator<HermesEvent> {
    try {
      // Create shared context for pipeline stages
      const ctx: GenerationContext = createContext(documentId, projectId)

      // Load document config if not provided
      let config = docConfig
      if (!config) {
        const [doc] = await db.select({ config: documents.config })
          .from(documents)
          .where(eq(documents.id, documentId))
          .limit(1)
        config = (doc?.config as Record<string, unknown>) || {}
      }
      const pageCount = (config.pageCount as string) || 'medium'
      const diagramTypes = (config.diagramTypes as string[]) || ['use_case']
      const header = (config.header as Record<string, string>) || {}
      const footer = (config.footer as Record<string, unknown>) || {}

      // Detect resume stage from existing document state
      const resumeStage = await detectResumeStage(documentId, projectId)
      console.log(`[Hermes] Pipeline starting from stage: ${resumeStage}`)

      broadcastNotification({
        type: 'generation_started',
        title: 'Generation lancee',
        message: resumeStage !== 'planner'
          ? `Reprise du pipeline depuis l'etape: ${resumeStage}`
          : 'Le pipeline Hermes demarre la generation du cahier des charges.',
        data: { documentId, projectId, resumeStage },
      })

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
      // (skip if resuming from a later stage)
      // ==================================================================
      let outlineJson: OutlineJson | null = null
      let sections: Array<{ id: string; title: string; order: number }> = []
      let sectionCount = 0

      if (resumeStage === 'planner') {
      yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'planner' }
      yield { type: 'agent_status', agent: 'Planner', status: 'structuring' }

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

      // Inject page count guidance from document config
      const sectionTarget = pageCount === 'short' ? '5-6' : pageCount === 'long' ? '14-16' : '9-11'
      plannerPrompt += `\n\nDocument size: ${pageCount} — aim for approximately ${sectionTarget} sections across all chapters.`

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

      sections = await createSectionsFromOutline(documentId, outlineJson)
      sectionCount = sections.length
      yield { type: 'agent_status', agent: 'Planner', status: 'done' }
      yield { type: 'agent_status', agent: 'System', status: 'outline_created', sections_created: sectionCount }
      yield { type: 'context_updated', agent: 'Hermes', key: 'sectionCount', value: sectionCount }
      await saveDocumentStatus(documentId, 'draft')
      await savePipelineStage(documentId, 'planner')
      } else {
        // Resume: load existing sections from DB
        sections = await db.select({ id: sectionsTable.id, title: sectionsTable.title, order: sectionsTable.order })
          .from(sectionsTable)
          .where(eq(sectionsTable.documentId, documentId))
          .orderBy(sectionsTable.order)
        sectionCount = sections.length
        console.log(`[Hermes] Resume: loaded ${sectionCount} existing sections`)
        yield { type: 'agent_status', agent: 'System', status: 'resumed', stage: resumeStage, sections_loaded: sections.length }
      }

      // ==================================================================
      // STEP 2: WRITER — draft each section with quality evaluation
      // When resuming, skip sections that already have substantive content
      // ==================================================================
      if (sectionCount > 0 && (resumeStage === 'writer' || resumeStage === 'planner')) {
        yield { type: 'context_updated', agent: 'Hermes', key: 'pipelineStage', value: 'writer' }
        yield { type: 'agent_status', agent: 'Writer', status: 'thinking' }

        // When resuming from 'writer', check which sections already have content
        let startIdx = 0
        if (resumeStage === 'writer') {
          const existingContents = await db.select({ id: sectionsTable.id, content: sectionsTable.content })
            .from(sectionsTable)
            .where(eq(sectionsTable.documentId, documentId))
          const contentMap = new Map(existingContents.map(r => [r.id, r.content || '']))
          // Find first section without substantive content
          while (startIdx < sections.length) {
            const s = sections[startIdx]
            const existing = contentMap.get(s.id) || ''
            if (existing.trim().length >= 50) {
              yield { type: 'section_complete', section_id: s.id, title: s.title, skipped: true }
              startIdx++
            } else {
              break
            }
          }
          if (startIdx >= sections.length) {
            console.log('[Hermes] Writer resume: all sections already have content')
          } else {
            console.log(`[Hermes] Writer resume: starting from section ${startIdx + 1}/${sectionCount}`)
          }
        }

        for (let i = startIdx; i < sections.length; i++) {
          const section = sections[i]
          yield {
            type: 'agent_status',
            agent: 'Writer',
            status: 'writing',
            section: `${i + 1}/${sectionCount}`,
            section_title: section.title,
          }

          const sectionPrompt = `Write the section "${section.title}" (sectionId: "${section.id}") for document ${documentId}.

Step 1: Call getProjectContext(projectId: "${projectId}") to get the project context.

Step 2: Write the actual specification text for this section. Write 300-800 words of professional French technical prose. Do NOT write meta-commentary like "I will write..." — just write the content directly.

Step 3: Call writeSection with:
- sectionId: "${section.id}"  
- content: your complete written text (the actual specification, NOT an explanation)

IMPORTANT: The content parameter must contain the FINAL document text. No preamble, no "Here is...", no "I'll help you write...". Just the specification content itself.`

          // Track rescope attempts for this section
          let rescopeCount = ctx.rescopeCount.get(section.id) || 0
          let sectionContent = ''

          // Try writing the section (with rescope loop for quality issues)
          let writerDone = false
          let currentPrompt = sectionPrompt
          while (!writerDone && rescopeCount < 3) {
            const writerGen = runAgent('Writer', currentPrompt, { projectId, documentId, sectionId: section.id })
            sectionContent = '' // Reset for this attempt
            let toolCalled = false
            for await (const event of writerGen) {
              if (event.type === 'token') {
                sectionContent += (event as { token: string }).token
              }
              if (event.type === 'tool_call' && (event as any).tool === 'writeSection') {
                toolCalled = true
              }
              yield event
            }

            // After agent completes, read actual content from DB (writeSection tool persists there)
            try {
              const [dbSection] = await db
                .select({ content: sectionsTable.content })
                .from(sectionsTable)
                .where(eq(sectionsTable.id, section.id))
                .limit(1)
              if (dbSection?.content && dbSection.content.trim().length > 0) {
                sectionContent = dbSection.content
              }
            } catch { /* use streamed content as fallback */ }

            // Always save to DB: tool-written content takes priority, but if the
            // model stopped mid-stream or never called the tool, persist whatever
            // was captured so work isn't lost and resume can pick up from here.
            if (sectionContent.trim().length > 0) {
              try {
                await db
                  .update(sectionsTable)
                  .set({ content: sectionContent.trim(), status: 'draft' })
                  .where(eq(sectionsTable.id, section.id))
                if (!toolCalled) {
                  console.log(`[Hermes] Writer: tool not called, saved ${sectionContent.length} chars directly to DB`)
                }
              } catch (err) {
                console.warn('[Hermes] Writer: failed to save content directly:', err)
              }
            }

            // If the model didn't call any tools, rescoping won't help — accept
            // whatever text was produced and move on to the next section
            if (!toolCalled) {
              console.log(`[Hermes] Writer: no tools called — accepting ${sectionContent.length} chars of text output for section ${section.id}`)
              if (sectionContent.trim().length === 0) {
                yield {
                  type: 'generation_error',
                  agent: 'Writer',
                  section_id: section.id,
                  message: 'Le modèle n\'a produit aucun contenu. Vérifiez qu\'Ollama est en ligne.',
                  error_type: 'empty_output',
                }
              }
              writerDone = true
              continue
            }

            // Evaluate the output (only when tools were actually used)
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
                yield {
                  type: 'generation_error',
                  agent: 'Writer',
                  section_id: section.id,
                  message: decision.reason,
                  error_type: 'rescope_aborted',
                }
                writerDone = true
              } else {
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
                // Modify prompt with feedback for next iteration (replaces, not appends)
                const feedbackPrompt = `[FEEDBACK: ${quality.issues.join('. ')}] Please rewrite the section with more substantive content.`
                currentPrompt = `${sectionPrompt}\n\n${feedbackPrompt}`
                // Loop continues — will re-run Writer with updated prompt
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
        await saveDocumentStatus(documentId, 'in_review')
        await savePipelineStage(documentId, 'writer')
      }

      // ==================================================================
      // STEP 3: UML — generate diagrams from document content
      // (skip if resuming from a later stage)
      // ==================================================================
      if (resumeStage === 'planner' || resumeStage === 'writer') {
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
  - type: one of "${diagramTypes.join('", "')}"
  - plantumlSource: valid PlantUML code with @startuml/@enduml

Generate diagrams of these types: ${diagramTypes.join(', ')}.`
      const umlGen = runAgent('UML', umlPrompt, { projectId, documentId })
      for await (const event of umlGen) {
        yield event
      }

      // Fallback: if UML agent didn't call saveDiagram, generate diagrams via service
      const existingDiagrams = await db.select({ id: diagrams.id })
        .from(diagrams)
        .where(eq(diagrams.projectId, projectId))

      if (existingDiagrams.length === 0) {
        console.log('[Hermes] UML agent produced no diagrams — generating via fallback')
        yield { type: 'agent_status', agent: 'UML', status: 'generating_fallback' }

        // Map diagram types to likely section IDs for linking
        const allSections = await db.select({ id: sectionsTable.id, title: sectionsTable.title })
          .from(sectionsTable)
          .where(eq(sectionsTable.documentId, documentId))
          .orderBy(sectionsTable.order)

        const SECTION_KEYWORDS: Record<string, string[]> = {
          use_case: ['cas d\'utilisation', 'fonctionnal', 'exigences fonctionnel', 'besoins', 'acteur'],
          sequence: ['séquence', 'architec', 'technique', 'interactions', 'communication'],
          activity: ['activité', 'processus', 'workflow', 'flux'],
          class: ['classe', 'modèle', 'données', 'entité', 'domaine'],
          deployment: ['déploiement', 'infrastructure', 'hébergement', 'environnement'],
        }

        function findSectionForDiagram(diagType: string): string | undefined {
          const keywords = SECTION_KEYWORDS[diagType] || []
          for (const kw of keywords) {
            const match = allSections.find(s => s.title.toLowerCase().includes(kw))
            if (match) return match.id
          }
          // Fallback: use the last section (often "Architecture" or "Conclusion")
          return allSections[allSections.length - 1]?.id
        }

        for (const diagType of diagramTypes) {
          try {
            const targetSectionId = findSectionForDiagram(diagType)
            const d = await createDiagram(projectId, diagType, ctx.outline?.title || prompt, targetSectionId)
            yield { type: 'tool_call', agent: 'UML', tool: 'saveDiagram', args: { type: diagType, projectId, sectionId: targetSectionId } }
            yield { type: 'tool_result', agent: 'UML', tool: 'saveDiagram', result: { id: d.id, ok: true } }
          } catch (err) {
            console.warn(`[Hermes] Fallback diagram generation failed for ${diagType}:`, (err as Error).message)
          }
        }
      }

      // G1: PlantUML syntax check (future — Phase 2)
      yield { type: 'agent_status', agent: 'UML', status: 'done' }

      // Insert diagram images into section content
      const diagramList = await db.select({ id: diagrams.id, type: diagrams.type, sectionId: diagrams.sectionId, renderedUrl: diagrams.renderedUrl })
        .from(diagrams)
        .where(eq(diagrams.projectId, projectId))

      for (const diag of diagramList) {
        if (diag.sectionId && diag.renderedUrl) {
          const [sec] = await db.select({ id: sectionsTable.id, content: sectionsTable.content })
            .from(sectionsTable)
            .where(eq(sectionsTable.id, diag.sectionId))
            .limit(1)
          if (sec) {
            const existing = sec.content || ''
            // Only insert if not already present
            if (!existing.includes(diag.renderedUrl)) {
              const typeLabel = diag.type.replace(/_/g, ' ')
              const imageBlock = `\n\n![Diagramme ${typeLabel}](${diag.renderedUrl})\n\n`
              await db.update(sectionsTable)
                .set({ content: existing + imageBlock, updatedAt: new Date() })
                .where(eq(sectionsTable.id, diag.sectionId))
              console.log(`[Hermes] Inserted diagram ${diag.type} into section ${diag.sectionId}`)
            }
          }
        }
      }

      await saveDocumentStatus(documentId, 'in_review')
      await savePipelineStage(documentId, 'uml')
      } // end UML resume check

      // ==================================================================
      // STEP 4: TABLES — generate requirement matrices
      // (skip if resuming from a later stage)
      // ==================================================================
      if (resumeStage === 'planner' || resumeStage === 'writer' || resumeStage === 'uml') {
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

      // Fallback: if Tables agent didn't produce any table sections, generate from project data
      const tableSections = await db.select({ id: sectionsTable.id, order: sectionsTable.order })
        .from(sectionsTable)
        .where(eq(sectionsTable.documentId, documentId))
      const hasTableSections = tableSections.some(s => (s.order ?? 0) >= 100)

      if (!hasTableSections) {
        console.log('[Hermes] Tables agent produced no table sections — generating via fallback')
        yield { type: 'agent_status', agent: 'Tables', status: 'generating_fallback' }
        const fallbackTables = await generateTablesFromRequirements(documentId, projectId)
        for (const tbl of fallbackTables) {
          try {
            const { sql } = await import('drizzle-orm')
            const existing = await db.select({ maxOrder: sql<number>`coalesce(max(${sectionsTable.order}), 0)` })
              .from(sectionsTable).where(eq(sectionsTable.documentId, documentId))
            const maxOrder = existing.length > 0 ? (existing[0].maxOrder ?? 0) : 0
            const order = Math.max(tbl.order, maxOrder + 1)
            const [inserted] = await db.insert(sectionsTable).values({
              documentId, order, title: tbl.title, content: tbl.content, status: 'draft',
            }).returning({ id: sectionsTable.id })
            yield { type: 'tool_call', agent: 'Tables', tool: 'saveRequirementSection', args: { title: tbl.title, order } }
            yield { type: 'tool_result', agent: 'Tables', tool: 'saveRequirementSection', result: { id: inserted.id, ok: true } }
          } catch (err) {
            console.warn(`[Hermes] Fallback table generation failed for "${tbl.title}":`, (err as Error).message)
          }
        }
      }

      yield { type: 'agent_status', agent: 'Tables', status: 'done' }
      await saveDocumentStatus(documentId, 'in_review')
      await savePipelineStage(documentId, 'tables')
      } // end Tables resume check

      // ==================================================================
      // STEP 5: REVIEWER — quality audit with write-back to comments and sections
      // (skip if resuming from reviewer and document is already reviewed)
      // ==================================================================
      if (resumeStage !== 'reviewer' || true) { // always run reviewer on resume since it's the quality gate
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
      await saveDocumentStatus(documentId, 'reviewed')
      await savePipelineStage(documentId, 'reviewer')
      } // end Reviewer resume check

      broadcastNotification({
        type: 'generation_complete',
        title: 'Generation terminee',
        message: 'Le pipeline Hermes a termine la generation. Le document est pret.',
        data: { documentId },
      })

      yield { type: 'done' as const, document_id: documentId }
    } finally {
      clearGenerationState(documentId)
    }
  }

  return orchestrate()
}
