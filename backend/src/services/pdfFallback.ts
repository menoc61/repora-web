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

    let pageCounter = 0
    function footer() {
      pageCounter++
      if (pageCounter <= 1) return
      const PAGE_WIDTH = 595.28
      const mx = pdf.x
      const my = pdf.y
      pdf.fontSize(9).font('Helvetica').fillColor('#718096')
      pdf.text(`Page ${pageCounter}`, 60, 810, { align: 'center', width: PAGE_WIDTH - 120 })
      pdf.x = mx
      pdf.y = my
    }

    const COVER_BG = '#0f1b2e'
    const WHITE = '#FFFFFF'
    const BLUE_ACCENT = '#60a5fa'
    const DIM_TEXT = '#a0c4e8'
    const BLUE = '#2563EB'
    const DARK_TEXT = '#1a202c'
    const PAGE_WIDTH = 595.28

    // ── Cover page ──
    pdf.rect(0, 0, PAGE_WIDTH, 842).fill(COVER_BG)
    pdf.rect(60, 200, 200, 4).fill('#2563EB')
    pdf.rect(60, 210, 120, 2).fill('#60a5fa')

    pdf.fontSize(42).font('Helvetica-Bold').fillColor(WHITE)
    pdf.text('CAHIER DES CHARGES', 60, 240, { width: PAGE_WIDTH - 120, align: 'left' })

    if (doc.subtitle) {
      pdf.fontSize(22).font('Helvetica').fillColor(BLUE_ACCENT)
      pdf.text(doc.subtitle, 60, 360, { width: PAGE_WIDTH - 120 })
    }

    if (doc.description) {
      pdf.fontSize(12).font('Helvetica').fillColor(DIM_TEXT)
      pdf.text(doc.description, 60, 395, { width: PAGE_WIDTH - 120 })
    }

    const infoY = 580
    pdf.fontSize(12).font('Helvetica').fillColor('#8898aa')
    pdf.text(doc.monthYear, 60, infoY)
    if (doc.author) {
      pdf.text(`Pr\u00e9par\u00e9 par: ${doc.author}`, 60, infoY + 20)
    }

    // ── Table of Contents ──
    pdf.addPage()
    footer()
    pdf.fontSize(26).font('Helvetica-Bold').fillColor(BLUE)
    pdf.text('Table des Mati\u00e8res', 60, 60, { align: 'center' })
    pdf.moveDown(2)

    for (let i = 0; i < doc.sections.length; i++) {
      pdf.fontSize(12).font('Helvetica').fillColor(DARK_TEXT)
      pdf.text(`${i + 1}.  ${doc.sections[i].title}`, 60, undefined)
      pdf.moveDown(0.5)
    }

    // ── Sections ──
    for (const s of doc.sections) {
      pdf.addPage()
      footer()

      const idx = doc.sections.indexOf(s)
      pdf.fontSize(24).font('Helvetica-Bold').fillColor(BLUE)
      pdf.text(`${idx + 1}. ${s.title}`, 60, 60)
      pdf.moveDown(0.5)
      pdf.rect(60, pdf.y, 100, 2).fill(BLUE)
      pdf.moveDown(1.5)

      const paragraphs = s.content.split(/\n\n+/)
      for (const para of paragraphs) {
        const t = para.trim()
        if (!t) continue

        if (t.startsWith('## ')) {
          pdf.fontSize(16).font('Helvetica-Bold').fillColor(BLUE)
          pdf.text(t.replace(/^##+\s*/, ''), 60, undefined)
          pdf.moveDown(0.5)
          continue
        }
        if (t.startsWith('### ')) {
          pdf.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
          pdf.text(t.replace(/^###+\s*/, ''), 60, undefined)
          pdf.moveDown(0.3)
          continue
        }
        if (t.startsWith('- ') || t.startsWith('* ')) {
          const lines = t.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '))
          for (const line of lines) {
            pdf.text(`  \u2022  ${line.replace(/^[-*]\s+/, '')}`, 60, undefined)
          }
          pdf.moveDown(0.3)
          continue
        }
        if (/^\d+\.\s/.test(t)) {
          const lines = t.split('\n').filter(l => /^\d+\.\s/.test(l))
          for (const line of lines) {
            pdf.text(`  ${line}`, 60, undefined)
          }
          pdf.moveDown(0.3)
          continue
        }

        pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
        pdf.text(t, 60, undefined, { align: 'justify', lineGap: 2 })
        pdf.moveDown(0.5)

        if (pdf.y > 720) {
          pdf.addPage()
          footer()
        }
      }
    }

    pdf.end()
  })
}
