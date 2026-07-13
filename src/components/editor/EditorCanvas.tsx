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
import { collabWsUrl, type WsStatus } from '../../utils/ws'

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
  const collabRef = useRef<{ provider: WebsocketProvider; ydoc: Y.Doc } | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [collabStatus, setCollabStatus] = useState<WsStatus>('connecting')

  useEffect(() => {
    const token = useAuthStore.getState().token
    const opts = token ? { params: { token } as Record<string, string> } : undefined
    const p = new WebsocketProvider(collabWsUrl(), docId, ydoc, opts)

    p.on('status', (event: { status: string }) => {
      switch (event.status) {
        case 'connected':
          setCollabStatus('connected')
          break
        case 'connecting':
          setCollabStatus('connecting')
          break
        case 'disconnected':
          setCollabStatus('disconnected')
          break
        default:
          setCollabStatus(event.status === 'error' ? 'disconnected' : 'connecting')
      }
    })

    collabRef.current = { provider: p, ydoc }
    setProvider(p)
    return () => {
      p.off('status')
      p.disconnect()
      p.destroy()
      ydoc.destroy()
      collabRef.current = null
    }
  }, [docId])
  const [aiToolbarVisible, setAiToolbarVisible] = useState(false)
  const generating = useGenerationStore((s) =>
    s.sessions.some((x) => x.documentId === docId && x.status === 'generating'),
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        underline: false,
        horizontalRule: false,
        undoRedo: false,
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
        class: 'max-w-[800px] mx-auto py-16 px-12 focus:outline-none min-h-[60vh]',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()

        const { state } = view
        const { from } = state.selection

        for (const file of imageFiles) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            const { dispatch, state: currentState } = view
            const pos = from || currentState.doc.content.size - 2

            const imageNode = currentState.schema.nodes.image.create({
              src: base64,
              alt: file.name,
              title: file.name,
            })

            const transaction = currentState.tr.insert(pos, imageNode)
            dispatch(transaction)
          }
          reader.readAsDataURL(file)
        }

        return true
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files
        if (!files || files.length === 0) return false

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()

        const { state } = view
        const { from } = state.selection

        for (const file of imageFiles) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            const { dispatch, state: currentState } = view
            const pos = from || currentState.doc.content.size - 2

            const imageNode = currentState.schema.nodes.image.create({
              src: base64,
              alt: file.name,
              title: file.name,
            })

            const transaction = currentState.tr.insert(pos, imageNode)
            dispatch(transaction)
          }
          reader.readAsDataURL(file)
        }

        return true
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
    const ref = collabRef.current
    if (!ref) return
    const seed = () => {
      if (editor.isEmpty) {
        editor.commands.setContent(sectionsToMarkdown(document.sections))
        onOutlineChange(document.sections.map((s: any) => ({ title: s.title })))
      }
    }
    ref.provider.on('sync', seed)
    if (ref.provider.synced) seed()
    return () => { ref.provider.off('sync', seed) }
  }, [editor, document, isLoading, onOutlineChange])

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
    return () => {
      editor.off('update', handleUpdate)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [editor, handleUpdate])

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

      if (!selection.empty) {
        editor.chain().focus().deleteSelection().run()
      }

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

  // AI custom events
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
          table: `Generer un tableau structure avec des colonnes pertinentes pour cette section. Utilisez le format Markdown suivant :\n\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|---|---|---|\n| Donnee 1 | Donnee 2 | Donnee 3 |`,
          diagram: `Generer un diagramme UML pertinent pour cette section en utilisant la syntaxe PlantUML. Exemple :\n\n@startuml\nactor Utilisateur\nactor Systeme\nUtilisateur -> Systeme : Interaction\n@enduml`,
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
        Chargement du document...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar relative bg-surface-studio">
      {/* Preview page container — simulates the exported page */}
      <div className="max-w-[900px] mx-auto py-8 px-4">
        {/* Cover page block */}
        <div className="bg-gradient-to-br from-[#0f1b2e] to-[#1a2d4a] rounded-t-2xl px-16 py-20 text-white mb-8 shadow-sm">
          <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-blue-300/70 mb-6">Document</p>
          <h1 className="text-4xl font-bold leading-tight mb-3">
            {(document?.outline as any)?.title || document?.title || 'Document sans titre'}
          </h1>
          {(document?.outline as any)?.subtitle && (
            <p className="text-lg text-blue-200/80 mb-4">{(document?.outline as any).subtitle}</p>
          )}
          {(document?.outline as any)?.description && (
            <p className="text-sm text-blue-200/60 max-w-xl">{(document?.outline as any).description}</p>
          )}
          <div className="mt-12 text-xs text-blue-300/50 font-mono">
            {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Document content — white page */}
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
          <EditorContent editor={editor} />
        </div>
      </div>

      {editor && <EditorBubbleMenu editor={editor} />}
      <AiToolbar
        visible={aiToolbarVisible}
        onCommand={handleAiCommand}
        isGenerating={generating}
        onCancel={() => setAiToolbarVisible(false)}
      />
      {generating && (
        <div className="sticky bottom-20 left-1/2 -translate-x-1/2 z-20 w-fit">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur px-5 py-2.5 rounded-xl border border-outline-variant shadow-lg">
            <span className="w-2 h-2 rounded-full bg-ai-vibrant animate-pulse" />
            <span className="font-label-sm text-label-sm text-primary">Generation en cours...</span>
          </div>
        </div>
      )}
      {collabStatus !== 'connected' && collabStatus !== 'connecting' && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 border border-outline-variant shadow-sm text-[11px] font-mono text-status-review">
          <span className="w-1.5 h-1.5 rounded-full bg-status-review" />
          Collaboration hors ligne
        </div>
      )}
    </div>
  )
})
