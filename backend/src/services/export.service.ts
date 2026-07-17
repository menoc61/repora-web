import { getDocument } from './document.service'
import { logger } from '../lib/logger'
import { uploadExport, downloadExport } from './s3.service'
import { db } from '../db'
import { documents, diagrams as diagramsTable } from '../db/schema'
import { eq } from 'drizzle-orm'
import { buildProfessionalDocx } from './exportDocx'
import { convertDocxToPdf, isLibreOfficeAvailable } from './docxToPdf'
import { generatePdfFallback } from './pdfFallback'
import { config } from '../config'
import { deflateSync } from 'zlib'
import * as fs from 'fs'
import * as path from 'path'

const log = logger.child('Export')
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

async function fetchPngFromPlantUML(plantumlSource: string): Promise<Buffer | null> {
  try {
    const encoded = encodePlantUML(plantumlSource)
    const pngUrl = `${config.plantumlUrl}/png/~1${encoded}`
    const resp = await fetch(pngUrl)
    if (resp.ok) {
      return Buffer.from(await resp.arrayBuffer())
    }
    log.warn(`PlantUML PNG fetch failed (${resp.status})`)
  } catch (err) {
    log.warn(`PlantUML PNG fetch error:`, (err as Error).message)
  }
  return null
}

interface ExportUrls {
  pdf?: string
  docx?: string
  md?: string
}

function buildMarkdown(doc: Awaited<ReturnType<typeof getDocument>>, diagrams: Array<{ id: string; type: string; renderedUrl?: string | null; sectionId?: string | null }>): string {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]
  let md = `# ${title}\n\n**Date:** ${date}\n\n---\n\n## Table des matieres\n\n`
  for (let i = 0; i < doc.sections.length; i++) {
    md += `${i + 1}. [${doc.sections[i].title}](#${doc.sections[i].title.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`
  }
  md += `\n---\n\n`
  for (const s of doc.sections) {
    md += `## ${s.title}\n\n${s.content || '*(Aucun contenu)*'}\n\n`
    // Append diagrams for this section
    const sectionDiagrams = diagrams.filter(d => d.sectionId === s.id)
    for (const d of sectionDiagrams) {
      if (d.renderedUrl) {
        md += `![Diagramme ${d.type}](${d.renderedUrl})\n\n`
      }
    }
  }
  // Append orphan diagrams
  const orphanDiagrams = diagrams.filter(d => !d.sectionId)
  if (orphanDiagrams.length > 0) {
    md += `## Diagrammes\n\n`
    for (const d of orphanDiagrams) {
      if (d.renderedUrl) {
        md += `![Diagramme ${d.type}](${d.renderedUrl})\n\n`
      }
    }
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
    plantumlSource: diagramsTable.plantumlSource,
  })
    .from(diagramsTable)
    .where(eq(diagramsTable.projectId, doc.projectId))

  const diagrams = await Promise.all(diagramRows.map(async d => {
    let pngBuffer: Buffer | undefined
    if (d.renderedUrl?.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), d.renderedUrl)
        if (fs.existsSync(filePath)) pngBuffer = fs.readFileSync(filePath)
      } catch {}
    }
    // If no local PNG, fetch from PlantUML server using stored source
    if (!pngBuffer && d.plantumlSource) {
      pngBuffer = await fetchPngFromPlantUML(d.plantumlSource) || undefined
    }
    return { ...d, pngBuffer }
  }))

  let result: ExportResult

  if (format === 'md') {
    const mdContent = buildMarkdown(doc, diagrams)
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
          sections: doc.sections.map((s) => ({ id: s.id, title: s.title, content: s.content || '' })),
          diagrams: diagrams.map(d => ({ id: d.id, type: d.type, renderedUrl: d.renderedUrl, sectionId: d.sectionId })),
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
    if (s3Key) {
      result.s3Key = s3Key
      // Store per-format URLs in JSON
      const [existing] = await db.select({ exportUrl: documents.exportUrl })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)
      let urls: ExportUrls = {}
      if (existing?.exportUrl) {
        try { urls = JSON.parse(existing.exportUrl) } catch {}
      }
      urls[format as keyof ExportUrls] = s3Key
      await db.update(documents)
        .set({ exportUrl: JSON.stringify(urls), updatedAt: new Date() })
        .where(eq(documents.id, documentId))
    }
  } catch (err) {
    log.warn(`S3 storage failed:`, (err as Error).message)
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

    // Parse JSON to get per-format key
    let urls: ExportUrls = {}
    try { urls = JSON.parse(doc.exportUrl) } catch { return null }
    const key = urls[format as keyof ExportUrls]
    if (!key) return null

    const download = await downloadExport(key)
    if (!download) return null
    const { buffer, contentType } = download
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
      s3Key: key,
    }
  } catch {
    return null
  }
}
