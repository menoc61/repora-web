import { useAuthStore } from '../stores'

const BASE = (import.meta as any).env?.VITE_API_BASE ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  return useAuthStore.getState().token
}

function clearAuth() {
  useAuthStore.getState().logout()
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Set to true for blob/binary responses (PDF/DOCX export) */
  blob?: boolean
  /** Set to true to skip auth header (public endpoints like /validate) */
  public?: boolean
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  }
  if (token && !opts.public) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? (opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body)) : undefined,
    signal: opts.signal,
  })

  if (res.status === 401) {
    if (!opts.public) clearAuth()
    throw new ApiError(401, 'unauthorized', 'Session expired')
  }

  if (opts.blob) {
    if (!res.ok) throw new ApiError(res.status, 'request_failed', `Request failed: ${res.status}`)
    return (await res.blob()) as unknown as T
  }

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = (payload as any)?.error ?? {}
    throw new ApiError(res.status, err.code ?? 'request_failed', err.message ?? `Request failed: ${res.status}`)
  }
  return (payload as any)?.data ?? payload
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
  getBlob: (path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<Blob>(path, { ...opts, method: 'GET', blob: true }),
  getToken: () => getToken(),
  getBaseUrl: () => BASE,
}

/** SSE helper for document streaming — returns an EventSource-like async iterator. */
export async function* sseStream(path: string, opts?: { public?: boolean }): AsyncGenerator<Record<string, unknown>> {
  const authorization = opts?.public ? null : getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
    },
  })
  if (!res.ok || !res.body) {
    throw new ApiError(res.status, 'stream_failed', `Stream failed: ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const evt of events) {
        const dataLine = evt.split('\n').find((l) => l.startsWith('data:'))
        if (dataLine) {
          const json = dataLine.slice(5).trim()
          if (json && json !== '[DONE]') {
            try {
              yield JSON.parse(json)
            } catch {
              /* ignore keepalive comments */
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
