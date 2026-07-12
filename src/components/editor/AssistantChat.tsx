import { useState, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from '../Icon'
import { useAssistantChat } from '../../hooks/useAssistantChat'

interface AssistantChatProps {
  projectId?: string
  documentContext?: string
}

const QUICK_COMMANDS = [
  { label: 'Rediger', icon: 'auto_awesome', prompt: 'Rediger le contenu de cette section' },
  { label: 'Ameliorer', icon: 'edit_note', prompt: 'Ameliorer et reformuler le texte' },
  { label: 'Resumer', icon: 'summarize', prompt: 'Resumer en 2-3 phrases' },
  { label: 'Tableau', icon: 'table_chart', prompt: 'Generer un tableau structure pour cette section' },
  { label: 'UML', icon: 'account_tree', prompt: 'Generer un diagramme UML pertinent' },
]

export default function AssistantChat({ projectId, documentContext }: AssistantChatProps) {
  const {
    messages,
    input,
    setInput,
    loading,
    sessionId,
    summary,
    bottomRef,
    startSession,
    sendMessage,
    sendCommand,
    cancel,
    clearMessages,
  } = useAssistantChat({ projectId, documentContext })

  const [showCommands, setShowCommands] = useState(false)

  useEffect(() => {
    if (!sessionId && projectId) {
      startSession()
    }
  }, [sessionId, projectId, startSession])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-ai-vibrant flex items-center justify-center">
            <Icon name="auto_awesome" className="text-[12px] text-white" />
          </span>
          <span className="font-label-sm text-on-surface">Assistant</span>
        </div>
        {sessionId && (
          <button
            onClick={() => { clearMessages(); startSession() }}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title="Nouvelle conversation"
          >
            <Icon name="add" className="text-[16px]" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                m.role === 'user'
                  ? 'bg-ai-vibrant text-white'
                  : 'bg-surface-container-low border border-outline-variant text-on-surface'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name="smart_toy" className="text-[10px] text-ai-vibrant" />
                  <span className="text-[10px] font-label-sm text-ai-vibrant opacity-70">IA</span>
                </div>
              )}
              {m.role === 'assistant' ? (
                <div className="text-body-sm leading-relaxed prose prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-on-surface prose-headings:mt-3 prose-headings:mb-1
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                  prose-p:text-body-sm prose-p:my-1
                  prose-ul:my-1 prose-ul:pl-4 prose-li:text-body-sm
                  prose-ol:my-1 prose-ol:pl-4
                  prose-strong:font-bold prose-strong:text-on-surface
                  prose-code:text-xs prose-code:bg-surface-container-high prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-surface-container-high prose-pre:border prose-pre:border-outline-variant prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
                  prose-table:text-xs prose-table:border-collapse
                  prose-th:bg-surface-container-high prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:font-bold prose-th:border prose-th:border-outline-variant
                  prose-td:px-2 prose-td:py-1 prose-td:border prose-td:border-outline-variant
                  prose-blockquote:border-l-2 prose-blockquote:border-ai-vibrant prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-on-surface-variant
                  prose-a:text-ai-vibrant prose-a:underline
                  prose-hr:border-outline-variant prose-hr:my-3
                ">
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content || ''}</Markdown>
                </div>
              ) : (
                <p className="text-body-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}
              {m.role === 'assistant' && !m.content && loading && i === messages.length - 1 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1 h-1 rounded-full bg-ai-vibrant animate-pulse" />
                  <span className="w-1 h-1 rounded-full bg-ai-vibrant animate-pulse [animation-delay:0.2s]" />
                  <span className="w-1 h-1 rounded-full bg-ai-vibrant animate-pulse [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Extracted info (when available) */}
      {summary && (summary.context.length > 0 || summary.features.length > 0) && (
        <div className="mx-3 mb-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon name="info" className="text-[10px] text-on-surface-variant" />
            <span className="text-[10px] font-label-sm text-on-surface-variant uppercase">Contexte extrait</span>
          </div>
          <div className="space-y-1">
            {summary.context.slice(0, 2).map((item, i) => (
              <p key={i} className="text-[11px] text-on-surface-variant leading-snug">{item}</p>
            ))}
            {summary.features.slice(0, 2).map((item, i) => (
              <p key={`f-${i}`} className="text-[11px] text-on-surface-variant leading-snug">{item}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quick commands */}
      {showCommands && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => { sendCommand(cmd.prompt); setShowCommands(false) }}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-studio border border-outline-variant text-[10px] font-label-sm text-on-surface-variant hover:border-ai-vibrant hover:text-ai-vibrant transition-colors disabled:opacity-40"
            >
              <Icon name={cmd.icon} className="text-[10px]" />
              {cmd.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-1 border-t border-outline-variant">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCommands(!showCommands)}
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
              showCommands ? 'bg-ai-vibrant text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
            title="Commandes rapides"
          >
            <Icon name="bolt" className="text-[14px]" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Poser une question..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-body-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-ai-vibrant transition-colors"
            disabled={loading}
          />
          {loading ? (
            <button
              type="button"
              onClick={cancel}
              className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-500/20 transition-colors"
              title="Arreter"
            >
              <Icon name="stop" className="text-[14px]" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-7 h-7 rounded-lg bg-ai-vibrant text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-all disabled:opacity-40"
            >
              <Icon name="send" className="text-[14px]" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
