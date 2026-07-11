import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { api, sseStream } from '../api/client'
import { useAuthStore } from '../stores'
import type { Document, Metrics, Template, Collaborator, DocumentFilters } from '../schemas'

// ── Hermes SSE Event Types (aligned with backend HermesEvent union) ──

export interface HermesAgentStatus {
  type: 'agent_status'
  agent: string
  status: string
  section?: string
  section_title?: string
  sections_created?: number
  [key: string]: unknown
}

export interface HermesToken {
  type: 'token'
  token: string
  agent: string
  [key: string]: unknown
}

export interface HermesToolCall {
  type: 'tool_call'
  agent: string
  tool: string
  args: unknown
  [key: string]: unknown
}

export interface HermesToolResult {
  type: 'tool_result'
  agent: string
  tool: string
  result: unknown
  [key: string]: unknown
}

export interface HermesSectionComplete {
  type: 'section_complete'
  section_id?: string
  title?: string
  [key: string]: unknown
}

export interface HermesContextUpdated {
  type: 'context_updated'
  agent: string
  key: string
  value: unknown
  [key: string]: unknown
}

export interface HermesGenerationError {
  type: 'generation_error'
  agent: string
  message: string
  error_type?: string
  section_id?: string
  [key: string]: unknown
}

export interface HermesDone {
  type: 'done'
  document_id?: string
  agent?: string
  [key: string]: unknown
}

export type HermesEvent =
  | HermesAgentStatus
  | HermesToken
  | HermesToolCall
  | HermesToolResult
  | HermesSectionComplete
  | HermesContextUpdated
  | HermesGenerationError
  | HermesDone

// ── Backend response shapes ──

interface BackendProject {
  id: string
  name: string
  status: string
  brief?: string
  documentId?: string | null
}

interface BackendSection {
  id: string
  title: string
  content: string
  status: string
}

interface BackendDocument {
  id: string
  projectId?: string | null
  status: string
  outline: Record<string, unknown>
  sections: BackendSection[]
}

interface BackendAgent {
  name: string
  provider: string
  enabled: boolean
  modelId?: string
  systemPrompt?: string
}

interface BackendMetrics {
  total_documents: number
  active_agents: number
  collaboration_score: number
  [k: string]: unknown
}

interface BackendLog {
  action: string
  target: string
}

interface BackendDocumentRow {
  id: string
  projectId: string
  projectName: string | null
  status: string
  outline: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  sectionCount: number
}

interface BackendGenerateResponse {
  document_id: string
  status: string
  prompt: string
}

interface BackendComment {
  id: string
  section_id: string
  document_id: string
  author_id: string
  author_name: string
  text: string
  resolved: boolean
  created_at: string
}

interface BackendRequirement {
  id: string
  project_id: string
  type: 'functional' | 'non_functional'
  text: string
  source_actor: string
  created_at: string
}

// ── Mappers: backend → frontend ──

const DEPARTMENTS = ['Legal', 'Engineering', 'Security', 'Product', 'Research', 'Operations'] as const

function hashDepartment(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return DEPARTMENTS[h % DEPARTMENTS.length]
}

function mapProjectToDocument(p: BackendProject): Document {
  const now = new Date().toISOString()
  return {
    id: p.documentId ?? p.id,
    projectId: p.id,
    title: p.name,
    status: (['draft', 'review', 'final', 'active', 'autonomous'].includes(p.status) ? p.status : 'draft') as Document['status'],
    department: hashDepartment(p.id),
    author: { name: 'Repora AI' },
    collaborators: [],
    content: p.brief ?? '',
    version: 'v1.0.0',
    createdAt: now,
    updatedAt: now,
    tags: [],
  }
}

