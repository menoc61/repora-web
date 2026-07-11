import { getDocument } from './document.service'
import { uploadExport, downloadExport } from './s3.service'
import { db } from '../db'
import { documents, diagrams as diagramsTable } from '../db/schema'
import { eq } from 'drizzle-orm'
import { buildProfessionalPdf } from './exportPdf'
import { buildProfessionalDocx } from './exportDocx'
import * as fs from 'fs'
import * as path from 'path'

function buildMarkdown(doc: Awaited<ReturnType<typeof getDocument>>): string {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]

  let md = ''
  md += `# ${title}\n\n`
  md += `**Date:** ${date}\n\n`
  md += `---\n\n`
  md += `## Table des matieres\n\n`
  for (let i = 0; i < doc.sections.length; i++) {
    md += `${i + 1}. [${doc.sections[i].title}](#${doc.sections[i].title.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`
  }
  md += `\n---\n\n`
  for (const s of doc.sections) {
    md += `## ${s.title}\n\n`
    md += `${s.content || '*(Aucun contenu)*'}\n\n`
  }
  return md
}

interface ExportResult {
  buffer: Buffer
  mimeType: string
  filename: string
  s3Key?: string
}

/**
 * Export a document to the specified format with professional styling.
 */
export async function exportDocument(documentId: string, format: 'pdf' | 'docx' | 'md'): Promise<ExportResult> {
  const doc = await getDocument(documentId)
  const shortId = documentId.slice(0, 8)

  // Fetch diagrams with PNG buffers
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
        if (fs.existsSync(filePath)) {
          pngBuffer = fs.readFileSync(filePath)
        }
      } catch {}
    }
    return { ...d, pngBuffer }
  })

  let result: ExportResult

  switch (format) {
    case 'pdf': {
      const pdfBuffer = await buildProfessionalPdf(doc as any, diagrams as any)
      result = { buffer: pdfBuffer, mimeType: 'application/pdf', filename: `document-${shortId}.pdf` }
      break
    }
    case 'docx': {
      const docxBuffer = await buildProfessionalDocx(doc as any, diagrams as any)
      result = { buffer: docxBuffer, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename: `document-${shortId}.docx` }
      break
    }
    case 'md': {
      const mdContent = buildMarkdown(doc)
      result = { buffer: Buffer.from(mdContent, 'utf-8'), mimeType: 'text/markdown', filename: `document-${shortId}.md` }
      break
    }
    default:
      throw new Error(`Format non supporte: ${format}`)
  }

  // Store in S3/MinIO (fire-and-forget, don't block the response)
  try {
    const s3Key = await uploadExport(documentId, format, result.buffer, result.mimeType)
    result.s3Key = s3Key
    const exportUrl = `${result.s3Key}`
    await db.update(documents)
      .set({ exportUrl, updatedAt: new Date() })
      .where(eq(documents.id, documentId))
  } catch (err) {
    console.warn(`[Export] Failed to store in S3:`, (err as Error).message)
  }

  return result
}

/**
 * Retrieve a previously exported document from S3/MinIO.
 */
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
