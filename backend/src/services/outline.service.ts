import { db } from '../db'
import { documents, sections } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface OutlineChapter { title: string; sections: Array<{ title: string; order: number }> }
export interface OutlineJson { title: string; chapters: OutlineChapter[] }

export interface GeneratedSection {
  id: string
  title: string
  order: number
}

// Static fallback outline used when the Planner agent's LLM call fails.
// This provides a sensible default structure for a "cahier des charges".
export const DEFAULT_OUTLINE: OutlineJson = {
  title: 'Cahier des Charges',
  chapters: [
    {
      title: '1. Introduction',
      sections: [
        { title: 'Contexte', order: 1 },
        { title: 'Objectifs', order: 2 },
        { title: 'Perimetre', order: 3 },
      ],
    },
    {
      title: '2. Exigences Fonctionnelles',
      sections: [
        { title: 'Fonctionnalites principales', order: 4 },
        { title: 'Cas d\'utilisation', order: 5 },
        { title: 'Interfaces utilisateur', order: 6 },
      ],
    },
    {
      title: '3. Exigences Non-Fonctionnelles',
      sections: [
        { title: 'Performance et scalabilite', order: 7 },
        { title: 'Securite', order: 8 },
        { title: 'Disponibilite et fiabilite', order: 9 },
      ],
    },
    {
      title: '4. Architecture Technique',
      sections: [
        { title: 'Vue d\'ensemble du systeme', order: 10 },
        { title: 'Composants et modules', order: 11 },
        { title: 'Modele de donnees', order: 12 },
      ],
    },
    {
      title: '5. Plan de Mise en Oeuvre',
      sections: [
        { title: 'Phases du projet', order: 13 },
        { title: 'Calendrier et jalons', order: 14 },
        { title: 'Livrables', order: 15 },
      ],
    },
    {
      title: '6. References et Glossaire',
      sections: [
        { title: 'Termes et definitions', order: 16 },
        { title: 'Documents de reference', order: 17 },
      ],
    },
  ],
}

// Fallback: returns the static outline with the project name as title.
// Called by hermes.ts when the Planner LLM fails to produce a valid outline.
export function generateStaticOutline(projectName: string): OutlineJson {
  return {
    ...DEFAULT_OUTLINE,
    title: projectName || 'Cahier des Charges',
  }
}

// Persist an outline into the sections table and update the document outline field.
// Replaces any existing sections for the document. Used by hermes.ts after obtaining
// an outline (whether from the Planner LLM or the static fallback).
export async function createSectionsFromOutline(
  documentId: string,
  outline: OutlineJson,
): Promise<GeneratedSection[]> {
  if (documentId) {
    await db.delete(sections).where(eq(sections.documentId, documentId))
  }

  let order = 0
  const created: GeneratedSection[] = []

  for (const chapter of outline.chapters) {
    for (const section of chapter.sections) {
      order++
      const title = `${chapter.title} — ${section.title}`
      if (documentId) {
        const [row] = await db.insert(sections).values({
          documentId,
          order,
          title,
          content: '',
          status: 'draft',
        }).returning({ id: sections.id })
        created.push({ id: row.id, title, order })
      } else {
        created.push({ id: '', title, order })
      }
    }
  }

  if (documentId) {
    await db.update(documents).set({ outline }).where(eq(documents.id, documentId))
  }

  return created
}

/**
 * Merge a template outline into a Planner-generated outline.
 * - Uses the template's title if the Planner produced a generic title
 * - Uses the template's chapter structure as the base
 * - For matching chapters (fuzzy title match), uses Planner sections over template placeholders
 * - Appends Planner-only chapters that don't match any template chapter
 *
 * @param templateOutline - The canonical template structure (admin-created)
 * @param plannerOutline - The outline produced by the Planner agent
 * @returns The merged outline
 */
export function mergeTemplateWithOutline(
  templateOutline: OutlineJson,
  plannerOutline: OutlineJson,
): OutlineJson {
  // Use template title unless planner has a specific, non-generic title
  const genericTitles = ['cahier des charges', 'untitled', 'cahier de charges', 'document']
  const plannerTitleLower = plannerOutline.title.toLowerCase().trim()
  const useTemplateTitle = plannerTitleLower === '' ||
    genericTitles.some(g => plannerTitleLower.includes(g)) ||
    plannerTitleLower === 'untitled'

  const mergedTitle = useTemplateTitle ? templateOutline.title : plannerOutline.title

  // Helper: fuzzy match two chapter titles
  const fuzzyMatch = (a: string, b: string): boolean => {
    const na = a.toLowerCase().trim()
    const nb = b.toLowerCase().trim()
    return na === nb || na.includes(nb) || nb.includes(na)
  }

  // Build merged chapters starting from template structure
  const mergedChapters: OutlineJson['chapters'] = []
  const matchedPlannerIndices = new Set<number>()

  for (const tc of templateOutline.chapters) {
    // Try to find a matching Planner chapter
    const plannerMatchIdx = plannerOutline.chapters.findIndex((pc, idx) => {
      if (matchedPlannerIndices.has(idx)) return false
      return fuzzyMatch(tc.title, pc.title)
    })

    if (plannerMatchIdx >= 0) {
      matchedPlannerIndices.add(plannerMatchIdx)
      const pc = plannerOutline.chapters[plannerMatchIdx]

      // Use Planner sections if they are substantial; otherwise keep template sections
      const hasSubstantialPlannerSections = pc.sections.some(
        s => s.title.trim().length > 0,
      )

      if (hasSubstantialPlannerSections) {
        mergedChapters.push({
          title: pc.title || tc.title,
          sections: pc.sections.map(s => ({
            title: s.title || `Section ${s.order}`,
            order: s.order,
          })),
        })
      } else {
        mergedChapters.push({
          title: tc.title,
          sections: tc.sections.map(s => ({
            title: s.title,
            order: s.order,
          })),
        })
      }
    } else {
      // No matching Planner chapter — keep template chapter as-is
      mergedChapters.push({
        title: tc.title,
        sections: tc.sections.map(s => ({
          title: s.title,
          order: s.order,
        })),
      })
    }
  }

  // Append any Planner chapters that didn't match template chapters
  for (let i = 0; i < plannerOutline.chapters.length; i++) {
    if (!matchedPlannerIndices.has(i)) {
      mergedChapters.push(plannerOutline.chapters[i])
    }
  }

  return {
    title: mergedTitle,
    chapters: mergedChapters,
  }
}
