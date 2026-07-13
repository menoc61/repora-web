import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  ImageRun, Header, Footer, PageNumber, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableLayoutType, VerticalAlign,
  PageBreak, TabStopType, TabStopPosition,
  convertInchesToTwip, HeightRule,
} from 'docx'
import { parseMarkdown, inlineToText, astToText, type MdNode, type InlineNode } from '../utils/markdownParser'
import { getTemplate, type DocumentTemplate } from '../utils/docTemplates'
import * as fs from 'fs'
import * as path from 'path'

function resolveAsset(name: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'assets', name),
    path.join(process.cwd(), '..', 'public', 'assets', name),
    path.join(__dirname, '..', '..', 'public', 'assets', name),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

interface DocSection {
  id: string
  title: string
  content: string
  order: number
}

interface DocConfig {
  documentType?: string
  pageCount?: string
  diagramTypes?: string[]
  header?: { companyName?: string; tagline?: string }
  footer?: { showPageNumbers?: boolean; copyright?: string }
  author?: string
  authorTitle?: string
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

const COLORS = {
  blue: '1a6faa',
  blueHeader: '2563EB',
  blueAccent: '60a5fa',
  darkText: '1a202c',
  mutedText: '718096',
  white: 'FFFFFF',
  tableAltRow: 'f8fafc',
  tableBorder: 'e2e8f0',
  codeBg: 'F5F5F5',
  coverTextDim: 'a0c4e8',
  coverAuthor: 'c0d8ef',
  coverAuthorDim: 'a0b8d0',
  coverCopyright: '8898aa',
  bgInfo: 'ebf8ff',
  bgWarning: 'fff9e6',
  bgSuccess: 'f0fff4',
  bgDanger: 'fff5f5',
  bgNote: 'f7fafc',
  borderInfo: '2563eb',
  borderWarning: 'd69e2e',
  borderSuccess: '38a169',
  borderDanger: 'e53e3e',
  borderNote: '718096',
  quoteBorder: '60a5fa',
}

const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  use_case: 'Diagramme de cas d\'utilisation',
  sequence: 'Diagramme de sequence',
  activity: 'Diagramme d\'activite',
  class: 'Diagramme de classes',
  deployment: 'Diagramme de deploiement',
}

function inlineRuns(nodes: InlineNode[]): TextRun[] {
  return nodes.map(n => {
    switch (n.type) {
      case 'text':
        return new TextRun({ text: n.text, size: 22, font: 'Calibri', color: COLORS.darkText })
      case 'bold':
        return new TextRun({ text: inlineToText(n.children), bold: true, size: 22, font: 'Calibri', color: COLORS.darkText })
      case 'italic':
        return new TextRun({ text: inlineToText(n.children), italics: true, size: 22, font: 'Calibri', color: COLORS.darkText })
      case 'code':
        return new TextRun({ text: n.text, font: 'Courier New', size: 20, color: COLORS.blueHeader })
      case 'link':
        return new TextRun({ text: inlineToText(n.children), size: 22, color: COLORS.blueHeader, underline: {} })
      case 'image':
        return new TextRun({ text: `[${n.alt}]`, size: 20, color: COLORS.mutedText, italics: true })
      default:
        return new TextRun({ text: '', size: 22 })
    }
  })
}

function tableDocx(headers: string[], rows: string[][]): Table {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: COLORS.blueHeader },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: h, bold: true, size: 20, font: 'Calibri', color: COLORS.white })],
    })],
  }))

  const dataRows = rows.map((row, rowIdx) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: rowIdx % 2 === 1 ? { type: ShadingType.SOLID, color: COLORS.tableAltRow } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: cell || '', size: 20, font: 'Calibri', color: COLORS.darkText })],
      })],
    })),
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
    layout: TableLayoutType.FIXED,
  })
}

