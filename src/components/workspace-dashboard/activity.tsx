import type { ReactNode } from 'react'

export interface BackendActivityItem {
  user?: string
  action?: string
  document?: string
  comment?: string
  timestamp?: string
  type?: string
  message?: string
  [k: string]: unknown
}

export interface UIActivityItem {
  icon: string
  bg: string
  c: string
  t: ReactNode
  sub?: string
  time: string
}

export function getTimeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Actif'
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}j`
  } catch {
    return ''
  }
}

export function mapActivityItem(item: BackendActivityItem): UIActivityItem {
  const user = item.user ?? 'Utilisateur'
  const document = item.document ?? item.message ?? 'un document'
  const action = item.action ?? item.type ?? 'edit'
  const rawTime = item.timestamp ?? ''

  if (action === 'comment' || action === 'comment_added') {
    return {
      icon: 'person',
      bg: 'bg-ai-glow',
      c: 'text-ai-vibrant',
      t: <><span className="font-bold">{user}</span> a laisse des commentaires sur <span className="text-ai-vibrant font-semibold">{document}</span></>,
      sub: item.comment ? `"${item.comment}"` : undefined,
      time: getTimeAgo(rawTime),
    }
  }
  if (action === 'validate' || action === 'validation') {
    return {
      icon: 'check_circle',
      bg: 'bg-status-final/10',
      c: 'text-status-final',
      t: <><span className="font-bold">{user}</span> a valide dans <span className="text-ai-vibrant font-semibold">{document}</span></>,
      time: getTimeAgo(rawTime),
    }
  }
  return {
    icon: 'edit',
    bg: 'bg-status-review/10',
    c: 'text-status-review',
    t: <><span className="font-bold">{user}</span> modifie actuellement <span className="text-ai-vibrant font-semibold">{document}</span></>,
    time: rawTime ? getTimeAgo(rawTime) : 'Actif',
  }
}
