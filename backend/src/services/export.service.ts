import { getDocument } from './document.service'
import { uploadExport, downloadExport } from './s3.service'
import { db } from '../db'
import { documents, diagrams as diagramsTable } from '../db/schema'
import { eq } from 'drizzle-orm'
import { buildProfessionalDocx } from './exportDocx'
import { convertDocxToPdf, isLibreOfficeAvailable } from './docxToPdf'
import { generatePdfFallback } from './pdfFallback'
import * as fs from 'fs'
import * as path from 'path'

function buildMarkdown(doc: Awaited<ReturnType<typeof getDocument>>): string {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]
  let md = `# ${title}\n\n**Date:** ${date}\n\n---\n\n## Table des matieres\n\n`
  for (let i = 0; i < doc.sections.length; i++) {
    md += `${i + 1}. [${doc.sections[i].title}](#${doc.sections[i].title.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`
  }
  md += `\n---\n\n`
  for (const s of doc.sections) {
    md += `## ${s.title}\n\n${s.content || '*(Aucun contenu)*'}\n\n`
  }
  return md
}

interface ExportResult {
  buffer: Buffer
  mimeType: string
  filename: string
  s3Key?: string
}

export async function exportDocument(documentId: string, format: 'pdf' | 'docx' | 'md', userId?: string, role?: string): Promise<ExportResult> {
  const doc = await getDocument(documentId, userId, role)
  const shortId = documentId.slice(0, 8)

  const diagramRows = await db.select({
    id: diagramsTable.id,
    type: diagramsTable.type,
    sectionId: diagramsTable.sectionId,
    renderedUrl: diagramsTable.renderedUrl,
  })
    .from(diagramsTable)
    .where(eq(diagramsTable.projectId, doc.projectId))

  const diagrams = diagramRows.map(d => {
    let pngBuffer: Buffer | undefined
    if (d.renderedUrl?.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), d.renderedUrl)
        if (fs.existsSync(filePath)) pngBuffer = fs.readFileSync(filePath)
      } catch {}
    }
    return { ...d, pngBuffer }
  })

  let result: ExportResult

  if (format === 'md') {
    const mdContent = buildMarkdown(doc)
    result = { buffer: Buffer.from(mdContent, 'utf-8'), mimeType: 'text/markdown', filename: `document-${shortId}.md` }
  } else {
    const docxBuffer = await buildProfessionalDocx(doc as any, diagrams as any)
    if (format === 'docx') {
      result = {
        buffer: docxBuffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `document-${shortId}.docx`,
      }
    } else {
      let pdfBuffer: Buffer
      if (isLibreOfficeAvailable()) {
        pdfBuffer = await convertDocxToPdf(docxBuffer)
      } else {
        const title = (doc.outline as { title?: string } | null)?.title || 'Document'
        const subtitle = (doc.outline as { subtitle?: string } | null)?.subtitle || ''
        const description = (doc.outline as { description?: string } | null)?.description || ''
        const config = (doc.config || {}) as Record<string, unknown>
        const author = (config.author as string) || ''
        const monthYear = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })

        pdfBuffer = await generatePdfFallback({
          title,
          subtitle,
          description,
          author,
          monthYear,
          sections: doc.sections.map((s) => ({ title: s.title, content: s.content || '' })),
        })
      }
      result = {
        buffer: pdfBuffer,
        mimeType: 'application/pdf',
        filename: `document-${shortId}.pdf`,
      }
    }
  }

  try {
    const s3Key = await uploadExport(documentId, format, result.buffer, result.mimeType)
    result.s3Key = s3Key
    await db.update(documents)
      .set({ exportUrl: s3Key, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
  } catch (err) {
    console.warn(`[Export] S3 storage failed:`, (err as Error).message)
  }

  return result
}

export async function getStoredExport(documentId: string, format: string): Promise<ExportResult | null> {
  try {
    const [doc] = await db.select({ exportUrl: documents.exportUrl })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    if (!doc?.exportUrl) return null

    const { buffer, contentType } = await downloadExport(doc.exportUrl)
    const shortId = documentId.slice(0, 8)
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      md: 'text/markdown',
    }

    return {
      buffer,
      mimeType: contentType || mimeMap[format] || 'application/octet-stream',
      filename: `document-${shortId}.${format === 'md' ? 'md' : format}`,
      s3Key: doc.exportUrl,
    }
  } catch {
    return null
  }
}
