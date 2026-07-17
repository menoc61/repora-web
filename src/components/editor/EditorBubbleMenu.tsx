import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import Icon from '../Icon'

interface EditorBubbleMenuProps {
  editor: Editor
}

function Divider() {
  return <div className="w-px h-5 bg-outline-variant mx-0.5" />
}

function Btn({
  icon,
  label,
  onClick,
  active,
  variant,
}: {
  icon: string
  label: string
  onClick: () => void
  active?: boolean
  variant?: 'ai'
}) {
  const isAI = variant === 'ai'
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-7 h-7 rounded transition-all duration-150 ${
        isAI
          ? 'bg-ai-vibrant text-white hover:opacity-80 active:scale-95'
          : active
            ? 'bg-ai-glow text-ai-vibrant'
            : 'text-on-surface-variant hover:bg-surface-studio hover:text-on-surface active:scale-90'
      }`}
      title={label}
    >
      <Icon name={icon} className="text-[16px]" />
    </button>
  )
}

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const getSelectedText = () => {
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, '')
  }

  const handleAIAction = (action: string) => {
    const text = getSelectedText()
    const event = new CustomEvent('repora:ai-action', {
      detail: { action, text, editor },
    })
    window.dispatchEvent(event)
  }

  return (
    <BubbleMenu
      editor={editor}
      className="bg-white border border-outline-variant rounded-xl shadow-xl px-1.5 py-1 flex items-center gap-0.5 z-50 transition-all duration-150 origin-bottom"
      style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.08)' }}
    >
      {/* Formatting */}
      <Btn
        icon="format_bold"
        label="Gras"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Btn
        icon="format_italic"
        label="Italique"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Btn
        icon="format_underlined"
        label="Souligne"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <Btn
        icon="strikethrough_s"
        label="Barré"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Btn
        icon="highlight"
        label="Surligner"
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
      <Btn
        icon="code"
        label="Code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <Divider />
      <Btn
        icon="link"
        label="Lien"
        active={editor.isActive('link')}
        onClick={() => {
          const url = prompt('URL du lien:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
      />
      <Divider />
      {/* AI actions */}
      <Btn
        icon="auto_awesome"
        label="Ameliorer avec IA"
        variant="ai"
        onClick={() => handleAIAction('improve')}
      />
      <Btn
        icon="translate"
        label="Traduire"
        variant="ai"
        onClick={() => handleAIAction('translate')}
      />
      <Btn
        icon="summarize"
        label="Resumer"
        variant="ai"
        onClick={() => handleAIAction('summarize')}
      />
      <Btn
        icon="edit_note"
        label="Reformuler"
        variant="ai"
        onClick={() => handleAIAction('rewrite')}
      />
    </BubbleMenu>
  )
}
