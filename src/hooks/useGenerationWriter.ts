import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStream } from './useQueries'
import { useGenerationStore } from '../stores/generationStore'
import { notify } from '../components/Toast'

function stripRawToolCalls(text: string): string {
  if (!text) return text
  let cleaned = text
  cleaned = cleaned.replace(/```(?:json|markdown|tool_call)?\s*\n?/g, '').replace(/```\s*\n?/g, '')
  const toolCallPattern = /\{\s*(?:"tool"|"action"|"name")\s*:\s*"[^"]*"(?:\s*,\s*"arguments"\s*:\s*\{[^}]*\})?\s*\}/g
  cleaned = cleaned.replace(toolCallPattern, '').trim()
  cleaned = cleaned.replace(/^\n+|\n+$/g, '').trim()
  return cleaned
}

function mdToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++
      out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      out.push('<hr />')
      i++
      continue
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (hMatch) {
      const level = hMatch[1].length
      const content = parseInline(hMatch[2])
      out.push(`<h${level}>${content}</h${level}>`)
      i++
      continue
    }

    if (/^>\s/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote><p>${parseInline(quoteLines.join('\n'))}</p></blockquote>`)
      continue
    }

    if (/\|.*\|/.test(line) && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1])) {
      const headerCells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      i += 2
      out.push('<table><thead><tr>')
      for (const cell of headerCells) {
        out.push(`<th>${parseInline(cell)}</th>`)
      }
      out.push('</tr></thead><tbody>')
      while (i < lines.length && /\|.*\|/.test(lines[i])) {
        const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim())
        out.push('<tr>')
        for (const cell of cells) {
          out.push(`<td>${parseInline(cell)}</td>`)
        }
        out.push('</tr>')
        i++
      }
      out.push('</tbody></table>')
      continue
    }

    const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)$/)
    if (taskMatch) {
      const checked = taskMatch[2] !== ' '
      out.push(`<ul><li data-type="taskItem" data-checked="${checked}">${parseInline(taskMatch[3])}</li></ul>`)
      i++
      continue
    }

    if (/^(\s*)[-*+]\s+(.+)$/.test(line)) {
      out.push('<ul>')
      while (i < lines.length && /^(\s*)[-*+]\s+(.+)$/.test(lines[i])) {
        const content = lines[i].replace(/^(\s*)[-*+]\s+(.+)$/, '$2')
        out.push(`<li>${parseInline(content)}</li>`)
        i++
      }
      out.push('</ul>')
      continue
    }

    if (/^\s*\d+\.\s+(.+)$/.test(line)) {
      out.push('<ol>')
      while (i < lines.length && /^\s*\d+\.\s+(.+)$/.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+\.\s+(.+)$/, '$1')
        out.push(`<li>${parseInline(content)}</li>`)
        i++
      }
      out.push('</ol>')
      continue
    }

    if (/^\s*$/.test(line)) {
      i++
      continue
    }

    const paraLines: string[] = []
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !/^```/.test(lines[i]) && !/^>/.test(lines[i]) && !/^\s*[-*+]\s/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      out.push(`<p>${parseInline(paraLines.join('<br />'))}</p>`)
    }
  }

  return out.join('\n')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseInline(text: string): string {
  let s = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  s = s.replace(/~~(.+?)~~/g, '<s>$1</s>')
  return s
}

export function useGenerationWriter(docId: string | undefined, editor: Editor | null) {
  const { events, isStreaming } = useDocumentStream(docId)
  const fullBuffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentSection = useRef<string | null>(null)
  const lastEventCount = useRef(0)

  const flush = () => {
    if (!editor) return
    let content = fullBuffer.current
    if (currentSection.current) {
      content = `## ${currentSection.current}\n\n${content}`
    }
    content = stripRawToolCalls(content)
    if (!content.trim()) return
    const html = mdToHtml(content)
    editor.commands.setContent(html)
    const size = editor.state.doc.content.size
    editor.commands.setTextSelection({ from: size, to: size })
    editor.commands.scrollIntoView()
  }

  useEffect(() => {
    if (!editor) return
    if (!isStreaming && events.length && events[events.length - 1].type === 'done') {
      flush()
      const doneEvent = events[events.length - 1] as any
      const { completeSession, updateSession } = useGenerationStore.getState()
      const sess = useGenerationStore.getState().sessions.find((s) => s.documentId === docId && s.status === 'generating')
      if (sess) {
        if (doneEvent.elapsed_ms) {
          updateSession(sess.sessionId, { elapsedMs: doneEvent.elapsed_ms, completedAt: doneEvent.completed_at })
        }
        completeSession(sess.sessionId)
      }
      const elapsed = doneEvent.elapsed_ms ? ` (${Math.round(doneEvent.elapsed_ms / 1000)}s)` : ''
      notify({ type: 'generation_complete', title: 'Generation terminee', message: `Le document a ete genere avec succes${elapsed}.` })
      return
    }
    const last = events[events.length - 1]
    if (!last) return
    if (last.type === 'agent_status' && (last as any).section_title) {
      flush()
      fullBuffer.current = ''
      currentSection.current = (last as any).section_title
    } else if (last.type === 'token') {
      fullBuffer.current += (last as any).token
      if (!timer.current) {
        timer.current = setTimeout(() => { flush(); timer.current = null }, 200)
      }
    }
  }, [events, isStreaming, editor, docId])

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [])
}