function mapBackendDocument(d: BackendDocument): Document {
  const sections = d.sections ?? []
  const title = (d.outline?.title as string) ?? (sections[0]?.title ?? 'Untitled')
  return {
    id: d.id,
    projectId: d.projectId ?? undefined,
    title,
    status: (['draft', 'review', 'final', 'active', 'autonomous'].includes(d.status) ? d.status : 'draft') as Document['status'],
    department: hashDepartment(d.id),
    author: { name: 'Repora AI' },
    collaborators: [],
    content: sections.map((s) => s.content).join('\n\n'),
    version: 'v1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  }
}

function mapDocRowToDocument(d: BackendDocumentRow): Document {
  return {
    id: d.id,
    projectId: d.projectId,
    title: ((d.outline?.title as string) ?? d.projectName ?? 'Untitled') as string,
    status: (['draft', 'review', 'final', 'active', 'autonomous', 'archived'].includes(d.status) ? d.status : 'draft') as Document['status'],
    department: hashDepartment(d.projectId),
    author: { name: 'Repora AI' },
    collaborators: [],
    content: '',
    version: 'v1.0.0',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    tags: [],
  }
}

// ── Project Hooks ──

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const rows = await api.get<BackendProject[]>('/projects')
      return rows.map(mapProjectToDocument)
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const p = await api.get<BackendProject>(`/projects/${id}`)
      return mapProjectToDocument(p)
    },
    enabled: !!id,
  })
}

export function useRequirements(projectId: string | undefined) {
  return useQuery({
    queryKey: ['requirements', projectId],
    queryFn: async () => api.get<BackendRequirement[]>(`/projects/${projectId}/requirements`),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; brief?: string }) =>
      api.post<BackendProject>('/projects', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useGenerateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, prompt, templateId }: { projectId: string; prompt?: string; templateId?: string }) =>
      api.post<BackendGenerateResponse>(`/projects/${projectId}/generate`, { prompt: prompt ?? '', ...(templateId ? { templateId } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useAddRequirement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, ...payload }: { projectId: string; type: string; text: string; sourceActor?: string }) =>
      api.post<BackendRequirement>(`/projects/${projectId}/requirements`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['requirements', variables.projectId] })
    },
  })
}

// ── Document Hooks ──

export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      const qs = params.toString()
      const path = `/documents${qs ? `?${qs}` : ''}`

      const rows = await api.get<BackendDocumentRow[]>(path)
      let docs = rows.map(mapDocRowToDocument)
      if (filters?.department && filters.department !== 'all') docs = docs.filter((d) => d.department === filters.department)
      return docs
    },
  })
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const d = await api.get<BackendDocument>(`/documents/${id}`)
      return mapBackendDocument(d)
    },
    enabled: !!id,
  })
}

export function useDocumentStream(docId: string | undefined) {
  const [events, setEvents] = useState<HermesEvent[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!docId) {
      setEvents([])
      setIsStreaming(false)
      setError(null)
      return
    }

    cancelledRef.current = false
    setIsStreaming(true)
    setEvents([])
    setError(null)

    const run = async () => {
      try {
        for await (const evt of sseStream(`/documents/${docId}/stream`)) {
          if (cancelledRef.current) break
          setEvents((prev) => [...prev, evt as HermesEvent])
        }
      } catch (e) {
        if (!cancelledRef.current) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        if (!cancelledRef.current) {
          setIsStreaming(false)
        }
      }
    }
    run()

    return () => {
      cancelledRef.current = true
    }
  }, [docId])

  // ── Derived values from the event stream ──
  const lastEvent = events.length > 0 ? events[events.length - 1] : null

  const activeAgents = [...new Set(
    events
      .filter((e): e is HermesAgentStatus => e.type === 'agent_status' && (e as HermesAgentStatus).status !== 'done')
      .map((e) => e.agent),
  )]

  const agentStates: Record<string, { status: string; section?: string; sectionTitle?: string; tokenCount: number }> = {}
  for (const e of events) {
    if (e.type === 'agent_status') {
      const s = e as HermesAgentStatus
      agentStates[s.agent] = {
        status: s.status,
        section: s.section,
        sectionTitle: s.section_title,
        tokenCount: agentStates[s.agent]?.tokenCount ?? 0,
      }
    } else if (e.type === 'token') {
      const t = e as HermesToken
      if (agentStates[t.agent]) {
        agentStates[t.agent].status = 'writing'
        agentStates[t.agent].tokenCount += 1
      } else {
        agentStates[t.agent] = { status: 'writing', tokenCount: 1 }
      }
    } else if (e.type === 'generation_error') {
      const err = e as HermesGenerationError
      if (agentStates[err.agent]) {
        agentStates[err.agent].status = 'error'
      } else {
        agentStates[err.agent] = { status: 'error', tokenCount: 0 }
      }
    }
  }

  return { events, isStreaming, error, lastEvent, activeAgents, agentStates }
}

