import { parseMarkdown, inlineToText, astToText, type MdNode, type InlineNode } from '../utils/markdownParser'
import { getTemplate, hexToRgb, type DocumentTemplate } from '../utils/docTemplates'

interface DocSection {
  id: string
  title: string
  content: string
  order: number
}

interface DocConfig {
  documentType?: string
  header?: { companyName?: string; tagline?: string }
  footer?: { showPageNumbers?: boolean; copyright?: string }
}

interface DocInput {
  id: string
  projectId: string
  outline: Record<string, unknown> | null
  config: DocConfig
  sections: DocSection[]
}

interface DiagramInput {
  id: string
  type: string
  sectionId: string | null
  renderedUrl: string
  pngBuffer?: Buffer
}

const CALLOUT_ICONS: Record<string, string> = {
  info: '\u2139',
  warning: '\u26A0',
  success: '\u2714',
  danger: '\u2718',
  note: '\u2666',
}

const CALLOUT_BG: Record<string, string> = {
  info: '#EBF8FF',
  warning: '#FFF9E6',
  success: '#F0FFF4',
  danger: '#FFF5F5',
  note: '#F7FAFC',
}

const CALLOUT_BORDER: Record<string, string> = {
  info: '#2563EB',
  warning: '#D69E2E',
  success: '#38A169',
  danger: '#E53E3E',
  note: '#718096',
}

