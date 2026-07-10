import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Document, ViewType, Settings } from '../schemas'

// ── Workspace State ──

export interface IWorkspaceState {
  activeView: ViewType
  recentDocuments: Document[]
  sidebarCollapsed: boolean
}

export interface IWorkspaceActions {
  setActiveView: (view: ViewType) => void
  toggleSidebar: () => void
  addRecentDocument: (doc: Document) => void
  reset: () => void
}

class WorkspaceStore implements IWorkspaceState {
  activeView: ViewType = 'workspace'
  recentDocuments: Document[] = []
  sidebarCollapsed = false

  constructor(
    private readonly _set: (fn: (state: IWorkspaceState) => Partial<IWorkspaceState>) => void,
  ) {}

  setActiveView(view: ViewType): void {
    this._set(() => ({ activeView: view }))
  }

  toggleSidebar(): void {
    this._set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
  }

  addRecentDocument(doc: Document): void {
    this._set((s) => ({
      recentDocuments: [doc, ...s.recentDocuments.filter((d) => d.id !== doc.id)].slice(0, 10),
    }))
  }

  reset(): void {
    this._set(() => ({
      activeView: 'workspace',
      recentDocuments: [],
      sidebarCollapsed: false,
    }))
  }
}

function createWorkspaceStore() {
  return create<IWorkspaceState & IWorkspaceActions>()((set) => {
    const store = new WorkspaceStore(set)
    return {
      activeView: store.activeView,
      recentDocuments: store.recentDocuments,
      sidebarCollapsed: store.sidebarCollapsed,
      setActiveView: store.setActiveView.bind(store),
      toggleSidebar: store.toggleSidebar.bind(store),
      addRecentDocument: store.addRecentDocument.bind(store),
      reset: store.reset.bind(store),
    }
  })
}

export const useWorkspaceStore = createWorkspaceStore()

// ── Auth State ──

export interface IAuthState {
  user: { name: string; email: string; role: string } | null
  token: string | null
  isAuthenticated: boolean
}

export interface IAuthActions {
  login: (user: IAuthState['user'], token: string) => void
  logout: () => void
}

class AuthStore implements IAuthState {
  user: IAuthState['user'] | null = null
  token: string | null = null
  isAuthenticated = false

  constructor(
    private readonly _set: (fn: (state: IAuthState) => Partial<IAuthState>) => void,
  ) {}

  login(user: IAuthState['user'], token: string): void {
    this._set(() => ({ user, token, isAuthenticated: true }))
  }

  logout(): void {
    this._set(() => ({ user: null, token: null, isAuthenticated: false }))
  }
}

function createAuthStore() {
  return create<IAuthState & IAuthActions>()(
    persist(
      (set) => {
        const store = new AuthStore(set)
        return {
          user: store.user,
          token: store.token,
          isAuthenticated: store.isAuthenticated,
          login: store.login.bind(store),
          logout: store.logout.bind(store),
        }
      },
      { name: 'repora-auth' },
    ),
  )
}

export const useAuthStore = createAuthStore()

// ── Settings State ──

export interface ISettingsState {
  settings: Settings
}

export interface ISettingsActions {
  updateSettings: (partial: Partial<Settings>) => void
  resetSettings: () => void
}

class SettingsStore implements ISettingsState {
  settings: Settings = {
    aiProvider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 4096,
    theme: 'light',
    language: 'en',
    autoSave: true,
    syncMode: 'websocket',
  }

  constructor(
    private readonly _set: (fn: (state: ISettingsState) => Partial<ISettingsState>) => void,
  ) {}

  updateSettings(partial: Partial<Settings>): void {
    this._set((s) => ({ settings: { ...s.settings, ...partial } satisfies Settings }))
  }

  resetSettings(): void {
    this._set(() => ({
      settings: { aiProvider: 'ollama', ollamaUrl: 'http://localhost:11434', temperature: 0.7, maxTokens: 4096, theme: 'light', language: 'en', autoSave: true, syncMode: 'websocket' },
    }))
  }
}

function createSettingsStore() {
  return create<ISettingsState & ISettingsActions>()(
    persist(
      (set) => {
        const store = new SettingsStore(set)
        return {
          settings: store.settings,
          updateSettings: store.updateSettings.bind(store),
          resetSettings: store.resetSettings.bind(store),
        }
      },
      { name: 'repora-settings' },
    ),
  )
}

export const useSettingsStore = createSettingsStore()
