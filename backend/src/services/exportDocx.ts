import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  ImageRun, Header, Footer, PageNumber, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableLayoutType, VerticalAlign,
  PageBreak, TabStopType, TabStopPosition,
  convertInchesToTwip,
} from 'docx'
import { parseMarkdown, inlineToText, astToText, type MdNode, type InlineNode } from '../utils/markdownParser'
import { getTemplate, hexToRgb, type DocumentTemplate } from '../utils/docTemplates'
import * as fs from 'fs'
import * as path from 'path'

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

// ── Helpers ──

function hexColor(hex: string): string {
  return hex.replace('#', '')
}

function renderInlineDocx(nodes: InlineNode[], template: DocumentTemplate): TextRun[] {
  return nodes.map(n => {
    switch (n.type) {
      case 'text':
        return new TextRun({ text: n.text, size: 22, font: 'Calibri', color: hexColor(template.colors.text) })
      case 'bold':
        return new TextRun({ text: inlineToText(n.children), bold: true, size: 22, font: 'Calibri', color: hexColor(template.colors.text) })
      case 'italic':
        return new TextRun({ text: inlineToText(n.children), italics: true, size: 22, font: 'Calibri', color: hexColor(template.colors.text) })
      case 'code':
        return new TextRun({ text: n.text, font: 'Courier New', size: 20, color: hexColor(template.colors.primary) })
      case 'link':
        return new TextRun({ text: inlineToText(n.children), size: 22, color: hexColor(template.colors.secondary), underline: {} })
      case 'image':
        return new TextRun({ text: `[${n.alt}]`, size: 20, color: hexColor(template.colors.muted), italics: true })
      default:
        return new TextRun({ text: '', size: 22 })
    }
  })
}

function buildTableDocx(headers: string[], rows: string[][], template: DocumentTemplate): Table {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: hexColor(template.colors.tableHeader) },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: h, bold: true, size: 20, font: 'Calibri', color: hexColor(template.colors.tableHeaderText) })],
    })],
  }))

  const dataRows = rows.map((row, rowIdx) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: rowIdx % 2 === 1
        ? { type: ShadingType.SOLID, color: hexColor(template.colors.tableAltRow) }
        : undefined,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: cell || '', size: 20, font: 'Calibri', color: hexColor(template.colors.text) })],
      })],
    })),
  }))

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
    layout: TableLayoutType.FIXED,
  })
}

function buildCalloutDocx(variant: string, title: string | undefined, children: MdNode[], template: DocumentTemplate): Paragraph[] {
  const colorMap: Record<string, string> = {
    info: template.colors.calloutInfo,
    warning: template.colors.calloutWarning,
    success: template.colors.calloutSuccess,
    danger: template.colors.calloutDanger,
    note: template.colors.calloutInfo,
  }
  const iconMap: Record<string, string> = {
    info: '\u2139\uFE0F',
    warning: '\u26A0\uFE0F',
    success: '\u2705',
    danger: '\u274C',
    note: '\u2139\uFE0F',
  }

  const bgColor = colorMap[variant] || colorMap.info
  const icon = iconMap[variant] || iconMap.info
  const text = astToText(children)
  const label = title ? `${icon} ${title}` : `${icon} ${variant.toUpperCase()}`

  return [
    new Paragraph({ spacing: { before: 120 }, children: [] }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.2) },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: hexColor(template.colors.secondary) } },
      shading: { type: ShadingType.SOLID, color: hexColor(bgColor) },
      children: [
        new TextRun({ text: label + '\n', bold: true, size: 20, font: 'Calibri', color: hexColor(template.colors.primary) }),
        new TextRun({ text, size: 20, font: 'Calibri', color: hexColor(template.colors.text) }),
      ],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ]
}

// ── Main builder ──

