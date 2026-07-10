import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface State {
  notifications: AppNotification[]
  unreadCount: number
  panelOpen: boolean
}

interface Actions {
  add(n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void
  markRead(id: string): void
  markAllRead(): void
  remove(id: string): void
  clearAll(): void
  togglePanel(): void
  closePanel(): void
}

export const useNotificationStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      panelOpen: false,
      add: (n) => {
        const id = crypto.randomUUID()
        set((s) => ({
          notifications: [
            { id, ...n, timestamp: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 50),
          unreadCount: s.unreadCount + 1,
        }))
      },
      markRead: (id) =>
        set((s) => {
          const ns = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          )
          return { notifications: ns, unreadCount: ns.filter((n) => !n.read).length }
        }),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      remove: (id) =>
        set((s) => {
          const ns = s.notifications.filter((n) => n.id !== id)
          return { notifications: ns, unreadCount: ns.filter((n) => !n.read).length }
        }),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      closePanel: () => set({ panelOpen: false }),
    }),
    { name: 'repora-notifications', partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }) },
  ),
)
