import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '../api/client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseAssistantChatOptions {
  projectId?: string
  /** Document context injected into the system prompt for richer responses */
  documentContext?: string
}

export function useAssistantChat({ projectId, documentContext }: UseAssistantChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    context: string[]
    features: string[]
    constraints: string[]
    actors: string[]
  } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startSession = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.post<{ sessionId: string; reply: string }>('/assistant/start', { projectId })
      setSessionId(res.sessionId)
      setMessages([{ role: 'assistant', content: res.reply }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Impossible de demarrer la session. Reessayez.' }])
    }
    setLoading(false)
  }, [projectId])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || !sessionId) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const token = api.getToken()
      abortRef.current = new AbortController()
      const response = await fetch(`${api.getBaseUrl()}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, message: msg }),
        signal: abortRef.current.signal,
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

      // Refresh summary
      const sum = await api.get<{ context: string[]; features: string[]; constraints: string[]; actors: string[] }>(
        `/assistant/session/${sessionId}`
      )
      setSummary(sum)
    } catch {
      setMessages(prev => prev.filter((m, i) => i < prev.length - 1 || m.content !== ''))
    }
    setLoading(false)
  }, [input, sessionId])

  const sendCommand = useCallback(async (command: string) => {
    if (!sessionId) return
    setInput('')
    setLoading(true)

    try {
      const token = api.getToken()
      abortRef.current = new AbortController()
      const response = await fetch(`${api.getBaseUrl()}/ai/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command, context: documentContext }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('AI command failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let content = ''

      setMessages(prev => [...prev, { role: 'user', content: `/ ${command}` }, { role: 'assistant', content: '' }])

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
                  content += parsed.token
                  setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content }
                    return updated
                  })
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch {
      setMessages(prev => prev.filter((m, i) => i < prev.length - 1 || m.content !== ''))
    }
    setLoading(false)
  }, [sessionId, documentContext])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setSummary(null)
  }, [])

  return {
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
  }
}
