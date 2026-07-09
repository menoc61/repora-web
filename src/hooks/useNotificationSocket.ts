import { useEffect, useRef } from 'react'
import { notify } from '../components/Toast'

function getWsBase(): string {
  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? '/api'
  if (apiBase.startsWith('http')) {
    return apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
  }
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`
}

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function connect() {
      const base = getWsBase()
      try {
        const ws = new WebSocket(`${base}/notifications`)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('[Notif] Connected to notification server')
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
          reconnectRef.current = setTimeout(connect, 3000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        reconnectRef.current = setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])
}