export async function buildProfessionalDocx(doc: DocInput, diagrams: DiagramInput[]): Promise<Buffer> {
  const title = (doc.outline as { title?: string } | null)?.title || 'Document'
  const date = new Date().toISOString().split('T')[0]
  const template = getTemplate(doc.config.documentType || 'cahier_des_charges') || getTemplate('cahier_des_charges')!
  const headerCfg = doc.config.header || {}
  const footerCfg = doc.config.footer || {}

  // Load diagram PNGs
  const diagramBuffers = new Map<string, Buffer>()
  for (const d of diagrams) {
    if (d.pngBuffer) {
      diagramBuffers.set(d.id, d.pngBuffer)
    } else if (d.renderedUrl?.startsWith('/uploads/')) {
      try {
        const filePath = path.join(process.cwd(), d.renderedUrl)
        if (fs.existsSync(filePath)) {
          diagramBuffers.set(d.id, fs.readFileSync(filePath))
        }
      } catch {}
    }
  }

  const children: (Paragraph | Table)[] = []

  // ── Cover page ──
  children.push(
    // Top color bar
    new Paragraph({
      spacing: { before: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 30, color: hexColor(template.colors.primary) } },
      children: [],
    }),
    new Paragraph({ spacing: { before: 2400 }, children: [] }),
  )

  // Company name
  if (headerCfg.companyName) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: headerCfg.companyName, bold: true, size: 56, font: 'Calibri', color: hexColor(template.colors.primary) })],
    }))
    if (headerCfg.tagline) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: headerCfg.tagline, size: 24, font: 'Calibri', color: hexColor(template.colors.muted), italics: true })],
      }))
    }
    // Separator line
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hexColor(template.colors.secondary) } },
      spacing: { after: 400 },
      children: [],
    }))
  }

  // Document title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: title, bold: true, size: 48, font: 'Calibri', color: hexColor(template.colors.heading) })],
  }))

  // Subtitle (template name)
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: template.name, size: 26, font: 'Calibri', color: hexColor(template.colors.secondary) })],
  }))

  // Date & generator
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: `Date : ${date}`, size: 22, font: 'Calibri', color: hexColor(template.colors.muted) })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Genere par Repora', size: 20, font: 'Calibri', color: hexColor(template.colors.muted) })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: `Version 1.0`, size: 20, font: 'Calibri', color: hexColor(template.colors.muted) })],
    }),
  )

  // ── Table of contents ──
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hexColor(template.colors.primary) } },
      children: [new TextRun({ text: 'TABLE DES MATIERES', bold: true, size: 32, font: 'Calibri', color: hexColor(template.colors.primary) })],
    }),
  )

  for (let i = 0; i < doc.sections.length; i++) {
    const s = doc.sections[i]
    children.push(new Paragraph({
      spacing: { before: 80, after: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, font: 'Calibri', color: hexColor(template.colors.primary) }),
        new TextRun({ text: s.title, size: 22, font: 'Calibri', color: hexColor(template.colors.text) }),
      ],
    }))
  }

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))

  // ── Content sections ──
  for (let sIdx = 0; sIdx < doc.sections.length; sIdx++) {
    const s = doc.sections[sIdx]
    const ast = parseMarkdown(s.content || '')

    // Section page break
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // Section heading with colored bar
    children.push(
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hexColor(template.colors.primary) } },
        spacing: { after: 300 },
        children: [
          new TextRun({ text: `${sIdx + 1}.  `, bold: true, size: 32, font: 'Calibri', color: hexColor(template.colors.secondary) }),
          new TextRun({ text: s.title.toUpperCase(), bold: true, size: 32, font: 'Calibri', color: hexColor(template.colors.primary) }),
        ],
      }),
    )

    // Render content
    for (const node of ast) {
      switch (node.type) {
        case 'heading': {
          const level = node.level <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
          const size = node.level === 1 ? 32 : node.level === 2 ? 28 : 24
          children.push(new Paragraph({
            heading: level,
            spacing: { before: 240, after: 120 },
            border: node.level <= 2
              ? { bottom: { style: BorderStyle.SINGLE, size: 2, color: hexColor(template.colors.border) } }
              : undefined,
            children: [
              new TextRun({ text: inlineToText(node.children), bold: true, size, font: 'Calibri', color: hexColor(template.colors.heading) }),
            ],
          }))
          break
        }
        case 'paragraph': {
          children.push(new Paragraph({
            spacing: { after: 120 },
            children: renderInlineDocx(node.children, template),
          }))
          break
        }
        case 'list': {
          for (let idx = 0; idx < node.items.length; idx++) {
            const bullet = node.ordered ? `${idx + 1}.` : '\u2022'
            const itemText = astToText(node.items[idx])
            children.push(new Paragraph({
              indent: { left: convertInchesToTwip(node.ordered ? 0.3 : 0.2), hanging: convertInchesToTwip(0.2) },
              spacing: { after: 60 },
              children: [
                new TextRun({ text: `${bullet}  `, bold: true, size: 22, font: 'Calibri', color: hexColor(template.colors.secondary) }),
                new TextRun({ text: itemText, size: 22, font: 'Calibri', color: hexColor(template.colors.text) }),
              ],
            }))
          }
          break
        }
        case 'blockquote': {
          const text = astToText(node.children)
          children.push(new Paragraph({
            indent: { left: convertInchesToTwip(0.4) },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: hexColor(template.colors.secondary) } },
            spacing: { before: 120, after: 120 },
            children: [new TextRun({ text, italics: true, size: 22, font: 'Calibri', color: hexColor(template.colors.muted) })],
          }))
          break
        }
        case 'code': {
          for (const line of node.text.split('\n')) {
            children.push(new Paragraph({
              indent: { left: convertInchesToTwip(0.2) },
              shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
              spacing: { after: 20 },
              children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: hexColor(template.colors.text) })],
            }))
          }
          children.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
          break
        }
        case 'styled_table': {
          children.push(buildTableDocx(node.headers, node.rows, template))
          children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
          break
        }
        case 'table': {
          children.push(buildTableDocx(node.headers, node.rows, template))
          children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
          break
        }
        case 'callout': {
          const calloutParagraphs = buildCalloutDocx(node.variant, node.title, node.children, template)
          children.push(...calloutParagraphs)
          break
        }
        case 'image': {
          const diagEntry = diagrams.find(d => d.renderedUrl === node.src)
          if (diagEntry) {
            const pngBuf = diagramBuffers.get(diagEntry.id)
            if (pngBuf) {
              children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 60 },
                children: [new ImageRun({
                  data: pngBuf,
                  transformation: { width: 480, height: 280 },
                  type: 'png',
                })],
              }))
              children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({ text: node.alt, italics: true, size: 18, font: 'Calibri', color: hexColor(template.colors.muted) })],
              }))
              break
            }
          }
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: `[${node.alt}]`, italics: true, size: 20, color: hexColor(template.colors.muted) })],
          }))
          break
        }
        case 'hr': {
          children.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: hexColor(template.colors.border) } },
            spacing: { before: 200, after: 200 },
            children: [],
          }))
          break
        }
        case 'pagebreak': {
          children.push(new Paragraph({ children: [new PageBreak()] }))
          break
        }
      }
    }
  }

  // ── Assemble document ──
  const wordDoc = new Document({
    creator: 'Repora',
    title,
    description: `${template.name} - ${title}`,
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: hexColor(template.colors.primary) } },
              spacing: { after: 200 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({
                  text: headerCfg.companyName || template.name,
                  bold: true,
                  size: 18,
                  font: 'Calibri',
                  color: hexColor(template.colors.muted),
                }),
                ...(headerCfg.tagline
                  ? [new TextRun({ text: `\t${headerCfg.tagline}`, size: 16, font: 'Calibri', color: hexColor(template.colors.muted), italics: true })]
                  : []),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: hexColor(template.colors.border) } },
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
              children: [
                ...(footerCfg.copyright
                  ? [new TextRun({ text: `${footerCfg.copyright}  |  `, size: 16, font: 'Calibri', color: hexColor(template.colors.muted) })]
                  : []),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: hexColor(template.colors.primary) }),
                new TextRun({ text: ' / ', size: 18, font: 'Calibri', color: hexColor(template.colors.muted) }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Calibri', color: hexColor(template.colors.muted) }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(wordDoc))
}
