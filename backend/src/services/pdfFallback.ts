import PDFDocument from 'pdfkit'
import { parseMarkdown, inlineToText, astToText, type MdNode } from '../utils/markdownParser'

interface DiagramInfo {
  id: string
  type: string
  renderedUrl?: string | null
  sectionId?: string | null
}

interface FallbackDoc {
  title: string
  subtitle?: string
  description?: string
  author?: string
  monthYear: string
  sections: Array<{ id?: string; title: string; content: string }>
  diagrams?: DiagramInfo[]
}

function renderPdfAst(pdf: PDFKit.PDFDocument, ast: MdNode[], diagrams: DiagramInfo[], PAGE_WIDTH: number): void {
  const BLUE = '#2563EB'
  const DARK_TEXT = '#1a202c'
  const MUTED_TEXT = '#718096'
  const TABLE_BORDER = '#e2e8f0'
  const TABLE_ALT_ROW = '#f8fafc'

  for (const node of ast) {
    switch (node.type) {
      case 'heading': {
        const size = node.level === 1 ? 24 : node.level === 2 ? 18 : 14
        pdf.fontSize(size).font('Helvetica-Bold').fillColor(BLUE)
        pdf.text(inlineToText(node.children), 60, undefined)
        pdf.moveDown(0.5)
        break
      }
      case 'paragraph':
        pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
        pdf.text(inlineToText(node.children), 60, undefined, { align: 'justify', lineGap: 2 })
        pdf.moveDown(0.5)
        break
      case 'list':
        for (let idx = 0; idx < node.items.length; idx++) {
          const bullet = node.ordered ? `${idx + 1}.` : '\u2022'
          const text = astToText(node.items[idx])
          pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
          pdf.text(`  ${bullet}  ${text}`, 60, undefined)
        }
        pdf.moveDown(0.3)
        break
      case 'blockquote':
        pdf.fontSize(11).font('Helvetica-Oblique').fillColor(MUTED_TEXT)
        pdf.text(astToText(node.children), 80, undefined, { width: PAGE_WIDTH - 160 })
        pdf.moveDown(0.5)
        break
      case 'code':
        pdf.fontSize(9).font('Courier').fillColor(DARK_TEXT)
        pdf.text(node.text, 70, undefined, { width: PAGE_WIDTH - 140 })
        pdf.moveDown(0.5)
        break
      case 'styled_table':
      case 'table':
        // Simple table rendering
        pdf.fontSize(10).font('Helvetica-Bold').fillColor(DARK_TEXT)
        const colWidth = (PAGE_WIDTH - 120) / node.headers.length
        let y = pdf.y
        for (let c = 0; c < node.headers.length; c++) {
          pdf.text(node.headers[c], 60 + c * colWidth, y, { width: colWidth, align: 'center' })
        }
        y += 20
        for (let r = 0; r < node.rows.length; r++) {
          pdf.fontSize(10).font('Helvetica').fillColor(DARK_TEXT)
          for (let c = 0; c < node.rows[r].length; c++) {
            pdf.text(node.rows[r][c], 60 + c * colWidth, y, { width: colWidth, align: 'center' })
          }
          y += 20
          if (y > 720) {
            pdf.addPage()
            y = 60
          }
        }
        pdf.moveDown(0.5)
        break
      case 'callout':
        pdf.fontSize(11).font('Helvetica-Bold').fillColor(BLUE)
        pdf.text(`${node.title || node.variant.toUpperCase()}:`, 70, undefined)
        pdf.fontSize(11).font('Helvetica').fillColor(DARK_TEXT)
        pdf.text(astToText(node.children), 70, undefined, { width: PAGE_WIDTH - 140 })
        pdf.moveDown(0.5)
        break
      case 'hr':
        pdf.moveTo(60, pdf.y).lineTo(PAGE_WIDTH - 60, pdf.y).strokeColor(TABLE_BORDER).lineWidth(1).stroke()
        pdf.moveDown(0.5)
        break
      case 'image':
        // Placeholder for diagram
        pdf.fontSize(10).font('Helvetica-Oblique').fillColor(MUTED_TEXT)
        pdf.text(`[Diagramme: ${node.alt}]`, 60, undefined, { align: 'center' })
        pdf.moveDown(0.5)
        break
      case 'pagebreak':
        pdf.addPage()
        break
    }
    if (pdf.y > 720) {
      pdf.addPage()
    }
  }
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

      // Parse and render markdown AST
      const ast = parseMarkdown(s.content || '')
      renderPdfAst(pdf, ast, doc.diagrams || [], PAGE_WIDTH)

      // Append diagrams for this section
      const sectionDiagrams = (doc.diagrams || []).filter(d => d.sectionId === s.id)
      for (const d of sectionDiagrams) {
        pdf.fontSize(10).font('Helvetica-Oblique').fillColor('#718096')
        pdf.text(`[Diagramme ${d.type}]`, 60, undefined, { align: 'center' })
        pdf.moveDown(0.5)
      }

      if (pdf.y > 720) {
        pdf.addPage()
        footer()
      }
    }

    // ── Orphan diagrams ──
    const orphanDiagrams = (doc.diagrams || []).filter(d => !d.sectionId)
    if (orphanDiagrams.length > 0) {
      pdf.addPage()
      footer()
      pdf.fontSize(24).font('Helvetica-Bold').fillColor(BLUE)
      pdf.text('Diagrammes', 60, 60)
      pdf.moveDown(0.5)
      pdf.rect(60, pdf.y, 100, 2).fill(BLUE)
      pdf.moveDown(1.5)
      for (const d of orphanDiagrams) {
        pdf.fontSize(10).font('Helvetica-Oblique').fillColor('#718096')
        pdf.text(`[Diagramme ${d.type}]`, 60, undefined, { align: 'center' })
        pdf.moveDown(0.5)
      }
    }

    pdf.end()
  })
}
