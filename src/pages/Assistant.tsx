import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { api } from '../api/client'
import { notify } from '../components/Toast'
import { Button } from '../components/ui/button'
import Icon from '../components/Icon'

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
      const token = await api.getToken()
      const response = await fetch(`${api.getBaseUrl()}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, message: msg }),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.token) {
                  assistantContent += parsed.token
                  setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                    return updated
                  })
                }
              } catch { /* skip malformed lines */ }
            }
          }
        }
      }

      const sum = await api.get<{ context: string[]; features: string[]; constraints: string[]; actors: string[] }>(`/assistant/session/${sessionId}`)
      setSummary(sum)
    } catch {
      notify({ type: 'error', title: 'Erreur', message: 'Erreur de communication avec l\'assistant.' })
      setMessages(prev => prev.filter((m, i) => i < prev.length - 1 || m.content !== ''))
    }
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
          <Icon name="smart_toy" className="text-6xl text-ai-vibrant mb-4" />
          <h1 className="font-headline text-headline-md text-on-surface mb-4">Assistant Conversationnel</h1>
          <p className="font-body text-body-md text-on-surface-variant mb-6">
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
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${m.role === 'user' ? 'bg-ai-vibrant text-white' : 'bg-surface-studio border border-outline-variant'}`}>
                <p className="font-body text-body-sm whitespace-pre-wrap">{m.content || (loading && i === messages.length - 1 ? '...' : '')}</p>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content !== '' && (
            <div className="flex justify-start">
              <div className="bg-surface-studio border border-outline-variant rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="smart_toy" className="text-[14px] text-ai-vibrant animate-pulse" />
                  <span className="font-label text-label-sm text-on-surface-variant">Reflexion en cours...</span>
                </div>
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-studio font-body text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-ai-vibrant/30 focus:border-ai-vibrant transition-all"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Icon name="send" className="text-[14px] mr-1" /> Envoyer
          </Button>
          <Button variant="outline" onClick={handleGenerate} disabled={loading}>
            <Icon name="auto_fix_high" className="text-[14px] mr-1" /> Generer
          </Button>
        </div>
      </div>
      {summary && (
        <div className="w-80 border-l border-outline-variant p-4 overflow-y-auto bg-surface-container-low">
          <h3 className="font-headline text-headline-sm text-on-surface mb-3 flex items-center gap-2">
            <Icon name="info" className="text-[14px]" /> Informations collectees
          </h3>
          {summary.context.length > 0 && (
            <div className="mb-4">
              <h4 className="font-label text-label-sm text-on-surface-variant uppercase mb-1">Contexte</h4>
              {summary.context.map((item, i) => <p key={i} className="font-body text-body-sm text-on-surface mb-1">{item}</p>)}
            </div>
          )}
          {summary.features.length > 0 && (
            <div className="mb-4">
              <h4 className="font-label text-label-sm text-on-surface-variant uppercase mb-1">Fonctionnalites</h4>
              {summary.features.map((item, i) => <p key={i} className="font-body text-body-sm text-on-surface mb-1">{item}</p>)}
            </div>
          )}
          {summary.constraints.length > 0 && (
            <div className="mb-4">
              <h4 className="font-label text-label-sm text-on-surface-variant uppercase mb-1">Contraintes</h4>
              {summary.constraints.map((item, i) => <p key={i} className="font-body text-body-sm text-on-surface mb-1">{item}</p>)}
            </div>
          )}
          {summary.actors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-label text-label-sm text-on-surface-variant uppercase mb-1">Acteurs</h4>
              {summary.actors.map((item, i) => <p key={i} className="font-body text-body-sm text-on-surface mb-1">{item}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
