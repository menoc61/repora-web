// Professional Markdown → structured AST for export (PDF/DOCX)
// Supports: headings, bold, italic, lists, blockquotes, code blocks, tables,
// images, page breaks, styled callout blocks, horizontal rules

export type MdNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'list'; ordered: boolean; items: MdNode[][] }
  | { type: 'blockquote'; children: MdNode[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; alignments?: ('left' | 'center' | 'right')[] }
  | { type: 'hr' }
  | { type: 'image'; src: string; alt: string }
  | { type: 'pagebreak' }
  | { type: 'callout'; variant: 'info' | 'warning' | 'success' | 'danger' | 'note'; title?: string; children: MdNode[] }
  | { type: 'styled_table'; headers: string[]; rows: string[][]; headerColor?: string; borderColor?: string }

export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'image'; src: string; alt: string }

// ── Inline parsing ──

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let i = 0

  while (i < text.length) {
    // Bold: **text** or __text__
    if ((text.startsWith('**', i) || text.startsWith('__', i)) && i + 2 < text.length) {
      const closer = text.startsWith('**', i) ? '**' : '__'
      const end = text.indexOf(closer, i + 2)
      if (end !== -1) {
        nodes.push({ type: 'bold', children: parseInline(text.slice(i + 2, end)) })
        i = end + closer.length
        continue
      }
    }

    // Italic: *text* or _text_
    if ((text[i] === '*' || text[i] === '_') && i + 1 < text.length && text[i + 1] !== (text[i] === '*' ? '*' : '_')) {
      const closer = text[i]
      const end = text.indexOf(closer, i + 1)
      if (end !== -1 && end > i + 1) {
        nodes.push({ type: 'italic', children: parseInline(text.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }

    // Inline code: `text`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        nodes.push({ type: 'code', text: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // Image: ![alt](src)
    if (text.startsWith('![', i)) {
      const closeBracket = text.indexOf(']', i + 2)
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2)
        if (closeParen !== -1) {
          nodes.push({
            type: 'image',
            alt: text.slice(i + 2, closeBracket),
            src: text.slice(closeBracket + 2, closeParen),
          })
          i = closeParen + 1
          continue
        }
      }
    }

    // Link: [text](href)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1)
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2)
        if (closeParen !== -1) {
          nodes.push({
            type: 'link',
            href: text.slice(closeBracket + 2, closeParen),
            children: parseInline(text.slice(i + 1, closeBracket)),
          })
          i = closeParen + 1
          continue
        }
      }
    }

    // Plain text — consume until next special char
    let j = i + 1
    while (j < text.length && text[j] !== '*' && text[j] !== '_' && text[j] !== '`' && text[j] !== '[' && text[j] !== '!') j++
    nodes.push({ type: 'text', text: text.slice(i, j) })
    i = j
  }

  return nodes
}

// ── Block parsing helpers ──

function parseTableRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
}

function parseTableAlignment(sepLine: string): ('left' | 'center' | 'right')[] {
  return parseTableRow(sepLine).map(cell => {
    const trimmed = cell.trim()
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
    if (trimmed.endsWith(':')) return 'right'
    return 'left'
  })
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][]; alignments: ('left' | 'center' | 'right')[] } | null {
  if (lines.length < 2) return null
  const headers = parseTableRow(lines[0])
  const alignments = parseTableAlignment(lines[1])
  const rows = lines.slice(2).map(parseTableRow)
  return { headers, rows, alignments }
}

// ── Callout block detection ──
// Syntax: > [!INFO] Title\n> content
// or: > [!WARNING]\n> content

const CALLOUT_PATTERN = /^>\s*\[!(INFO|WARNING|SUCCESS|DANGER|NOTE)\]\s*(.*)?$/

function isCalloutStart(line: string): { isCallout: boolean; variant?: string; title?: string } {
  const match = line.match(CALLOUT_PATTERN)
  if (match) {
    return {
      isCallout: true,
      variant: match[1].toLowerCase(),
      title: match[2]?.trim() || undefined,
    }
  }
  return { isCallout: false }
}

