import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Collaboration from '@tiptap/extension-collaboration'
// CollaborationCursor removed: v2 extension crashes with v3 Collaboration
// (y-prosemirror PluginKey mismatch). Re-add when v3-compatible version is available.
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useSaveDocument } from '../../hooks/useQueries'
import { streamAiComplete } from '../../hooks/useQueries'
import { useGenerationStore } from '../../stores/generationStore'
import { useGenerationWriter } from '../../hooks/useGenerationWriter'
import { useAuthStore } from '../../stores'
import { SlashCommand } from './extensions/SlashCommand'
import EditorBubbleMenu from './EditorBubbleMenu'
import AiToolbar from './AiToolbar'

const lowlight = createLowlight(common)

export interface OutlineSection {
  title: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

interface EditorCanvasProps {
  docId: string
  document: any
  isLoading: boolean
  onWordCountChange: (n: number) => void
  onOutlineChange: (sections: OutlineSection[]) => void
  onEditorReady?: (editor: any) => void
  onProviderReady?: (provider: any) => void
}

function collabWsUrl(docName: string): string {
  const { protocol, host } = window.location
  const token = useAuthStore.getState().token
  const base = `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/collab/${docName}`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

function sectionsToMarkdown(sections: Array<{ title: string; content: string }>): string {
  return sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join('\n\n')
}

export default forwardRef<any, EditorCanvasProps>((props, ref) => {
  const { docId, document, isLoading, onWordCountChange, onOutlineChange, onEditorReady, onProviderReady } = props
  const saveDocument = useSaveDocument()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ydoc] = useState(() => new Y.Doc())
  const [provider] = useState(() => new WebsocketProvider(collabWsUrl(docId), docId, ydoc))
  const [aiToolbarVisible, setAiToolbarVisible] = useState(false)
  const generating = useGenerationStore((s) =>
    s.sessions.some((x) => x.documentId === docId && x.status === 'generating'),
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-ai-vibrant underline cursor-pointer' } }),
      Placeholder.configure({ placeholder: "Tapez '/' pour les commandes, ou commencez a ecrire..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight.configure({ multicolor: true }),
      Typography,
      HorizontalRule,
      Image.configure({ inline: true, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      Markdown,
      SlashCommand,
      Collaboration.configure({ document: ydoc }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-[800px] mx-auto py-20 px-12 focus:outline-none min-h-[60vh]',
      },
    },
  })

  useImperativeHandle(ref, () => editor, [editor])

  useEffect(() => {
    onEditorReady?.(editor)
  }, [editor, onEditorReady])

  useEffect(() => {
    onProviderReady?.(provider)
  }, [provider, onProviderReady])

  // Seed once from document.sections if collab doc is empty
  useEffect(() => {
    if (!editor || isLoading || !document?.sections?.length) return
    const seed = () => {
      if (editor.isEmpty) {
        editor.commands.setContent(sectionsToMarkdown(document.sections))
        onOutlineChange(document.sections.map((s: any) => ({ title: s.title })))
      }
    }
    provider.on('sync', seed)
    if (provider.synced) seed()
    return () => { provider.off('sync', seed) }
  }, [editor, document, isLoading, provider, onOutlineChange])

  // Autosave markdown
  const handleUpdate = useCallback(() => {
    if (!editor || !docId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const md = (editor.storage as any).markdown?.getMarkdown?.() ?? ''
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length
      onWordCountChange(words)
      saveDocument.mutate({ id: docId, content: md })
    }, 2000)
  }, [editor, docId, saveDocument, onWordCountChange])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

  // Lock editor while generating
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!generating)
  }, [editor, generating])

  // Live generation streaming (SSE -> TipTap)
  useGenerationWriter(docId, editor)

  const aiStreamingRef = useRef(false)

  const handleAiCommand = useCallback(
    async (command: string) => {
      if (!editor || aiStreamingRef.current) return
      const selection = editor.state.selection
      const selectedText = selection.empty
        ? ''
        : editor.state.doc.textBetween(selection.from, selection.to, '')

      aiStreamingRef.current = true
      setAiToolbarVisible(false)

      // If there's selected text, delete it first so the AI replaces it
      if (!selection.empty) {
        editor.chain().focus().deleteSelection().run()
      }

      // Insert a markdown separator before AI output
      editor.chain().focus().insertContent('\n\n').run()

      try {
        const stream = await streamAiComplete(command, selectedText || undefined)
        for await (const token of stream) {
          editor.chain().focus().insertContent(token).run()
        }
      } catch (err) {
        console.error('AI complete error:', err)
        editor.chain().focus().insertContent('\n*[Erreur: impossible de joindre l\'assistant IA]*\n').run()
      } finally {
        aiStreamingRef.current = false
      }
    },
    [editor],
  )

  // AI custom events — depends on handleAiCommand (defined above)
  useEffect(() => {
    const handleAiGenerate = () => setAiToolbarVisible(true)
    const handleAiImprove = () => setAiToolbarVisible(true)
    const handleAiAction = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.action && editor) {
        const text = detail.text || ''
        const promptMap: Record<string, string> = {
          improve: `Ameliorez et reformulez ce texte en gardant le sens :\n\n${text}`,
          translate: `Traduisez ce texte en anglais :\n\n${text}`,
          summarize: `Resumez ce texte en 2-3 phrases :\n\n${text}`,
          rewrite: `Reformulez ce texte de maniere plus claire et professionnelle :\n\n${text}`,
        }
        const prompt = promptMap[detail.action] || detail.action
        handleAiCommand(prompt)
      }
    }

    window.addEventListener('repora:ai-generate', handleAiGenerate)
    window.addEventListener('repora:ai-improve', handleAiImprove)
    window.addEventListener('repora:ai-action', handleAiAction)
    return () => {
      window.removeEventListener('repora:ai-generate', handleAiGenerate)
      window.removeEventListener('repora:ai-improve', handleAiImprove)
      window.removeEventListener('repora:ai-action', handleAiAction)
    }
  }, [editor, handleAiCommand])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md">
        Chargement du document…
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar relative">
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
      <AiToolbar
        visible={aiToolbarVisible}
        onCommand={handleAiCommand}
        isGenerating={generating}
        onCancel={() => setAiToolbarVisible(false)}
      />
      {generating && (
        <div className="absolute inset-0 bg-surface-studio/60 flex items-center justify-center z-20">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-outline-variant shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-ai-vibrant animate-pulse" />
            <span className="font-label-md text-label-md text-primary">Génération en cours…</span>
          </div>
        </div>
      )}
    </div>
  )
})
