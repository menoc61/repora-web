import '@testing-library/jest-dom'

// jsdom's localStorage can be unreliable under Vitest; provide a deterministic
// mock so zustand persist (used by the auth/settings/generation stores) works
// in tests. Browser localStorage is unaffected.
class LocalStorageMock {
  private store: Record<string, string> = {}
  getItem(key: string) {
    return key in this.store ? this.store[key] : null
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value)
  }
  removeItem(key: string) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
  key(i: number) {
    return Object.keys(this.store)[i] ?? null
  }
  get length() {
    return Object.keys(this.store).length
  }
}

const storageMock = new LocalStorageMock()
Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true })
;(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = storageMock