export function useUpsertDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.patch<{ ok: boolean }>(`/documents/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useComments(documentId: string | undefined) {
  return useQuery({
    queryKey: ['comments', documentId],
    queryFn: async () => api.get<BackendComment[]>(`/documents/${documentId}/comments`),
    enabled: !!documentId,
  })
}

export function useSaveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.patch<{ ok: boolean }>(`/documents/${id}`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export function useAcceptChanges() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.post<{ ok: boolean }>(`/documents/${id}/accept`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['document', id] })
    },
  })
}

export function useApplyPatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, sectionId, content }: { id: string; sectionId: string; content: string }) =>
      api.patch<{ ok: boolean }>(`/documents/${id}/patch`, { sectionId, content }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ documentId, ...payload }: { documentId: string; text: string; sectionId?: string }) =>
      api.post<BackendComment>(`/documents/${documentId}/comments`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.documentId] })
    },
  })
}

export function useResolveComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) =>
      api.patch<{ ok: boolean }>(`/comments/${id}`, { resolved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

// ── Analytics / Metrics Hooks ──

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<Metrics> => {
      try {
        const m = await api.get<BackendMetrics>('/admin/metrics')
        return {
          totalDocuments: m.total_documents ?? 0,
          activeAgents: m.active_agents ?? 0,
          collaborationScore: m.collaboration_score ?? 0,
          efficiencyIndex: m.collaboration_score ?? 0,
          aiUtilization: 0,
          topContributor: 'Autonomous Orchestrator',
        }
      } catch {
        return {
          totalDocuments: 0,
          activeAgents: 0,
          collaborationScore: 0,
          efficiencyIndex: 0,
          aiUtilization: 0,
          topContributor: '—',
        }
      }
    },
    staleTime: 30_000,
  })
}

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => api.get<BackendLog[]>('/admin/logs'),
  })
}

// ── Agent Hooks ──

export function useAgents(enabled?: boolean) {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => api.get<BackendAgent[]>('/admin/agents'),
    enabled: enabled !== false,
  })
}

export function usePatchAgent(enabled?: boolean) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, patch }: { name: string; patch: Partial<BackendAgent> }) =>
      api.patch<{ ok: boolean }>(`/admin/agents/${name}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

export function useTestAgent() {
  return useMutation({
    mutationFn: async ({ name, message }: { name: string; message: string }) =>
      api.post<{ reply: string }>(`/agents/${name}/test`, { message }),
  })
}

export function useEnableAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => api.post(`/agents/${name}/enable`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

export function useExportAgentConfig() {
  return useMutation({
    mutationFn: async (name: string) => api.get<Record<string, unknown>>(`/agents/${name}/export`),
  })
}

interface BackendTool {
  name: string
  config: Record<string, unknown>
}

export function useAgentTools(name: string | undefined) {
  return useQuery({
    queryKey: ['agent-tools', name],
    queryFn: async () => {
      const data = await api.get<{ agent: string; tools: BackendTool[] }>(`/agents/${name}/tools`)
      return data.tools ?? []
    },
    enabled: !!name,
  })
}

export function useConnectTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; toolName: string; config: Record<string, unknown> }) =>
      api.post(`/agents/${data.name}/tools`, { toolName: data.toolName, config: data.config }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['agent-tools', variables.name] })
    },
  })
}

