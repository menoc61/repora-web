import { useSyncExternalStore, useState, useCallback } from 'react'
import Icon from './Icon'
import { useNotificationStore } from '../stores/notificationStore'

export interface ToastNotification {
  id: string
  type: string
  title: string
  message: string
  timeout?: number
}

interface ToastItem extends ToastNotification {
  exiting?: boolean
}

let toasts: ToastItem[] = []
let listeners: Array<() => void> = []
let counter = 0

const toastStore = {
  getSnapshot: () => toasts,
  subscribe: (cb: () => void) => {
    listeners = [...listeners, cb]
    return () => { listeners = listeners.filter(l => l !== cb) }
  },
}

function emit() { listeners.forEach(cb => cb()) }

export function notify(toast: Omit<ToastNotification, 'id'>) {
  const id = `t${++counter}`
  const t: ToastItem = { ...toast, id, timeout: toast.timeout ?? 6000 }
  toasts = [t, ...toasts].slice(0, 8)
  emit()
  if (t.timeout && t.timeout > 0) {
    setTimeout(() => {
      // Animate out then remove
      const idx = toasts.findIndex(x => x.id === t.id)
      if (idx >= 0) {
        toasts[idx] = { ...toasts[idx], exiting: true }
        emit()
        setTimeout(() => {
          toasts = toasts.filter(x => x.id !== t.id)
          emit()
        }, 250)
      }
    }, t.timeout)
  }
  const notificationType = (['info', 'success', 'warning', 'error'] as const).includes(toast.type as any)
    ? (toast.type as 'info' | 'success' | 'warning' | 'error')
    : 'info'
  useNotificationStore.getState().add({ type: notificationType, title: toast.title, message: toast.message })
}

export function dismissToast(id: string) {
  const idx = toasts.findIndex(t => t.id === id)
  if (idx >= 0) {
    toasts[idx] = { ...toasts[idx], exiting: true }
    emit()
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id)
      emit()
    }, 250)
  }
}

const BADGE_COLORS: Record<string, string> = {
  generation_started: 'bg-status-review/10 text-status-review border-status-review/20',
  generation_complete: 'bg-status-final/10 text-status-final border-status-final/20',
  validation: 'bg-ai-vibrant/10 text-ai-vibrant border-ai-vibrant/20',
  collaboration: 'bg-secondary/10 text-secondary border-secondary/20',
  error: 'bg-red-50 text-red-600 border-red-200',
}

const BADGE_ICONS: Record<string, string> = {
  generation_started: 'progress_activity',
  generation_complete: 'check_circle',
  validation: 'verified',
  collaboration: 'group',
  error: 'error_outline',
}

function getGroupKey(type: string): string {
  if (type.startsWith('generation_')) return 'generation'
  return type
}

export default function ToastContainer() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot)

  if (items.length === 0) return null

  // Group toasts of the same type
  const groups = items.reduce<Record<string, ToastItem[]>>((acc, t) => {
    const key = getGroupKey(t.type)
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 w-96 max-w-[calc(100vw-3rem)]">
      {Object.entries(groups).map(([, group]) => {
        const isGrouped = group.length > 1
        return group.map((t, i) => (
          <div
            key={t.id}
            className={`bg-white border border-outline-variant rounded-lg shadow-lg p-4 flex items-start gap-3 ${
              t.exiting ? 'animate-slide-out' : 'animate-slide-in'
            } ${isGrouped && i > 0 ? '-mt-2' : ''}`}
            style={isGrouped && i > 0 ? { boxShadow: 'none', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${BADGE_COLORS[t.type] ?? 'bg-surface text-secondary border-outline-variant'}`}>
              <Icon name={BADGE_ICONS[t.type] ?? 'notifications'} className="text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-md font-mono text-primary-container">{t.title}</p>
              <p className="font-body-sm text-secondary mt-0.5 line-clamp-2">{t.message}</p>
            </div>
            <button onClick={() => dismissToast(t.id)} className="shrink-0 p-1 text-outline hover:text-primary transition-colors">
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        ))
      })}
    </div>
  )
}
