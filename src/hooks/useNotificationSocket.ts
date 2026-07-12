import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores'
import { notify } from '../components/Toast'

function getWsBase(): string {
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
}

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  const retryCountRef = useRef(0)

  useEffect(() => {
    if (!authenticated) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
      return
    }

    let cancelled = false

    function connect() {
      if (cancelled || wsRef.current) return
      const base = getWsBase()
      try {
        const ws = new WebSocket(`${base}/notifications`)
        wsRef.current = ws

        ws.onopen = () => {
          retryCountRef.current = 0
        }

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data)
            notify({
              type: data.type ?? 'info',
              title: data.title ?? 'Notification',
              message: data.message ?? '',
            })
          } catch {}
        }

        ws.onclose = () => {
          wsRef.current = null
          if (cancelled) return
          retryCountRef.current++
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000)
          reconnectRef.current = setTimeout(connect, delay)
        }

        ws.onerror = () => {
          ws.close()
          wsRef.current = null
        }
      } catch {
        if (cancelled) return
        retryCountRef.current++
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
}
