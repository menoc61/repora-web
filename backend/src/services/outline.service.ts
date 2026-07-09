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

const DEFAULT_OUTLINE: OutlineJson = {
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

export async function generateOutline(projectName: string, documentId: string): Promise<GeneratedSection[]> {
  const outline: OutlineJson = {
    ...DEFAULT_OUTLINE,
    title: projectName || 'Cahier des Charges',
  }

  const result = await createSectionsFromOutline(documentId, outline)
  return result
}

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
