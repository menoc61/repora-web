import { useState } from 'react'
import Icon from '../Icon'
import type { Editor } from '@tiptap/react'

interface EditorFormatToolbarProps {
  editor: Editor | null
  locked: boolean
}

function Divider() {
  return <div className="w-px h-5 bg-outline-variant/60 mx-0.5" />
}

function Btn({
  icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: string
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-surface-container transition-colors disabled:opacity-30 ${
        active ? 'text-ai-vibrant bg-ai-glow' : 'text-on-surface-variant'
      }`}
      title={label}
    >
      <Icon name={icon} className="text-[18px]" />
    </button>
  )
}

function HeadingDropdown({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const currentLevel = [1, 2, 3, 4].find((l) => editor.isActive('heading', { level: l }))

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 font-label-sm text-label-sm ${
          currentLevel ? 'text-ai-vibrant' : ''
        }`}
      >
        <Icon name={currentLevel ? `format_h${currentLevel}` : 'title'} className="text-[16px]" />
        <Icon name="expand_more" className="text-[12px]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-xl z-50 w-44 overflow-hidden">
            <button
              onClick={() => { editor.chain().focus().setParagraph().run(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-body-sm text-on-surface-variant hover:bg-surface-studio transition-colors"
            >
              <Icon name="notes" className="text-[16px]" /> Paragraphe
            </button>
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => { editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run(); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-studio transition-colors ${
                  editor.isActive('heading', { level }) ? 'text-ai-vibrant bg-ai-glow' : 'text-on-surface-variant'
                }`}
              >
                <Icon name={`format_h${level}`} className="text-[16px]" />
                <span className={`font-body-sm ${level === 1 ? 'text-lg font-semibold' : level === 2 ? 'text-base font-semibold' : level === 3 ? 'text-sm font-semibold' : 'text-sm'}`}>
                  Titre {level}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TableControls({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  if (!editor.isActive('table')) return null
  return (
    <>
      <Divider />
      <Btn icon="table_chart" label="Tableau" active={editor.isActive('table')} onClick={() => {}} disabled={disabled} />
      <Btn icon="grid_on" label="Ajouter colonne" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={disabled} />
      <Btn icon="view_column" label="Ajouter ligne" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={disabled} />
      <Btn icon="delete" label="Supprimer colonne" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={disabled} />
      <Btn icon="delete" label="Supprimer ligne" onClick={() => editor.chain().focus().deleteRow().run()} disabled={disabled} />
    </>
  )
}

export default function EditorFormatToolbar({ editor, locked }: EditorFormatToolbarProps) {
  if (!editor) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-outline-variant rounded-full px-3 py-1.5 flex items-center gap-1 z-30 max-w-[90vw] overflow-x-auto hide-scrollbar">
      {/* Ask AI */}
      <button
        disabled={locked}
        className="flex items-center gap-1.5 text-ai-vibrant font-bold text-label-md px-2.5 py-1.5 rounded-full hover:bg-ai-glow transition-colors disabled:opacity-40 shrink-0"
        onClick={() => {
          const event = new CustomEvent('repora:ai-generate', { detail: { editor } })
          window.dispatchEvent(event)
        }}
      >
        <Icon name="auto_awesome" className="text-[16px]" /> IA
      </button>

      <Divider />

      {/* Headings */}
      <HeadingDropdown editor={editor} disabled={locked} />

      <Divider />

      {/* Text formatting */}
      <Btn icon="format_bold" label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} disabled={locked} />
      <Btn icon="format_italic" label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={locked} />
      <Btn icon="format_underlined" label="Souligne" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={locked} />
      <Btn icon="strikethrough_s" label="Barré" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={locked} />
      <Btn icon="highlight" label="Surligner" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} disabled={locked} />
      <Btn icon="code" label="Code inline" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} disabled={locked} />

      <Divider />

      {/* Lists */}
      <Btn icon="format_list_bulleted" label="Liste a puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={locked} />
      <Btn icon="format_list_numbered" label="Liste numerotee" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={locked} />
      <Btn icon="checklist" label="Liste de taches" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} disabled={locked} />

      <Divider />

      {/* Blocks */}
      <Btn icon="format_quote" label="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={locked} />
      <Btn icon="code_blocks" label="Bloc de code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={locked} />

      <Divider />

      {/* Alignment */}
      <Btn icon="format_align_left" label="Aligner a gauche" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} disabled={locked} />
      <Btn icon="format_align_center" label="Centrer" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} disabled={locked} />
      <Btn icon="format_align_right" label="Aligner a droite" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} disabled={locked} />

      {/* Table controls (contextual) */}
      <TableControls editor={editor} disabled={locked} />

      <Divider />

      {/* Undo / Redo */}
      <Btn icon="undo" label="Annuler" onClick={() => editor.chain().focus().undo().run()} disabled={locked || !editor.can().undo()} />
      <Btn icon="redo" label="Retablir" onClick={() => editor.chain().focus().redo().run()} disabled={locked || !editor.can().redo()} />
    </div>
  )
}