export async function buildProfessionalPdf(
  doc: DocInput,
  diagrams: DiagramInput[]
): Promise<Buffer> {
  // PDFKit is CJS — dynamic import for ESM compat
  const PDFDocumentMod = (await import('pdfkit')).default
  const PDFDocumentCtor = PDFDocumentMod as any

  const title = (doc.outline?.title as string) || 'Document'
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const templateId = doc.config?.documentType || 'cahier_des_charges'
  const template = getTemplate(templateId) || getTemplate('cahier_des_charges')!
  const headerCfg = doc.config?.header || {}
  const footerCfg = doc.config?.footer || {}

  const companyName = headerCfg.companyName || 'Repora'
  const copyright = footerCfg.copyright || `\u00a9 ${new Date().getFullYear()} ${companyName}`

  const MARGIN = 72
  const PAGE_W = 612
  const PAGE_H = 792
  const CONTENT_W = PAGE_W - MARGIN * 2

  const chunks: Buffer[] = []

  const pdf = PDFDocumentCtor({
    size: 'letter',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title: title,
      Author: companyName,
      Creator: 'Repora',
      Producer: 'Repora + PDFKit',
      CreationDate: new Date(),
    },
  })

  pdf.on('data', (chunk: Buffer) => chunks.push(chunk))

  // ── State ──
  let pageNum = 0
  let isCoverPage = true
  let y = 0

  // ── Helpers ──
  function tplColor(key: keyof DocumentTemplate['colors']): string {
    return template.colors[key] || '#000000'
  }

  function rgbStr(hex: string): string {
    const c = hexToRgb(hex)
    return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`
  }

  const diagramMap = new Map<string, DiagramInput>()
  for (const d of diagrams) {
    if (d.renderedUrl) diagramMap.set(d.renderedUrl, d)
  }

  function getDiagramBuf(src: string): Buffer | null {
    return diagramMap.get(src)?.pngBuffer || null
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 20) newPage()
  }

  function newPage() {
    pdf.addPage({ size: 'letter', margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } })
    isCoverPage = false
    pageNum++
    y = PAGE_H - MARGIN
    drawHeader()
    drawFooterLine()
  }

  function drawHeader() {
    if (isCoverPage) return
    pdf.save()
    pdf.font('Helvetica-Bold').fontSize(9).fillColor('#718096')
    pdf.text(companyName, MARGIN, MARGIN - 24, { width: CONTENT_W })
    pdf.restore()
  }

  function drawFooterLine() {
    if (isCoverPage) return
    pdf.save()
    pdf.strokeColor('#E2E8F0').lineWidth(0.5)
    pdf.moveTo(MARGIN, PAGE_H - MARGIN + 10)
    pdf.lineTo(PAGE_W - MARGIN, PAGE_H - MARGIN + 10)
    pdf.stroke()
    pdf.restore()
  }

  function wrapText(text: string, fontName: string, size: number, maxW: number): string[] {
    const words = text.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let cur = ''
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word
      const w = pdf.font(fontName).fontSize(size).widthOfString(test)
      if (w > maxW && cur) {
        lines.push(cur)
        cur = word
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines.length ? lines : ['']
  }

  // ── Render inline nodes ──
  function renderInline(nodes: InlineNode[], startX: number, startY: number, fontBase: string, size: number, color: string): number {
    let x = startX
    let cy = startY

    for (const node of nodes) {
      switch (node.type) {
        case 'text': {
          const f = fontBase === 'Courier' ? 'Courier' : 'Helvetica'
          pdf.save().font(f).fontSize(size).fillColor(color)
          const lines = wrapText(node.text, f, size, CONTENT_W - (x - MARGIN))
          for (let i = 0; i < lines.length; i++) {
            if (i > 0) { cy += size * 1.5; x = MARGIN; ensureSpace(size * 1.5) }
            pdf.text(lines[i], x, cy, { width: CONTENT_W - (x - MARGIN), lineBreak: false })
            x += pdf.font(f).fontSize(size).widthOfString(lines[i])
          }
          pdf.restore()
          break
        }
        case 'bold': {
          const f = fontBase === 'Courier' ? 'Courier-Bold' : 'Helvetica-Bold'
          pdf.save().font(f).fontSize(size).fillColor(color)
          const inner = inlineToText(node.children)
          const lines = wrapText(inner, f, size, CONTENT_W - (x - MARGIN))
          for (let i = 0; i < lines.length; i++) {
            if (i > 0) { cy += size * 1.5; x = MARGIN; ensureSpace(size * 1.5) }
            pdf.text(lines[i], x, cy, { width: CONTENT_W - (x - MARGIN), lineBreak: false })
            x += pdf.font(f).fontSize(size).widthOfString(lines[i])
          }
          pdf.restore()
          break
        }
        case 'italic': {
          const f = fontBase === 'Courier' ? 'Courier-Oblique' : 'Helvetica-Oblique'
          pdf.save().font(f).fontSize(size).fillColor(color)
          const inner = inlineToText(node.children)
          const lines = wrapText(inner, f, size, CONTENT_W - (x - MARGIN))
          for (let i = 0; i < lines.length; i++) {
            if (i > 0) { cy += size * 1.5; x = MARGIN; ensureSpace(size * 1.5) }
            pdf.text(lines[i], x, cy, { width: CONTENT_W - (x - MARGIN), lineBreak: false })
            x += pdf.font(f).fontSize(size).widthOfString(lines[i])
          }
          pdf.restore()
          break
        }
        case 'code': {
          const tw = pdf.font('Courier').fontSize(size).widthOfString(node.text) + 8
          pdf.save()
          pdf.roundedRect(x, cy - 2, Math.max(tw, 30), size + 4, 2).fill('#F1F5F9')
          pdf.font('Courier').fontSize(size).fillColor('#E53E3E')
          pdf.text(node.text, x + 4, cy, { lineBreak: false })
          x += tw + 8
          pdf.restore()
          break
        }
        case 'link': {
          pdf.save().font('Helvetica').fontSize(size).fillColor('#2563EB')
          const inner = inlineToText(node.children)
          const lines = wrapText(inner, 'Helvetica', size, CONTENT_W - (x - MARGIN))
          for (let i = 0; i < lines.length; i++) {
            if (i > 0) { cy += size * 1.5; x = MARGIN; ensureSpace(size * 1.5) }
            pdf.text(lines[i], x, cy, { link: node.href, width: CONTENT_W - (x - MARGIN), lineBreak: false })
            x += pdf.font('Helvetica').fontSize(size).widthOfString(lines[i])
          }
          pdf.restore()
          break
        }
        case 'image': {
          const buf = getDiagramBuf(node.src)
          if (buf) {
            ensureSpace(100)
            try {
              pdf.save()
              pdf.image(buf, MARGIN, cy, { fit: [CONTENT_W, 300] })
              pdf.restore()
              cy += 4
              pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
              pdf.text(node.alt, MARGIN, cy, { width: CONTENT_W })
              cy += 16
              pdf.restore()
            } catch {
              pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
              pdf.text(`[${node.alt}]`, MARGIN, cy, { width: CONTENT_W })
              cy += 16
              pdf.restore()
            }
          } else {
            pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
            pdf.text(`[${node.alt}]`, MARGIN, cy, { width: CONTENT_W })
            cy += 16
            pdf.restore()
          }
          break
        }
      }
    }
    return cy
  }

  // ── Render AST node ──
  function renderNode(node: MdNode) {
    switch (node.type) {
      case 'heading': {
        const sizes: Record<number, number> = { 1: 24, 2: 18, 3: 15, 4: 13, 5: 11, 6: 10 }
        const size = sizes[node.level] || 12
        const text = inlineToText(node.children)
        ensureSpace(size + 20)

        if (node.level <= 2) {
          const bgH = size + 12
          const barW = 4
          pdf.save()
          pdf.rect(MARGIN - 4, y - 4, CONTENT_W + 8, bgH).fill(rgbStr(tplColor('primary')))
          pdf.rect(MARGIN - 4, y - 4, barW, bgH).fill(rgbStr(tplColor('secondary')))
          pdf.restore()
          pdf.save()
          pdf.font('Helvetica-Bold').fontSize(size).fillColor('#FFFFFF')
          pdf.text(text, MARGIN + 8, y, { width: CONTENT_W - 12, lineBreak: false })
          pdf.restore()
          y += bgH + 8
        } else {
          const barH = size + 4
          pdf.save()
          pdf.rect(MARGIN - 4, y, 3, barH).fill(rgbStr(tplColor('secondary')))
          pdf.restore()
          pdf.save()
          pdf.font('Helvetica-Bold').fontSize(size).fillColor(tplColor('heading'))
          pdf.text(text, MARGIN + 4, y, { width: CONTENT_W - 4, lineBreak: false })
          pdf.restore()
          y += barH + 8
        }
        break
      }

      case 'paragraph': {
        const plain = inlineToText(node.children)
        const lines = wrapText(plain, 'Helvetica', 11, CONTENT_W)
        ensureSpace(lines.length * 16 + 8)
        pdf.save().font('Helvetica').fontSize(11).fillColor(tplColor('text'))
        for (const line of lines) {
          pdf.text(line, MARGIN, y, { width: CONTENT_W, lineBreak: false })
          y += 16
        }
        pdf.restore()
        y += 4
        break
      }

      case 'list': {
        for (let idx = 0; idx < node.items.length; idx++) {
          const itemText = astToText(node.items[idx])
          const bullet = node.ordered ? `${idx + 1}.` : '\u2022'
          const indent = MARGIN + 16
          const textLines = wrapText(itemText, 'Helvetica', 11, CONTENT_W - 16)
          ensureSpace(textLines.length * 16 + 4)
          pdf.save().font('Helvetica').fontSize(11).fillColor(tplColor('text'))
          pdf.text(bullet, MARGIN + 4, y, { width: 12, lineBreak: false })
          for (const line of textLines) {
            pdf.text(line, indent, y, { width: CONTENT_W - 16, lineBreak: false })
            y += 16
          }
          pdf.restore()
          y += 2
        }
        y += 4
        break
      }

      case 'blockquote': {
        const text = astToText(node.children)
        const lines = wrapText(text, 'Helvetica-Oblique', 11, CONTENT_W - 20)
        ensureSpace(lines.length * 16 + 16)
        pdf.save()
        pdf.rect(MARGIN, y - 2, 3, lines.length * 16 + 8).fill(rgbStr(tplColor('secondary')))
        pdf.rect(MARGIN + 4, y - 2, CONTENT_W - 4, lines.length * 16 + 8).fill('#F7FAFC')
        pdf.restore()
        pdf.save().font('Helvetica-Oblique').fontSize(11).fillColor('#4A5568')
        for (const line of lines) {
          pdf.text(line, MARGIN + 14, y, { width: CONTENT_W - 20, lineBreak: false })
          y += 16
        }
        pdf.restore()
        y += 8
        break
      }

      case 'code': {
        const codeLines = node.text.split('\n')
        const lineH = 13
        const codeH = codeLines.length * lineH + 16
        ensureSpace(codeH)
        pdf.save()
        pdf.roundedRect(MARGIN, y - 4, CONTENT_W, codeH, 4).fill('#F1F5F9')
        pdf.restore()
        if (node.lang) {
          pdf.save().font('Helvetica-Bold').fontSize(8).fillColor('#718096')
          pdf.text(node.lang.toUpperCase(), MARGIN + 8, y, { width: CONTENT_W - 16 })
          pdf.restore()
          y += 12
        }
        pdf.save().font('Courier').fontSize(9).fillColor('#2D3748')
        for (const line of codeLines) {
          pdf.text(line, MARGIN + 12, y, { width: CONTENT_W - 24, lineBreak: false })
          y += lineH
        }
        pdf.restore()
        y += 8
        break
      }

      case 'styled_table':
      case 'table': {
        const headers = node.headers
        const rows = node.rows
        const colCount = headers.length
        const colW = CONTENT_W / colCount
        const rowH = 20
        ensureSpace((rows.length + 1) * rowH + 12)

        const hdrBg = node.type === 'styled_table' && (node as any).headerColor
          ? (node as any).headerColor
          : tplColor('tableHeader')
        pdf.save()
        pdf.rect(MARGIN, y, CONTENT_W, rowH).fill(rgbStr(hdrBg))
        pdf.font('Helvetica-Bold').fontSize(9).fillColor(tplColor('tableHeaderText'))
        for (let c = 0; c < colCount; c++) {
          const cellText = (headers[c] || '').slice(0, 30)
          pdf.text(cellText, MARGIN + c * colW + 4, y + 6, { width: colW - 8, lineBreak: false })
        }
        pdf.restore()
        y += rowH

        for (let r = 0; r < rows.length; r++) {
          if (y + rowH > PAGE_H - MARGIN) newPage()
          if (r % 2 === 0) {
            pdf.save()
            pdf.rect(MARGIN, y, CONTENT_W, rowH).fill(rgbStr(tplColor('tableAltRow')))
            pdf.restore()
          }
          pdf.save().font('Helvetica').fontSize(9).fillColor(tplColor('text'))
          for (let c = 0; c < colCount; c++) {
            const cellText = (rows[r][c] || '').slice(0, 30)
            pdf.text(cellText, MARGIN + c * colW + 4, y + 6, { width: colW - 8, lineBreak: false })
          }
          pdf.restore()
          y += rowH
        }

        pdf.save()
        pdf.rect(MARGIN, y, CONTENT_W, 1).fill(rgbStr(tplColor('border')))
        pdf.restore()
        y += 12
        break
      }

      case 'callout': {
        const variant = node.variant || 'info'
        const bgColor = CALLOUT_BG[variant] || '#F7FAFC'
        const borderColor = CALLOUT_BORDER[variant] || '#718096'
        const icon = CALLOUT_ICONS[variant] || '\u2666'
        const calloutTitle = node.title || variant.charAt(0).toUpperCase() + variant.slice(1)
        const bodyText = astToText(node.children)
        const bodyLines = wrapText(bodyText, 'Helvetica', 10, CONTENT_W - 36)
        const calloutH = bodyLines.length * 14 + 36
        ensureSpace(calloutH)

        pdf.save()
        pdf.roundedRect(MARGIN, y, CONTENT_W, calloutH, 4).fill(bgColor)
        pdf.rect(MARGIN, y, 4, calloutH).fill(borderColor)
        pdf.restore()

        pdf.save().font('Helvetica-Bold').fontSize(10).fillColor(borderColor)
        pdf.text(`${icon}  ${calloutTitle}`, MARGIN + 14, y + 8, { width: CONTENT_W - 20, lineBreak: false })
        pdf.restore()

        pdf.save().font('Helvetica').fontSize(10).fillColor('#4A5568')
        let calloutY = y + 24
        for (const line of bodyLines) {
          pdf.text(line, MARGIN + 14, calloutY, { width: CONTENT_W - 28, lineBreak: false })
          calloutY += 14
        }
        pdf.restore()
        y += calloutH + 8
        break
      }

      case 'hr': {
        ensureSpace(12)
        pdf.save()
        pdf.rect(MARGIN, y, CONTENT_W, 1).fill(rgbStr(tplColor('border')))
        pdf.restore()
        y += 12
        break
      }

      case 'image': {
        const buf = getDiagramBuf(node.src)
        ensureSpace(120)
        if (buf) {
          try {
            pdf.save()
            pdf.image(buf, MARGIN, y, { fit: [CONTENT_W, 300] })
            pdf.restore()
            y += 4
            pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
            pdf.text(node.alt, MARGIN, y, { width: CONTENT_W })
            pdf.restore()
            y += 16
          } catch {
            pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
            pdf.text(`[Image: ${node.alt}]`, MARGIN, y, { width: CONTENT_W })
            pdf.restore()
            y += 16
          }
        } else {
          pdf.save().font('Helvetica-Oblique').fontSize(8).fillColor('#718096')
          pdf.text(`[${node.alt}]`, MARGIN, y, { width: CONTENT_W })
          pdf.restore()
          y += 16
        }
        break
      }

      case 'pagebreak': {
        newPage()
        break
      }
    }
  }

  // ══════════════════════════════════════════════════
  //  COVER PAGE
  // ══════════════════════════════════════════════════
  const coverBg = hexToRgb(tplColor('coverBg'))
  const secRgb = hexToRgb(tplColor('secondary'))

  // Top colored bar
  pdf.save()
  pdf.rect(0, 0, PAGE_W, 180).fill(rgbStr(tplColor('coverBg')))
  pdf.restore()

  // Accent stripe
  pdf.save()
  pdf.rect(0, 178, PAGE_W, 4).fill(rgbStr(tplColor('secondary')))
  pdf.restore()

  // Company name
  pdf.save()
  pdf.font('Helvetica-Bold').fontSize(14).fillColor(tplColor('coverText'))
  pdf.text(companyName, MARGIN, 60, { width: CONTENT_W, align: 'center' })
  pdf.restore()

  // Title
  y = 280
  const titleLines = wrapText(title, 'Helvetica-Bold', 32, CONTENT_W)
  pdf.save().font('Helvetica-Bold').fontSize(32).fillColor(tplColor('heading'))
  for (const line of titleLines) {
    pdf.text(line, MARGIN, y, { width: CONTENT_W, align: 'center' })
    y += 40
  }
  pdf.restore()

  // Date
  y += 20
  pdf.save().font('Helvetica').fontSize(13).fillColor(tplColor('muted'))
  pdf.text(date, MARGIN, y, { width: CONTENT_W, align: 'center' })
  pdf.restore()

  // "Généré par Repora"
  y += 28
  pdf.save().font('Helvetica-Oblique').fontSize(11).fillColor(tplColor('muted'))
  pdf.text('G\u00e9n\u00e9r\u00e9 par Repora', MARGIN, y, { width: CONTENT_W, align: 'center' })
  pdf.restore()

  // Template badge
  y = PAGE_H - MARGIN - 40
  pdf.save().font('Helvetica').fontSize(9).fillColor(tplColor('muted'))
  pdf.text(`${template.name} \u2014 ${template.description}`, MARGIN, y, { width: CONTENT_W, align: 'center' })
  pdf.restore()

  // ══════════════════════════════════════════════════
  //  TABLE OF CONTENTS
  // ══════════════════════════════════════════════════
  newPage()

  // TOC title bar
  pdf.save()
  pdf.rect(MARGIN - 4, y - 4, CONTENT_W + 8, 30).fill(rgbStr(tplColor('primary')))
  pdf.restore()
  pdf.save()
  pdf.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF')
  pdf.text('Table des mati\u00e8res', MARGIN + 4, y, { width: CONTENT_W - 8 })
  pdf.restore()
  y += 40

  for (let i = 0; i < doc.sections.length; i++) {
    const section = doc.sections[i]
    ensureSpace(20)

    const num = `${i + 1}.`
    pdf.save().font('Helvetica-Bold').fontSize(11).fillColor(tplColor('secondary'))
    pdf.text(num, MARGIN, y, { width: 24, lineBreak: false })
    pdf.restore()

    pdf.save().font('Helvetica').fontSize(11).fillColor(tplColor('heading'))
    pdf.text(section.title, MARGIN + 24, y, { width: CONTENT_W - 24, lineBreak: false })
    pdf.restore()

    // Dotted leader
    const titleW = pdf.font('Helvetica').fontSize(11).widthOfString(section.title)
    const dotsStart = MARGIN + 24 + titleW + 4
    const dotsEnd = PAGE_W - MARGIN - 20
    if (dotsEnd > dotsStart) {
      const dotSpacing = pdf.font('Helvetica').fontSize(11).widthOfString('.') + 2
      pdf.save().font('Helvetica').fontSize(11).fillColor('#CBD5E0')
      let dx = dotsStart
      while (dx < dotsEnd) {
        pdf.text('.', dx, y, { width: dotSpacing, lineBreak: false })
        dx += dotSpacing
      }
      pdf.restore()
    }
    y += 22
  }

  y += 12

  // ══════════════════════════════════════════════════
  //  CONTENT SECTIONS
  // ══════════════════════════════════════════════════
  for (let sIdx = 0; sIdx < doc.sections.length; sIdx++) {
    const section = doc.sections[sIdx]
    newPage()

    // Section title bar
    const badgeW = 32
    const titleBarH = 36
    pdf.save()
    pdf.rect(MARGIN - 4, y - 4, CONTENT_W + 8, titleBarH).fill(rgbStr(tplColor('primary')))
    pdf.rect(MARGIN - 4, y - 4, badgeW, titleBarH).fill(rgbStr(tplColor('secondary')))
    pdf.restore()

    pdf.save().font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF')
    pdf.text(`${sIdx + 1}`, MARGIN, y + 6, { width: badgeW, align: 'center' })
    pdf.restore()

    pdf.save().font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF')
    pdf.text(section.title, MARGIN + badgeW + 8, y + 8, { width: CONTENT_W - badgeW - 12, lineBreak: false })
    pdf.restore()
    y += titleBarH + 12

    const ast = parseMarkdown(section.content || '')
    for (const node of ast) {
      renderNode(node)
    }
    y += 8
  }

  // ══════════════════════════════════════════════════
  //  PAGE NUMBERS — stamp via bufferedPageRange before end()
  // ══════════════════════════════════════════════════
  const range = pdf.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    if (i === 0) continue // cover page: no footer

    pdf.switchToPage(i)

    pdf.save().font('Helvetica').fontSize(9).fillColor('#718096')
    pdf.text(`${i}`, 0, PAGE_H - MARGIN + 16, { width: PAGE_W, align: 'center' })
    pdf.restore()

    pdf.save().font('Helvetica').fontSize(7).fillColor('#A0AEC0')
    pdf.text(copyright, 0, PAGE_H - MARGIN + 28, { width: PAGE_W, align: 'center' })
    pdf.restore()
  }

  // ══════════════════════════════════════════════════
  //  FINALIZE — collect buffer
  // ══════════════════════════════════════════════════
  return new Promise<Buffer>((resolve, reject) => {
    pdf.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    pdf.on('error', (err: Error) => reject(err))
    pdf.end()
  })
}
