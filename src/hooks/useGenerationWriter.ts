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
  const pending = useRef('')
  const rafId = useRef<number | null>(null)
  const currentSection = useRef<string | null>(null)
  const seen = useRef(0)

  // Append only the newly-arrived text to the END of the document instead of
  // re-parsing the whole thing. `setContent` on every token batch was the cause
  // of the main-thread freeze: it re-parsed + re-rendered the entire doc (and,
  // with the Collaboration/Yjs extension, produced a full doc diff) on each
  // tick — cost grew quadratically with document length.
  //
  // To guarantee the screen never freezes:
  //  - writes are batched to one per animation frame (rAF),
  //  - oversized batches are split into capped chunks so a single insert can
  //    never block the main thread for long,
  //  - a destroyed/closed editor is detected and skipped before touching it.
  const MAX_CHUNK = 4000

  const isAlive = (ed: Editor | null): ed is Editor =>
    !!ed && !ed.isDestroyed && ed.state?.doc != null

  const appendPending = (ed: Editor) => {
    rafId.current = null
    if (!isAlive(ed) || !pending.current) return
    const text = stripRawToolCalls(pending.current)
    pending.current = ''
    if (!text) return
    // Split into capped chunks and insert across frames so no single
    // synchronous parse/render can jank the UI.
    let from = 0
    const insertChunks = (start: number) => {
      if (!isAlive(ed)) return
      const chunk = text.slice(start, start + MAX_CHUNK)
      if (!chunk) {
        requestAnimationFrame(() => isAlive(ed) && ed.commands.scrollIntoView())
        return
      }
      const end = ed.state.doc.content.size
      ed.chain().insertContentAt(end, chunk).setTextSelection(end + chunk.length).run()
      if (start + MAX_CHUNK < text.length) {
        requestAnimationFrame(() => insertChunks(start + MAX_CHUNK))
      } else {
        requestAnimationFrame(() => isAlive(ed) && ed.commands.scrollIntoView())
      }
    }
    insertChunks(0)
  }

  // Full re-render (used on section boundaries and final done), kept off the
  // hot path. Yields a frame first so the UI can paint before the (rare) heavy
  // parse, and never runs on a destroyed editor.
  const renderFull = (ed: Editor, content: string) => {
    content = stripRawToolCalls(content)
    if (!content.trim() || !isAlive(ed)) return
    requestAnimationFrame(() => {
      if (!isAlive(ed)) return
      ed.commands.setContent(mdToHtml(content))
      const size = ed.state.doc.content.size
      ed.commands.setTextSelection({ from: size, to: size })
      ed.commands.scrollIntoView()
    })
  }

  const schedule = (ed: Editor) => {
    if (rafId.current == null) rafId.current = requestAnimationFrame(() => appendPending(ed))
  }

  useEffect(() => {
    if (!isAlive(editor) || events.length <= seen.current) return

    const newEvents = events.slice(seen.current)
    seen.current = events.length

    // Final flush: render the complete doc once, then close the session.
    if (!isStreaming && events[events.length - 1]?.type === 'done') {
      if (rafId.current != null) { cancelAnimationFrame(rafId.current); rafId.current = null }
      if (pending.current) {
        const tail = currentSection.current ? `## ${currentSection.current}\n\n${pending.current}` : pending.current
        renderFull(editor, tail)
        pending.current = ''
      }
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

    for (const ev of newEvents) {
      if (ev.type === 'agent_status' && (ev as any).section_title) {
        // Section boundary: commit what we have, then start the new section header.
        if (pending.current) { renderFull(editor, currentSection.current ? `## ${currentSection.current}\n\n${pending.current}` : pending.current); pending.current = '' }
        currentSection.current = (ev as any).section_title
        pending.current += `\n\n## ${currentSection.current}\n\n`
      } else if (ev.type === 'token') {
        pending.current += (ev as any).token
      }
    }
    schedule(editor)
  }, [events, isStreaming, editor, docId])

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
  }, [])
}
