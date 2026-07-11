import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStream } from './useQueries'
import { useGenerationStore } from '../stores/generationStore'

export function useGenerationWriter(docId: string | undefined, editor: Editor | null) {
  const { events, isStreaming } = useDocumentStream(docId)
  const buffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentSection = useRef<string | null>(null)

  const flush = () => {
    if (!editor || !buffer.current.trim()) return
    const md = currentSection.current ? `## ${currentSection.current}\n\n${buffer.current}` : buffer.current
    editor.commands.insertContent(md)
    buffer.current = ''
  }

  useEffect(() => {
    if (!editor) return
    if (!isStreaming && events.length && events[events.length - 1].type === 'done') {
      flush()
      const { completeSession } = useGenerationStore.getState()
      const sess = useGenerationStore.getState().sessions.find((s) => s.documentId === docId && s.status === 'generating')
      if (sess) completeSession(sess.sessionId)
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
}