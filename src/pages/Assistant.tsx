import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { api } from '../api/client'
import { notify } from '../components/Toast'
import { Button } from '../components/ui/button'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantPage() {
  const { id: projectId } = useParams({ from: '/assistant/$id' as any })
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [summary, setSummary] = useState<{
    context: string[]
    features: string[]
    constraints: string[]
    actors: string[]
  } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startSession = async () => {
    setLoading(true)
    try {
      const res = await api.post<{ sessionId: string; reply: string }>('/assistant/start', { projectId })
      setSessionId(res.sessionId)
      setMessages([{ role: 'assistant', content: res.reply }])
      setStarted(true)
    } catch { notify({ type: 'error', title: 'Erreur', message: 'Impossible de demarrer la session.' }) }
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.post<{ reply: string; extraction?: boolean }>('/assistant/chat', { sessionId, message: msg })
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
      if (res.extraction) {
        const sum = await api.get<{ context: string[]; features: string[]; constraints: string[]; actors: string[] }>(`/assistant/session/${sessionId}`)
        setSummary(sum)
      }
    } catch { notify({ type: 'error', title: 'Erreur', message: 'Erreur de communication avec l\'assistant.' }) }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await api.post<{ document_id: string }>('/assistant/generate', { sessionId })
      navigate({ to: '/editor', search: { id: res.document_id } })
    } catch { notify({ type: 'error', title: 'Erreur', message: 'La generation du document a echoue.' }) }
    setLoading(false)
  }

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-4">Assistant Conversationnel</h1>
          <p className="text-muted-foreground mb-6">
            Laissez-moi vous guider pour definir les besoins de votre projet a travers un dialogue structure.
          </p>
          <Button onClick={startSession} disabled={loading}>
            {loading ? 'Demarrage...' : 'Commencer le dialogue'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <p className="text-sm animate-pulse">Reflexion en cours...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Decrivez votre projet..."
            className="flex-1 px-4 py-2 rounded-lg border bg-background"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            Envoyer
          </Button>
          <Button variant="outline" onClick={handleGenerate} disabled={loading}>
            Generer
          </Button>
        </div>
      </div>
      {summary && (
        <div className="w-80 border-l p-4 overflow-y-auto bg-muted/30">
          <h3 className="font-semibold mb-3">Informations collectees</h3>
          {summary.context.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Contexte</h4>
              {summary.context.map((item, i) => <p key={i} className="text-sm mb-1">{item}</p>)}
            </div>
          )}
          {summary.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Fonctionnalites</h4>
              {summary.features.map((item, i) => <p key={i} className="text-sm mb-1">{item}</p>)}
            </div>
          )}
          {summary.constraints.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Contraintes</h4>
              {summary.constraints.map((item, i) => <p key={i} className="text-sm mb-1">{item}</p>)}
            </div>
          )}
          {summary.actors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Acteurs</h4>
              {summary.actors.map((item, i) => <p key={i} className="text-sm mb-1">{item}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
