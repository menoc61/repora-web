import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../stores'
import { notify } from '../components/Toast'
import { wsUrl, type WsStatus } from '../utils/ws'

const MAX_RETRIES = 10

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const retryCountRef = useRef(0)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  const [status, setStatus] = useState<WsStatus>('disconnected')

  useEffect(() => {
    if (!authenticated) {
      setStatus('disconnected')
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
      return
    }

    let cancelled = false
    retryCountRef.current = 0

    function connect() {
      if (cancelled || wsRef.current) return
      setStatus('connecting')

      try {
        const ws = new WebSocket(wsUrl('/notifications'))
        wsRef.current = ws

        ws.onopen = () => {
          if (cancelled) { ws.close(); return }
          retryCountRef.current = 0
          setStatus('connected')
        }

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data)
            notify({
              type: data.type ?? 'info',
              title: data.title ?? 'Notification',
              message: data.message ?? '',
            })
          } catch { /* ignore non-JSON messages */ }
        }

        ws.onclose = () => {
          wsRef.current = null
          if (cancelled) return

          if (retryCountRef.current >= MAX_RETRIES) {
            setStatus('error')
            return
          }

          retryCountRef.current++
          setStatus('reconnecting')
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000)
          reconnectRef.current = setTimeout(connect, delay)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        if (cancelled) return

        if (retryCountRef.current >= MAX_RETRIES) {
          setStatus('error')
          return
        }

        retryCountRef.current++
        setStatus('reconnecting')
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000)
        reconnectRef.current = setTimeout(connect, delay)
      }
    }

    connect()
    return () => {
      cancelled = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
    }
  }, [authenticated])

  return status
}
