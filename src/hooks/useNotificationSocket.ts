import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores'
import { notify } from '../components/Toast'

function getWsBase(): string {
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
}

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()
  const authenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!authenticated) {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
      return
    }

    function connect() {
      if (wsRef.current) return
      const base = getWsBase()
      try {
        const ws = new WebSocket(`${base}/notifications`)
        wsRef.current = ws

        ws.onopen = () => console.log('[Notif] Connected')

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
          reconnectRef.current = setTimeout(connect, 3000)
        }

        ws.onerror = () => { ws.close(); wsRef.current = null }
      } catch {
        reconnectRef.current = setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
    }
  }, [authenticated])
}