export function useDisconnectTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, toolName }: { name: string; toolName: string }) =>
      api.delete(`/agents/${name}/tools/${encodeURIComponent(toolName)}`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['agent-tools', variables.name] })
    },
  })
}

// ── Export Hooks ──

export function useExportDocument() {
  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: 'pdf' | 'docx' | 'md' }) =>
      api.getBlob(`/documents/${id}/export?format=${format}`),
  })
}

// ── Validation Hooks ──

export function useValidationToken(documentId: string | undefined) {
  return useMutation({
    mutationFn: async () => api.post<{ token: string }>(`/documents/${documentId}/validation-token`),
  })
}

interface ValidateDocResponse {
  document: {
    id: string
    title: string
    status: string
    sections: BackendSection[]
  }
  validation: {
    decision: string | null
    decidedAt: string | null
  }
}

export function useValidateDocument(token: string | undefined) {
  return useQuery({
    queryKey: ['validation', token],
    queryFn: async () => api.get<ValidateDocResponse>(`/validate/${token}`, { public: true }),
    enabled: !!token,
    retry: false,
  })
}

export function useSubmitValidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      token,
      decision,
      sectionReasons,
    }: {
      token: string
      decision: 'approved' | 'rejected'
      sectionReasons: Record<string, string>
    }) => api.post<{ ok: boolean }>(`/validate/${token}/decision`, {
      decision,
      section_reasons: sectionReasons,
    }, { public: true }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['validation', variables.token] })
    },
  })
}

export function useValidationView(token: string | undefined) {
  return useQuery({
    queryKey: ['validation-view', token],
    queryFn: async () => api.get<ValidateDocResponse>(`/validate/${token}`, { public: true }),
    enabled: !!token,
  })
}

// ── Template Hooks ──

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => api.get<Template[]>('/templates'),
    staleTime: 60_000,
  })
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => api.get<Template>(`/templates/${id}`),
    enabled: !!id,
  })
}

export function useCreateDocumentFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ templateId, projectName }: { templateId: string; projectName?: string }) =>
      api.post<BackendProject>('/templates/use', { templateId, name: projectName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useCreateFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { templateId: string; name?: string }) =>
      api.post<BackendProject>('/templates/use', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

// ── Collaborator Hooks ──

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const raw = await api.get<Array<{ documentId: string; collaborators: Collaborator[] }>>('/collaboration/collaborators')
      // Flatten: extract all collaborator entries across all documents
      const flat: Collaborator[] = []
      for (const entry of raw) {
        if (Array.isArray(entry.collaborators)) {
          flat.push(...entry.collaborators)
        }
      }
      return flat
    },
    staleTime: 30_000,
  })
}

// ── Activity / Collaboration Hooks ──

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async () => api.get('/collaboration/activity'),
    staleTime: 15_000,
  })
}

// ── Sharing Hooks ──

export function useInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; role: string; documentId: string }) => api.post('/sharing/invite', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborators'] }),
  })
}

export function useGenerateLink() {
  return useMutation({
    mutationFn: async (docId: string) => api.post('/sharing/generate-link', { documentId: docId }),
  })
}

export function useResendInvite() {
  return useMutation({
    mutationFn: async (id: string) => api.post(`/sharing/resend/${id}`),
  })
}

export function useAccessLogs() {
  return useQuery({
    queryKey: ['access-logs'],
    queryFn: async () => api.get('/sharing/access-logs'),
  })
}

export function useUpdateCollaborator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) =>
      api.patch('/collaboration/collaborators', { email, role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborators'] }),
  })
}