// ── Main parser ──

export function parseMarkdown(md: string): MdNode[] {
  const lines = md.split('\n')
  const nodes: MdNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (line.trim() === '') { i++; continue }

    // Page break marker
    if (line.trim() === '---page-break---' || line.trim() === '<div style="page-break-after: always;"></div>') {
      nodes.push({ type: 'pagebreak' })
      i++
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push({ type: 'hr' })
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
      nodes.push({ type: 'heading', level, children: parseInline(headingMatch[2]) })
      i++
      continue
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'code', lang, text: codeLines.join('\n') })
      i++ // skip closing ```
      continue
    }

    // Callout block: > [!TYPE] Title\n> content
    if (line.startsWith('>')) {
      const calloutCheck = isCalloutStart(line)
      if (calloutCheck.isCallout) {
        const variant = calloutCheck.variant as any
        const title = calloutCheck.title
        const contentLines: string[] = []
        i++
        while (i < lines.length && lines[i].startsWith('>') && !isCalloutStart(lines[i]).isCallout) {
          contentLines.push(lines[i].replace(/^>\s?/, ''))
          i++
        }
        const children = parseMarkdown(contentLines.join('\n'))
        nodes.push({ type: 'callout', variant, title, children })
        continue
      }

      // Regular blockquote
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      nodes.push({ type: 'blockquote', children: parseMarkdown(quoteLines.join('\n')) })
      continue
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1])) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      const table = parseTable(tableLines)
      if (table) nodes.push({ type: 'styled_table', ...table })
      continue
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const items: MdNode[][] = []
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[\s]*[-*+]\s/, '')
        items.push([{ type: 'paragraph', children: parseInline(text) }])
        i++
      }
      nodes.push({ type: 'list', ordered: false, items })
      continue
    }

    // Ordered list
    if (/^[\s]*\d+[.)]\s/.test(line)) {
      const items: MdNode[][] = []
      while (i < lines.length && /^[\s]*\d+[.)]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[\s]*\d+[.)]\s/, '')
        items.push([{ type: 'paragraph', children: parseInline(text) }])
        i++
      }
      nodes.push({ type: 'list', ordered: true, items })
      continue
    }

    // Paragraph (default)
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('>') && !/^[\s]*[-*+]\s/.test(lines[i]) && !/^[\s]*\d+[.)]\s/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      nodes.push({ type: 'paragraph', children: parseInline(paraLines.join(' ')) })
    }
  }

  return nodes
}

// ── Utility functions ──

/** Flatten inline nodes to plain text */
export function inlineToText(nodes: InlineNode[]): string {
  return nodes.map(n => {
    switch (n.type) {
      case 'text': return n.text
      case 'bold': return inlineToText(n.children)
      case 'italic': return inlineToText(n.children)
      case 'code': return n.text
      case 'link': return inlineToText(n.children)
      case 'image': return `[${n.alt}]`
      default: return ''
    }
  }).join('')
}

/** Flatten AST to plain text */
export function astToText(nodes: MdNode[]): string {
  return nodes.map(n => {
    switch (n.type) {
      case 'heading': return inlineToText(n.children)
      case 'paragraph': return inlineToText(n.children)
      case 'list': return n.items.map(item => astToText(item)).join('\n')
      case 'blockquote': return astToText(n.children)
      case 'callout': return `[${n.variant}] ${n.title ? n.title + ': ' : ''}${astToText(n.children)}`
      case 'code': return n.text
      case 'table': return [n.headers.join(' | '), ...n.rows.map(r => r.join(' | '))].join('\n')
      case 'styled_table': return [n.headers.join(' | '), ...n.rows.map(r => r.join(' | '))].join('\n')
      case 'hr': return '---'
      case 'image': return `[${n.alt}]`
      case 'pagebreak': return ''
      default: return ''
    }
  }).join('\n\n')
}

/** Count words in AST */
export function wordCount(nodes: MdNode[]): number {
  return astToText(nodes).split(/\s+/).filter(Boolean).length
}
