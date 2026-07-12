import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStream } from './useQueries'
import { useGenerationStore } from '../stores/generationStore'
import { notify } from '../components/Toast'

/**
 * Convert simple markdown to HTML for TipTap's insertContent.
 * Handles: headings, bold, italic, code, lists, blockquotes, horizontal rules.
 */
function mdToHtml(md: string): string {
  let html = md
  // Headings (must be processed before bold/italic to avoid conflicts)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^\*\*\*$/gm, '<hr />')
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Wrap standalone lines in paragraphs (but not already-wrapped content)
  html = html.replace(/^(?!<[huplbo]|<\/|<li|<hr|<code)(.+)$/gm, '<p>$1</p>')
  return html
}

export function useGenerationWriter(docId: string | undefined, editor: Editor | null) {
  const { events, isStreaming } = useDocumentStream(docId)
  const buffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentSection = useRef<string | null>(null)

  const flush = () => {
    if (!editor || !buffer.current.trim()) return
    const md = currentSection.current ? `## ${currentSection.current}\n\n${buffer.current}` : buffer.current
    const html = mdToHtml(md)
    editor.commands.insertContent(html)
    buffer.current = ''
  }

  useEffect(() => {
    if (!editor) return
    if (!isStreaming && events.length && events[events.length - 1].type === 'done') {
      flush()
      const { completeSession } = useGenerationStore.getState()
      const sess = useGenerationStore.getState().sessions.find((s) => s.documentId === docId && s.status === 'generating')
      if (sess) completeSession(sess.sessionId)
      notify({ type: 'generation_complete', title: 'Generation terminee', message: 'Le document a ete genere avec succes.' })
      return
    }
    const last = events[events.length - 1]
    if (!last) return
    if (last.type === 'agent_status' && (last as any).section_title) {
      flush()
      currentSection.current = (last as any).section_title
    } else if (last.type === 'token') {
      buffer.current += (last as any).token
      if (!timer.current) {
        timer.current = setTimeout(() => { flush(); timer.current = null }, 200)
      }
    }
  }, [events, isStreaming, editor, docId])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [])
}
