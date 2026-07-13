const BASE = (import.meta as any).env?.VITE_API_BASE ?? '/api'

export function getWsBase(): string {
  const { protocol, host } = window.location
  const isHttps = protocol === 'https:'
  return `${isHttps ? 'wss' : 'ws'}://${host}`
}

export function wsUrl(path: string): string {
  return `${getWsBase()}${path}`
}

export function collabWsUrl(): string {
  return `${getWsBase()}/collab`
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