export function useRemoveCollaborator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) =>
      api.delete(`/collaboration/collaborators?email=${encodeURIComponent(email)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborators'] }),
  })
}

export function useUpdateShareSettings() {
  return useMutation({
    mutationFn: async (settings: { documentId: string; passwordProtect?: boolean; expiration?: boolean; nda?: boolean }) =>
      api.patch('/sharing/settings', settings),
  })
}

// ── Infrastructure Hooks ──

export function useInfraHealth() {
  return useQuery({
    queryKey: ['infra-health'],
    queryFn: async () => api.get('/infrastructure/health'),
    refetchInterval: 10_000,
  })
}

export function useRestartServices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => api.post('/infrastructure/restart'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infra-health'] })
      qc.invalidateQueries({ queryKey: ['health'] })
    },
  })
}

// ── API Key Hooks ──

export function useApiKeys(enabled?: boolean) {
  return useQuery<{ id: string; provider: string; encrypted_key: string; created_at: string }[]>({
    queryKey: ['api-keys'],
    queryFn: async () => api.get('/admin/api-keys'),
    enabled: enabled !== false,
  })
}

export function useCreateApiKey(enabled?: boolean) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) =>
      api.post('/admin/api-keys', { provider: data.provider, key: data.apiKey }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

export function useDeleteApiKey(enabled?: boolean) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

// ── Version History Hooks ──

export function useVersions(documentId: string | undefined) {
  return useQuery({
    queryKey: ['versions', documentId],
    queryFn: async () => {
      const result = await api.get<unknown[]>(`/documents/${documentId}/versions`)
      return { versions: Array.isArray(result) ? result : [] }
    },
    enabled: !!documentId,
  })
}

export function useRestoreVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ documentId, version }: { documentId: string; version: string }) =>
      api.post(`/documents/${documentId}/restore`, { version }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['versions', variables.documentId] })
      qc.invalidateQueries({ queryKey: ['document', variables.documentId] })
    },
  })
}

// ── Diagram Hooks ──

export function useDiagram(id: string | undefined) {
  return useQuery({
    queryKey: ['diagram', id],
    queryFn: async () => api.get<{ id: string; type: string; rendered_url: string }>(`/projects/diagrams/${id}`),
    enabled: !!id,
  })
}

export function useCreateDiagram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, type, source }: { projectId: string; type: string; source?: string }) =>
      api.post<{ id: string; rendered_url: string }>(`/projects/${projectId}/diagrams`, { type, source: source ?? '' }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['diagrams'] })
      if (data?.id) qc.invalidateQueries({ queryKey: ['diagram', data.id] })
    },
  })
}

// ── Health Check ──

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => api.get<{ status: string }>('/healthz'),
    staleTime: 10_000,
    retry: 1,
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => api.get<{ id: string; name: string; email: string; role: string }>('/auth/me'),
    staleTime: 30_000,
    retry: 1,
  })
}

/** Stream an inline AI completion from the backend. Returns an async generator of token strings. */
export async function streamAiComplete(
  command: string,
  selectedText?: string,
): Promise<AsyncGenerator<string>> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${apiBase()}/ai/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ command, selectedText }),
  })
  if (!res.ok || !res.body) {
    throw new Error(`AI complete failed: ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return (async function* () {
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
            if (json === '[DONE]') return
            if (json) {
              try {
                const parsed = JSON.parse(json)
                if (parsed.token) yield parsed.token
              } catch { /* keepalive */ }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  })()
}

// ── Model Hooks ──

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      return api.get<string[]>('/models')
    },
    staleTime: 60_000,
  })
}

export function useDetailedModels() {
  return useQuery({
    queryKey: ['models', 'detailed'],
    queryFn: async () => {
      return api.get<Array<{ name: string; isCloud: boolean; supportsTools: boolean }>>('/models/detailed')
    },
    staleTime: 60_000,
  })
}

export function useSetActiveModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (model: string) => {
      await api.patch('/admin/models/active', { model })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

function apiBase(): string {
  return (import.meta as any).env?.VITE_API_BASE ?? '/api'
}