function calloutDocx(variant: string, title: string | undefined, children: MdNode[]): Paragraph[] {
  const bgMap: Record<string, string> = {
    info: COLORS.bgInfo, warning: COLORS.bgWarning,
    success: COLORS.bgSuccess, danger: COLORS.bgDanger, note: COLORS.bgNote,
  }
  const borderMap: Record<string, string> = {
    info: COLORS.borderInfo, warning: COLORS.borderWarning,
    success: COLORS.borderSuccess, danger: COLORS.borderDanger, note: COLORS.borderNote,
  }
  const bg = bgMap[variant] || bgMap.info
  const border = borderMap[variant] || borderMap.info
  const text = astToText(children)
  const label = title || variant.toUpperCase()

  return [
    new Paragraph({ spacing: { before: 120 }, children: [] }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.2) },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: border } },
      shading: { type: ShadingType.SOLID, color: bg },
      children: [
        new TextRun({ text: label + '\n', bold: true, size: 20, font: 'Calibri', color: border }),
        new TextRun({ text, size: 20, font: 'Calibri', color: COLORS.darkText }),
      ],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ]
}

function renderAst(ast: MdNode[], sectionDiagrams: DiagramInput[], diagramBuffers: Map<string, Buffer>): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = []

  for (const node of ast) {
    switch (node.type) {
      case 'heading': {
        const size = node.level === 1 ? 32 : node.level === 2 ? 28 : 24
        out.push(new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: inlineToText(node.children), bold: true, size, font: 'Calibri', color: COLORS.blue })],
        }))
        break
      }
      case 'paragraph':
        out.push(new Paragraph({
          spacing: { after: 120 },
          children: inlineRuns(node.children),
        }))
        break
      case 'list':
        for (let idx = 0; idx < node.items.length; idx++) {
          const bullet = node.ordered ? `${idx + 1}.` : '\u2022'
          const text = astToText(node.items[idx])
          out.push(new Paragraph({
            indent: { left: convertInchesToTwip(node.ordered ? 0.3 : 0.2), hanging: convertInchesToTwip(0.2) },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${bullet}  `, bold: true, size: 22, font: 'Calibri', color: COLORS.blueHeader }),
              new TextRun({ text, size: 22, font: 'Calibri', color: COLORS.darkText }),
            ],
          }))
        }
        break
      case 'blockquote': {
        const text = astToText(node.children)
        out.push(new Paragraph({
          indent: { left: convertInchesToTwip(0.4) },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.quoteBorder } },
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text, italics: true, size: 22, font: 'Calibri', color: COLORS.mutedText })],
        }))
        break
      }
      case 'code':
        for (const line of node.text.split('\n')) {
          out.push(new Paragraph({
            indent: { left: convertInchesToTwip(0.2) },
            shading: { type: ShadingType.SOLID, color: COLORS.codeBg },
            spacing: { after: 20 },
            children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: COLORS.darkText })],
          }))
        }
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
        break
      case 'styled_table':
      case 'table':
        out.push(tableDocx(node.headers, node.rows))
        out.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
        break
      case 'callout':
        out.push(...calloutDocx(node.variant, node.title, node.children))
        break
      case 'image':
        insertDiagramImage(out, node.src, node.alt, sectionDiagrams, diagramBuffers)
        break
      case 'hr':
        out.push(new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder } },
          spacing: { before: 200, after: 200 }, children: [],
        }))
        break
      case 'pagebreak':
        out.push(new Paragraph({ children: [new PageBreak()] }))
        break
    }
  }

  return out
}

function insertDiagramImage(
  out: (Paragraph | Table)[],
  src: string, alt: string,
  sectionDiagrams: DiagramInput[],
  diagramBuffers: Map<string, Buffer>
) {
  const entry = sectionDiagrams.find(d => d.renderedUrl === src)
  if (entry) {
    const buf = diagramBuffers.get(entry.id)
    if (buf) {
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60 },
        children: [new ImageRun({ data: buf, transformation: { width: 480, height: 280 }, type: 'png' })],
      }))
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: alt, italics: true, size: 18, font: 'Calibri', color: COLORS.mutedText })],
      }))
      return
    }
  }
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: `[${alt}]`, italics: true, size: 20, color: COLORS.mutedText })],
  }))
}

function loadImageBuf(filePath: string): Buffer | null {
  try {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath)
  } catch {}
  return null
}

function diagramImageParagraph(d: DiagramInput, buf: Buffer, label: string): (Paragraph | Table)[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [new ImageRun({ data: buf, transformation: { width: 480, height: 280 }, type: 'png' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: label, italics: true, size: 18, font: 'Calibri', color: COLORS.mutedText })],
    }),
  ]
}

export async function buildProfessionalDocx(doc: DocInput, diagrams: DiagramInput[]): Promise<Buffer> {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const subtitle = (doc.outline as { subtitle?: string } | null)?.subtitle || ''
  const description = (doc.outline as { description?: string } | null)?.description || ''
  const monthYear = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
  const template = getTemplate(doc.config.documentType || 'cahier_des_charges') || getTemplate('cahier_des_charges')!
  const headerCfg = doc.config.header || {}
  const footerCfg = doc.config.footer || {}
  const companyName = headerCfg.companyName || 'Repora'
  const authorName = doc.config.author || headerCfg.companyName || ''
  const authorTitle = doc.config.authorTitle || ''
  const copyright = footerCfg.copyright || `\u00a9 ${new Date().getFullYear()} ${companyName} \u2014 Tous droits r\u00e9serv\u00e9s`
  const headerText = `${template.name} \u2014 ${title}`

  const diagramBuffers = new Map<string, Buffer>()
  for (const d of diagrams) {
    let buf: Buffer | null = null
    if (d.pngBuffer) {
      buf = d.pngBuffer
    } else if (d.renderedUrl?.startsWith('/uploads/')) {
      buf = loadImageBuf(path.join(process.cwd(), d.renderedUrl))
    }
    if (buf) diagramBuffers.set(d.id, buf)
  }

  const diagramsBySection = new Map<string, DiagramInput[]>()
  const orphanDiagrams: DiagramInput[] = []
  for (const d of diagrams) {
    if (d.sectionId) {
      const arr = diagramsBySection.get(d.sectionId) || []
      arr.push(d)
      diagramsBySection.set(d.sectionId, arr)
    } else {
      orphanDiagrams.push(d)
    }
  }

  const pageMargins = {
    top: convertInchesToTwip(1),
    bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1.2),
    right: convertInchesToTwip(1.2),
  }

  const hfHeader = new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder } },
        spacing: { after: 200 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [new TextRun({ text: headerText, size: 18, font: 'Calibri', color: COLORS.mutedText })],
      }),
    ],
  })

  const hfFooter = new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.tableBorder } },
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({ text: 'Page ', size: 18, font: 'Calibri', color: COLORS.mutedText }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: COLORS.blue }),
          new TextRun({ text: ' / ', size: 18, font: 'Calibri', color: COLORS.mutedText }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Calibri', color: COLORS.mutedText }),
        ],
      }),
    ],
  })

  const children: (Paragraph | Table)[] = []

  // ── COVER PAGE (full-page background via table cell) ──
  const coverBg = loadImageBuf(resolveAsset('cover_bg.png') ?? '')
  const coverCells: (Paragraph | Table)[] = []

  // Background image as top banner (if available)
  if (coverBg) {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 0 },
      children: [new ImageRun({ data: coverBg, transformation: { width: 500, height: 200 }, type: 'png' })],
    }))
  }

  // Push title text below image, still on same page inside the table cell
  coverCells.push(new Paragraph({ spacing: { before: 600 }, children: [] }))
  const coverTitle = template.name.toUpperCase()
  const coverTitleLines = coverTitle.length <= 16
    ? [coverTitle]
    : (() => { const i = coverTitle.lastIndexOf(' '); return i === -1 ? [coverTitle] : [coverTitle.slice(0, i), coverTitle.slice(i + 1)] })()
  coverTitleLines.forEach((line, i) => {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: i < coverTitleLines.length - 1 ? 60 : 100 },
      children: [new TextRun({ text: line, bold: true, size: 56, font: 'Calibri', color: COLORS.white })],
    }))
  })
  if (subtitle) {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: subtitle, size: 28, font: 'Calibri', color: COLORS.blueAccent })],
    }))
  }
  if (description) {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: description, size: 22, font: 'Calibri', color: COLORS.coverTextDim })],
    }))
  }
  coverCells.push(new Paragraph({ spacing: { before: 800 }, children: [] }))
  if (authorName) {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: `Pr\u00e9par\u00e9 par: ${authorName}`, size: 22, font: 'Calibri', color: COLORS.coverAuthor })],
    }))
  }
  if (authorTitle) {
    coverCells.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: authorTitle, size: 20, font: 'Calibri', color: COLORS.coverAuthorDim })],
    }))
  }
  coverCells.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: monthYear, size: 20, font: 'Calibri', color: COLORS.coverAuthorDim })],
  }))

  // Wrap in a full-page table with dark background
  const coverBgColor = '0f1b2e'
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      height: { value: 680, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: coverBgColor },
        verticalAlign: VerticalAlign.CENTER,
        columnSpan: 1,
        children: coverCells,
      })],
    })],
  }))

  // ── PAGE BREAK ──
  children.push(new Paragraph({ children: [new PageBreak()] }))

  // ── TABLE OF CONTENTS ──
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'Table des Mati\u00e8res', bold: true, size: 40, font: 'Calibri', color: COLORS.blue })],
  }))

  for (let i = 0; i < doc.sections.length; i++) {
    const s = doc.sections[i]
    children.push(new Paragraph({
      spacing: { before: 80, after: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, font: 'Calibri', color: COLORS.darkText }),
        new TextRun({ text: s.title, size: 22, font: 'Calibri', color: COLORS.darkText }),
        new TextRun({ text: `\t${i + 3}`, bold: true, size: 22, font: 'Calibri', color: COLORS.blue }),
      ],
    }))
  }

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))

  // ── CONTENT SECTIONS ──
  for (let sIdx = 0; sIdx < doc.sections.length; sIdx++) {
    const s = doc.sections[sIdx]
    const sectionDiagrams = diagramsBySection.get(s.id) || []

    children.push(new Paragraph({ children: [new PageBreak()] }))

    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${sIdx + 1}. `, bold: true, size: 40, font: 'Calibri', color: COLORS.blue }),
        new TextRun({ text: s.title, bold: true, size: 40, font: 'Calibri', color: COLORS.blue }),
      ],
    }))

    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.blue } },
      spacing: { after: 200 }, children: [],
    }))

    const ast = parseMarkdown(s.content || '')
    children.push(...renderAst(ast, sectionDiagrams, diagramBuffers))

    for (const d of sectionDiagrams) {
      const buf = diagramBuffers.get(d.id)
      if (buf) {
        children.push(...diagramImageParagraph(d, buf, DIAGRAM_TYPE_LABELS[d.type] || `Diagramme: ${d.type}`))
      }
    }
  }

  // ── ORPHAN DIAGRAMS (no section) at end ──
  for (const d of orphanDiagrams) {
    const buf = diagramBuffers.get(d.id)
    if (buf) {
      children.push(...diagramImageParagraph(d, buf, DIAGRAM_TYPE_LABELS[d.type] || `Diagramme: ${d.type}`))
    }
  }

  // ── BACK COVER ──
  children.push(new Paragraph({ children: [new PageBreak()] }))

  const backCover = loadImageBuf(resolveAsset('backcover_bg.png') ?? '')
  if (backCover) {
    children.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new ImageRun({ data: backCover, transformation: { width: 612, height: 792 }, type: 'png' })],
    }))
  }

  // ── ASSEMBLE ──
  const wordDoc = new Document({
    creator: 'Repora',
    title,
    description: `${template.name} - ${title}`,
    sections: [{
      properties: {
        page: {
          margin: pageMargins,
        },
        titlePage: true,
      },
      headers: { default: hfHeader, first: new Header({ children: [] }) },
      footers: { default: hfFooter, first: new Footer({ children: [] }) },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(wordDoc))
}
