import { useState, useRef, useEffect } from 'react'
import Icon from '../Icon'

interface AiToolbarProps {
  visible: boolean
  onCommand: (command: string) => void
  isGenerating?: boolean
  onCancel?: () => void
}

const QUICK_ACTIONS = [
  { label: 'Rediger', icon: 'auto_awesome', prompt: 'Rediger le contenu de cette section' },
  { label: 'Ameliorer', icon: 'edit_note', prompt: 'Ameliorer et reformuler le texte' },
  { label: 'Resumer', icon: 'summarize', prompt: 'Resumer en 2-3 phrases' },
  { label: 'Tableau', icon: 'table_chart', prompt: 'Generer un tableau structure pour cette section' },
  { label: 'Diag. UML', icon: 'account_tree', prompt: 'Generer un diagramme UML pertinent' },
]

export default function AiToolbar({ visible, onCommand, isGenerating, onCancel }: AiToolbarProps) {
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  if (!visible) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onCommand(input.trim())
      setInput('')
      setExpanded(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[680px] px-4">
      {expanded ? (
        <form onSubmit={handleSubmit} className="bg-white border border-ai-vibrant/30 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Icon name="auto_awesome" className="text-ai-vibrant text-[20px] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Demander a l'IA... (ex: Rediger cette section, Creer un tableau...)"
              className="flex-1 font-body-sm text-on-surface bg-transparent outline-none placeholder:text-on-surface-variant/50"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setExpanded(false)
                  setInput('')
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-ai-vibrant text-white px-3 py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-all disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  onCommand(a.prompt)
                  setExpanded(false)
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-studio border border-outline-variant text-label-sm font-label-sm text-on-surface-variant hover:border-ai-vibrant hover:text-ai-vibrant transition-colors"
              >
                <Icon name={a.icon} className="text-[14px]" />
                {a.label}
              </button>
            ))}
          </div>
        </form>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full bg-white border border-outline-variant rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 hover:border-ai-vibrant/40 hover:shadow-xl transition-all group"
        >
          <span className="w-8 h-8 rounded-lg bg-ai-vibrant flex items-center justify-center text-white shrink-0">
            <Icon name="auto_awesome" className="text-[18px]" />
          </span>
          <span className="flex-1 text-left font-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            Demander a l'IA...
          </span>
          <span className="font-label-sm text-[10px] text-on-surface-variant/50 px-1.5 py-0.5 rounded border border-outline-variant">/</span>
        </button>
      )}
    </div>
  )
}
