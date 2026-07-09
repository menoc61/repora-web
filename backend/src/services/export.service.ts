import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { getDocument } from './document.service'

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

async function buildPdf(doc: Awaited<ReturnType<typeof getDocument>>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]
  const fontSize = 11
  const pageWidth = 595
  const pageHeight = 842
  const margin = 60
  const maxWidth = pageWidth - margin * 2

  function wordWrap(text: string): string[] {
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ')
    return cleanText.split('\n').flatMap((paragraph) => {
      if (paragraph.trim() === '') return ['']
      const words = paragraph.split(' ')
      const lines: string[] = []
      let line = ''
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
          if (line) lines.push(line)
          line = word
        } else {
          line = test
        }
      }
      if (line) lines.push(line)
      return lines
    })
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const titleLines = wordWrap(title)
  for (const line of titleLines) {
    page.drawText(line, { x: margin, y, size: 24, font: boldFont, color: rgb(0, 0, 0) })
    y -= 30
  }

  y -= 40
  page.drawText(`Date: ${date}`, { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })
  y -= 20
  page.drawText('Genere par Repora', { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })
  y -= 20
  page.drawText('v1.0', { x: margin, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) })

  y -= 40
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) })

  page = pdfDoc.addPage([pageWidth, pageHeight])
  y = pageHeight - margin
  page.drawText('Table des matieres', { x: margin, y, size: 18, font: boldFont, color: rgb(0, 0, 0) })
  y -= 30

  for (const s of doc.sections) {
    page.drawText(s.title, { x: margin, y, size: 12, font, color: rgb(0, 0, 0.8) })
    y -= 20
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  for (const s of doc.sections) {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - margin

    page.drawText(s.title, { x: margin, y, size: 16, font: boldFont, color: rgb(0, 0, 0) })
    y -= 30

    const lines = wordWrap(s.content || '*(Aucun contenu)*')
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
      y -= 16
      if (y < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
    }
  }

  return pdfDoc.save()
}

async function buildDocx(doc: Awaited<ReturnType<typeof getDocument>>): Promise<Buffer> {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]

  const children: Paragraph[] = []

  children.push(
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 48 })], heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Date: ${date}`, size: 24, color: '#666666' })] }),
    new Paragraph({ children: [new TextRun({ text: 'Genere par Repora — v1.0', size: 24, color: '#666666' })] }),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
    new Paragraph({ children: [new TextRun({ text: 'Table des matieres', bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: doc.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n'), size: 24 })] }),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
  )

  for (const s of doc.sections) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: s.title, bold: true, size: 28 })], heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
      new Paragraph({ children: [new TextRun({ text: s.content || '*(Aucun contenu)*', size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),
    )
  }

  const wordDoc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Buffer.from(await Packer.toBuffer(wordDoc))
}

export async function exportDocument(documentId: string, format: 'pdf' | 'docx' | 'md'): Promise<{
  buffer: Buffer
  mimeType: string
  filename: string
}> {
  const doc = await getDocument(documentId)
  const shortId = documentId.slice(0, 8)

  switch (format) {
    case 'pdf': {
      const pdfBytes = await buildPdf(doc)
      return { buffer: Buffer.from(pdfBytes), mimeType: 'application/pdf', filename: `document-${shortId}.pdf` }
    }
    case 'docx': {
      const docxBuf = await buildDocx(doc)
      return { buffer: docxBuf, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename: `document-${shortId}.docx` }
    }
    case 'md': {
      const mdContent = buildMarkdown(doc)
      return { buffer: Buffer.from(mdContent, 'utf-8'), mimeType: 'text/markdown', filename: `document-${shortId}.md` }
    }
    default:
      throw new Error(`Format non supporte: ${format}`)
  }
}
