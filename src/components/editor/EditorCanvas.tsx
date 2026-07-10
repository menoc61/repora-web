import { useRef, useEffect, useCallback, useState } from 'react'
import { BlockNoteViewRaw as BlockNoteView, useCreateBlockNote } from '@blocknote/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useSaveDocument } from '../../hooks/useQueries'

const COLLAB_WS_BASE = 'ws://localhost:8000/collab'

// ── Types ──

export interface OutlineSection {
  title: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

// ── Block ↔ Section conversion ──

function sectionsToBlocks(sections: Array<{ id: string; title: string; content: string; status: string }>) {
  const blocks: any[] = []
  for (const section of sections) {
    blocks.push({
      type: 'heading' as const,
      props: { level: 2 },
      content: [{ type: 'text' as const, text: section.title, styles: {} }],
    })
    if (section.content) {
      const paragraphs = section.content.split('\n').filter(Boolean)
      for (const para of paragraphs) {
        blocks.push({
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: para, styles: {} }],
        })
      }
    }
  }
  return blocks
}

function blocksToSections(blocks: any[], sectionIds: Map<string, string>): Array<{ id?: string; title: string; content: string; status: string }> {
  const sections: Array<{ id?: string; title: string; content: string; status: string }> = []
  let current: { id?: string; title: string; content: string; status: string } | null = null

  for (const block of blocks) {
    const text = block.content?.map((c: any) => c.text).join('') ?? ''
    if (block.type === 'heading') {
      if (current) sections.push(current)
      current = { id: sectionIds.get(text) ?? undefined, title: text, content: '', status: 'draft' }
    } else if (current) {
      if (current.content) current.content += '\n'
      current.content += text
    }
  }
  if (current) sections.push(current)
  return sections
}

function extractOutlineFromBlocks(blocks: any[]): OutlineSection[] {
  return blocks
    .filter((b: any) => b.type === 'heading')
    .map((b: any) => ({
      title: b.content?.map((c: any) => c.text).join('') ?? '',
    }))
}

function wordCountFromBlocks(blocks: any[]): number {
  let count = 0
  for (const block of blocks) {
    const text = block.content?.map((c: any) => c.text ?? '').join(' ') ?? ''
    count += text.split(/\s+/).filter(Boolean).length
  }
  return count
}

// ── Editor Canvas (BlockNote + Yjs) ──

interface EditorCanvasProps {
  docId: string
  document: any
  isLoading: boolean
  onWordCountChange: (n: number) => void
  onOutlineChange: (sections: OutlineSection[]) => void
}

export function EditorCanvas({ docId, document, isLoading, onWordCountChange, onOutlineChange }: EditorCanvasProps) {
  const saveDocument = useSaveDocument()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Yjs + WebSocket provider — stable across renders via useState lazy init
  const [yDoc] = useState(() => new Y.Doc())
  const [provider] = useState(() => new WebsocketProvider(`${COLLAB_WS_BASE}/${docId}`, docId, yDoc))

  useEffect(() => {
    return () => {
      provider.disconnect()
      provider.destroy()
    }
  }, [provider])

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: yDoc.getXmlFragment('repora-document'),
      user: { name: 'Repora AI', color: '#2563EB' },
    },
  })

  // Populate editor from loaded document sections (once)
  useEffect(() => {
    if (!editor || isLoading || !document?.sections?.length || initializedRef.current) return
    const fragment = yDoc.getXmlFragment('repora-document')
    if (fragment.length > 0) {
      initializedRef.current = true
      return
    }
    const blocks = sectionsToBlocks(document.sections)
    if (blocks.length > 0) {
      editor.replaceBlocks(editor.document, blocks)
    }
    initializedRef.current = true
  }, [editor, document, isLoading, yDoc])

  // Debounced auto-save on content change
  const handleChange = useCallback(() => {
    if (!docId || !document) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const blocks = editor.document
      const sectionIds = new Map<string, string>()
      if (document.sections) {
        for (const s of document.sections) {
          sectionIds.set(s.title, s.id)
        }
      }
      const sections = blocksToSections(blocks, sectionIds)
      saveDocument.mutate({
        id: docId,
        sections,
        content: JSON.stringify(blocks),
      })
    }, 2000)
  }, [docId, editor, saveDocument, document])

  useEffect(() => {
    if (!editor) return
    const tip = (editor as any)._tiptapEditor
    if (!tip) return
    tip.on('update', handleChange)
    return () => {
      tip.off('update', handleChange)
    }
  }, [editor, handleChange])

  // Update word count and outline from editor state
  useEffect(() => {
    if (!editor) return
    const blocks = editor.document
    onWordCountChange(wordCountFromBlocks(blocks))
    onOutlineChange(extractOutlineFromBlocks(blocks))
  }, [editor, onWordCountChange, onOutlineChange])

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md">
        Chargement du document...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar">
      <div className="max-w-[800px] mx-auto py-20 px-12 min-h-full">
        <BlockNoteView editor={editor} theme="light" className="min-h-[60vh]" />
      </div>
    </div>
  )
}
