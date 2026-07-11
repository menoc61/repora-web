import { useState, useEffect } from 'react'

type CollabStatus = 'connecting' | 'connected' | 'disconnected'

export function useCollabStatus(provider: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void; connected: boolean } | null): CollabStatus {
  const [status, setStatus] = useState<CollabStatus>(provider?.connected ? 'connected' : 'connecting')

  useEffect(() => {
    if (!provider) return

    const onSync = () => setStatus('connected')
    const onDisconnect = () => setStatus('disconnected')
    const onReconnect = () => setStatus('connecting')

    provider.on('sync', onSync)
    provider.on('disconnect', onDisconnect)
    provider.on('reconnect', onReconnect)

    setStatus(provider.connected ? 'connected' : 'connecting')

    return () => {
      provider.off('sync', onSync)
      provider.off('disconnect', onDisconnect)
      provider.off('reconnect', onReconnect)
    }
  }, [provider])

  return status
}
