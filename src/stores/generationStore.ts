import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GenerationSession {
  sessionId: string
  projectId: string
  documentId: string
  title: string
  startedAt: string
  status: 'generating' | 'completed' | 'failed'
  agentCount?: number
}

interface State {
  sessions: GenerationSession[]
}

interface Actions {
  startSession(s: Omit<GenerationSession, 'sessionId' | 'status' | 'startedAt'>): string
  updateSession(id: string, p: Partial<GenerationSession>): void
  completeSession(id: string): void
  failSession(id: string): void
  removeSession(id: string): void
}

export const useGenerationStore = create<State & Actions>()(
  persist(
    (set) => ({
      sessions: [],
      startSession: (s) => {
        const id = crypto.randomUUID()
        set((st) => ({ sessions: [...st.sessions, { ...s, sessionId: id, status: 'generating', startedAt: new Date().toISOString() }] }))
        return id
      },
      updateSession: (id, p) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.sessionId === id ? { ...s, ...p } : s)) })),
      completeSession: (id) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.sessionId === id ? { ...s, status: 'completed' } : s)) })),
      failSession: (id) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.sessionId === id ? { ...s, status: 'failed' } : s)) })),
      removeSession: (id) =>
        set((st) => ({ sessions: st.sessions.filter((s) => s.sessionId !== id) })),
    }),
    { name: 'repora-generations' },
  ),
)
