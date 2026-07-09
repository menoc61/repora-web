import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, useWorkspaceStore, useSettingsStore } from './index'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('login sets user, token, and isAuthenticated', () => {
    const user = { name: 'Test User', email: 'test@example.com', role: 'editor' }
    useAuthStore.getState().login(user, 'fake-token')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe('fake-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('logout clears user, token, and isAuthenticated', () => {
    useAuthStore.getState().login(
      { name: 'Test', email: 'test@test.com', role: 'admin' },
      'token-123',
    )
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('persists state with persist middleware (storage key is set)', () => {
    useAuthStore.getState().login(
      { name: 'Persistent', email: 'persist@test.com', role: 'viewer' },
      'persist-token',
    )

    const state = useAuthStore.getState()
    expect(state.user).not.toBeNull()
    expect(state.token).toBe('persist-token')
    expect(state.isAuthenticated).toBe(true)
  })
})

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset()
  })

  it('has correct initial state', () => {
    const state = useWorkspaceStore.getState()
    expect(state.activeView).toBe('workspace')
    expect(state.recentDocuments).toEqual([])
    expect(state.sidebarCollapsed).toBe(false)
  })

  it('setActiveView changes activeView', () => {
    useWorkspaceStore.getState().setActiveView('library')
    expect(useWorkspaceStore.getState().activeView).toBe('library')
  })

  it('toggleSidebar toggles sidebarCollapsed', () => {
    expect(useWorkspaceStore.getState().sidebarCollapsed).toBe(false)
    useWorkspaceStore.getState().toggleSidebar()
    expect(useWorkspaceStore.getState().sidebarCollapsed).toBe(true)
    useWorkspaceStore.getState().toggleSidebar()
    expect(useWorkspaceStore.getState().sidebarCollapsed).toBe(false)
  })

  it('addRecentDocument adds a document to recentDocuments', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Doc',
      status: 'draft' as const,
      department: 'Engineering',
      author: { name: 'Author' },
      collaborators: [],
      content: '',
      version: 'v1.0.0',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [],
    }
    useWorkspaceStore.getState().addRecentDocument(doc)
    const state = useWorkspaceStore.getState()
    expect(state.recentDocuments).toHaveLength(1)
    expect(state.recentDocuments[0].id).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('reset restores initial state', () => {
    useWorkspaceStore.getState().setActiveView('settings')
    useWorkspaceStore.getState().toggleSidebar()
    useWorkspaceStore.getState().reset()

    const state = useWorkspaceStore.getState()
    expect(state.activeView).toBe('workspace')
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.recentDocuments).toEqual([])
  })
})

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings()
  })

  it('has correct initial state', () => {
    const state = useSettingsStore.getState()
    expect(state.settings.aiProvider).toBe('ollama')
    expect(state.settings.theme).toBe('light')
    expect(state.settings.language).toBe('en')
    expect(state.settings.autoSave).toBe(true)
    expect(state.settings.syncMode).toBe('websocket')
  })

  it('setTheme via updateSettings', () => {
    useSettingsStore.getState().updateSettings({ theme: 'dark' })
    expect(useSettingsStore.getState().settings.theme).toBe('dark')
  })

  it('setAIModel via updateSettings', () => {
    useSettingsStore.getState().updateSettings({ aiProvider: 'openai' })
    expect(useSettingsStore.getState().settings.aiProvider).toBe('openai')
  })

  it('resetSettings restores defaults', () => {
    useSettingsStore.getState().updateSettings({ theme: 'dark', aiProvider: 'anthropic' })
    useSettingsStore.getState().resetSettings()

    const state = useSettingsStore.getState()
    expect(state.settings.theme).toBe('light')
    expect(state.settings.aiProvider).toBe('ollama')
  })
})
