import { useState } from 'react'
import Icon from './Icon'
import { useNotificationStore, type AppNotification } from '../stores/notificationStore'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_ICONS: Record<AppNotification['type'], string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  info: 'bg-ai-vibrant/10 text-ai-vibrant border-ai-vibrant/20',
  success: 'bg-status-final/10 text-status-final border-status-final/20',
  warning: 'bg-status-review/10 text-status-review border-status-review/20',
  error: 'bg-red-50 text-red-600 border-red-200',
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr })
  } catch {
    return iso
  }
}

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const togglePanel = useNotificationStore((s) => s.togglePanel)

  return (
    <button
      className="relative text-on-surface-variant hover:text-primary transition-colors"
      onClick={togglePanel}
      aria-label="Notifications"
    >
      <Icon name="notifications" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default function NotificationCenter() {
  const panelOpen = useNotificationStore((s) => s.panelOpen)
  const closePanel = useNotificationStore((s) => s.closePanel)
  const { notifications, markAllRead, clearAll, markRead, remove } = useNotificationStore()
  const hasUnread = notifications.some((n) => !n.read)

  if (!panelOpen) return null

  return (
    <div className="fixed inset-0 z-40" onClick={closePanel}>
      <div
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-outline-variant overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-md text-headline-md text-primary">Centre de notifications</h2>
          <button onClick={closePanel} className="p-1 text-outline hover:text-primary transition-colors">
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant shrink-0">
          {hasUnread && (
            <button
              onClick={markAllRead}
              className="font-label-sm text-label-sm text-ai-vibrant hover:underline"
            >
              Marquer tout lu
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="font-label-sm text-label-sm text-error hover:underline"
            >
              Effacer tout
            </button>
          )}
          <div className="flex-1" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-6 text-center font-body-sm text-body-sm text-on-surface-variant italic">
              Aucune notification.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors ${n.read ? 'opacity-60' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${TYPE_COLORS[n.type]}`}
                  >
                    <Icon name={TYPE_ICONS[n.type]} className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-ai-vibrant shrink-0" />}
                      <span className="font-label-md font-mono text-primary-container truncate">{n.title}</span>
                    </div>
                    <p className="font-body-sm text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="font-label-sm text-label-sm text-outline mt-1">{relativeTime(n.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => remove(n.id)}
                    className="shrink-0 p-1 text-outline hover:text-primary transition-colors"
                  >
                    <Icon name="close" className="text-sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
