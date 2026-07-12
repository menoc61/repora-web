import PDFDocument from 'pdfkit'

interface FallbackDoc {
  title: string
  subtitle?: string
  description?: string
  author?: string
  monthYear: string
  sections: Array<{ title: string; content: string }>
}

export async function generatePdfFallback(doc: FallbackDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const pdf = new PDFDocument({ size: 'A4', margin: 60, info: { Title: doc.title, Creator: 'Repora' } })
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)

    // ── Cover page ──
    const COVER_BG = '#0f1b2e'
    const WHITE = '#FFFFFF'
    const BLUE_ACCENT = '#60a5fa'
    const DIM_TEXT = '#a0c4e8'
    const BLUE = '#2563EB'
    const DARK_TEXT = '#1a202c'
    const MUTED_TEXT = '#718096'
    const PAGE_WIDTH = 595.28 // A4 width in points

    // Background rectangle
    pdf.rect(0, 0, PAGE_WIDTH, 842).fill(COVER_BG)

    // Decorative line
    pdf.rect(60, 200, 200, 4).fill('#2563EB')
    pdf.rect(60, 210, 120, 2).fill('#60a5fa')

    // Title
    pdf.fontSize(42).font('Helvetica-Bold').fillColor(WHITE)
    pdf.text('CAHIER DES', 60, 240, { width: PAGE_WIDTH - 120, align: 'left' })
    pdf.text('CHARGES', 60, 290, { width: PAGE_WIDTH - 120, align: 'left' })

    // Subtitle
    if (doc.subtitle) {
      pdf.fontSize(22).font('Helvetica').fillColor(BLUE_ACCENT)
      pdf.text(doc.subtitle, 60, 360, { width: PAGE_WIDTH - 120 })
    }

    // Description
    if (doc.description) {
      pdf.fontSize(12).font('Helvetica').fillColor(DIM_TEXT)
      pdf.text(doc.description, 60, 395, { width: PAGE_WIDTH - 120 })
    }

    // Date and author
    pdf.fontSize(12).font('Helvetica').fillColor('#8898aa')
    const footerY = 580
    pdf.text(doc.monthYear, 60, footerY)
    if (doc.author) {
      pdf.text(`Pr\u00e9par\u00e9 par: ${doc.author}`, 60, footerY + 20)
    }

    // Page break
    pdf.addPage()

    // ── Table of Contents ──
    pdf.fontSize(26).font('Helvetica-Bold').fillColor(BLUE)
    pdf.text('Table des Mati\u00e8res', 60, 60, { align: 'center' })
    pdf.moveDown(2)

    for (let i = 0; i < doc.sections.length; i++) {
      const s = doc.sections[i]
      const pageNum = i + 3
      pdf.fontSize(12).font('Helvetica').fillColor(DARK_TEXT)
      pdf.text(`${i + 1}.  ${s.title}`, 60, undefined, { continued: false })
      pdf.fontSize(11).font('Helvetica-Bold').fillColor(BLUE)
      pdf.text(`  ${pageNum}`, PAGE_WIDTH - 120, pdf.y - 15, { width: 60, align: 'right' })
      pdf.moveDown(0.5)
    }

    pdf.addPage()

    // ── Sections ──
    for (let sIdx = 0; sIdx < doc.sections.length; sIdx++) {
      const s = doc.sections[sIdx]

      // Section title
      pdf.fontSize(24).font('Helvetica-Bold').fillColor(BLUE)
      pdf.text(`${sIdx + 1}. ${s.title}`, 60, 60)
      pdf.moveDown(0.5)

      // Blue underline
      pdf.rect(60, pdf.y, 100, 2).fill(BLUE)
      pdf.moveDown(1.5)

      // Section content (simple markdown-like rendering)
      pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
      const paragraphs = s.content.split(/\n\n+/)
      for (const para of paragraphs) {
        const trimmed = para.trim()
        if (!trimmed) continue

        // Detect basic formatting
        if (trimmed.startsWith('## ')) {
          pdf.fontSize(16).font('Helvetica-Bold').fillColor(BLUE)
          pdf.text(trimmed.replace(/^##+\s*/, ''), 60, undefined)
          pdf.moveDown(0.5)
          pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
          continue
        }
        if (trimmed.startsWith('### ')) {
          pdf.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
          pdf.text(trimmed.replace(/^###+\s*/, ''), 60, undefined)
          pdf.moveDown(0.3)
          pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
          continue
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const lines = trimmed.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '))
          for (const line of lines) {
            pdf.text(`  \u2022  ${line.replace(/^[-*]\s+/, '')}`, 60, undefined)
          }
          pdf.moveDown(0.3)
          continue
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split('\n').filter(l => /^\d+\.\s/.test(l))
          for (const line of lines) {
            pdf.text(`  ${line}`, 60, undefined)
          }
          pdf.moveDown(0.3)
          continue
        }

        // Regular paragraph
        pdf.text(trimmed, 60, undefined, {
          align: 'justify',
          lineGap: 2,
        })
        pdf.moveDown(0.5)

        // Page break if near end
        if (pdf.y > 720) {
          pdf.addPage()
        }
      }

      // Page break between sections (except last)
      if (sIdx < doc.sections.length - 1) {
        pdf.addPage()
      }
    }

    // ── Footer on all pages ──
    const totalPages = pdf.bufferedPageRange().count
    for (let i = 1; i <= totalPages; i++) {
      pdf.switchToPage(i - 1)
      pdf.fontSize(9).font('Helvetica').fillColor(MUTED_TEXT)
      pdf.text(`Page ${i} / ${totalPages}`, 60, 810, { align: 'center' })
    }

    pdf.end()
  })
}
