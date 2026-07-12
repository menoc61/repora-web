import type { Editor } from '@tiptap/react'

export interface SlashMenuItem {
  label: string
  icon: string
  description: string
  command: (editor: Editor) => void
}

export const slashMenuItems: SlashMenuItem[] = [
  // AI
  {
    label: 'Rediger avec IA',
    icon: 'auto_awesome',
    description: 'Generer le contenu de cette section',
    command: (editor) => {
      const event = new CustomEvent('repora:ai-generate', { detail: { editor } })
      window.dispatchEvent(event)
    },
  },
  {
    label: 'Ameliorer le texte',
    icon: 'edit_note',
    description: 'Refondre et ameliorer le texte selectionne',
    command: (editor) => {
      const event = new CustomEvent('repora:ai-improve', { detail: { editor } })
      window.dispatchEvent(event)
    },
  },
  {
    label: 'Resumer la selection',
    icon: 'summarize',
    description: 'Resumer le texte selectionne en 2-3 phrases',
    command: (editor) => {
      // Use actual selection, fallback to first 500 chars if no selection
      const selection = editor.state.selection
      const text = selection.empty
        ? editor.state.doc.textContent.slice(0, 500)
        : editor.state.doc.textBetween(selection.from, selection.to, '')
      const event = new CustomEvent('repora:ai-action', { detail: { action: 'summarize', text, editor } })
      window.dispatchEvent(event)
    },
  },
  {
    label: 'Generer un tableau',
    icon: 'table_chart',
    description: 'Creer un tableau structure a partir du contexte',
    command: (editor) => {
      const event = new CustomEvent('repora:ai-action', { detail: { action: 'table', text: '', editor } })
      window.dispatchEvent(event)
    },
  },
  {
    label: 'Generer diagramme UML',
    icon: 'account_tree',
    description: 'Creer un diagramme UML pertinent',
    command: (editor) => {
      const event = new CustomEvent('repora:ai-action', { detail: { action: 'diagram', text: '', editor } })
      window.dispatchEvent(event)
    },
  },
  // Headings
  {
    label: 'Titre 1',
    icon: 'format_h1',
    description: 'Grand titre de chapitre',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Titre 2',
    icon: 'format_h2',
    description: 'Titre de section',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Titre 3',
    icon: 'format_h3',
    description: 'Sous-titre',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  // Blocks
  {
    label: 'Liste a puces',
    icon: 'format_list_bulleted',
    description: 'Liste non ordonnee',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Liste numerotee',
    icon: 'format_list_numbered',
    description: 'Liste ordonnee',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Liste de taches',
    icon: 'checklist',
    description: 'Liste avec cases a cocher',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Citation',
    icon: 'format_quote',
    description: 'Bloc de citation',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Code',
    icon: 'code',
    description: 'Bloc de code',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Separateur',
    icon: 'horizontal_rule',
    description: 'Ligne horizontale',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  // Inserts
  {
    label: 'Tableau',
    icon: 'table_chart',
    description: 'Inserer un tableau',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: 'Image',
    icon: 'image',
    description: 'Inserer une image par URL',
    command: (editor) => {
      const url = prompt("URL de l'image:")
      if (url) editor.chain().focus().setImage({ src: url }).run()
    },
  },
]
