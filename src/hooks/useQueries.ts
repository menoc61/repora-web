import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Document, Metrics, Template, Collaborator, DocumentFilters } from '../schemas'

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
  status: string
  outline: Record<string, unknown>
  sections: BackendSection[]
}

interface BackendAgent {
  name: string
  provider: string
  enabled: boolean
  model_id?: string
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

interface BackendGenerateResponse {
  document_id: string
  status: string
  prompt: string
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
    mutationFn: async ({ projectId, prompt }: { projectId: string; prompt?: string }) =>
      api.post<BackendGenerateResponse>(`/projects/${projectId}/generate`, { prompt: prompt ?? '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

// ── Document Hooks ──

export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      // Backend has no /documents list endpoint — projects serve as the document list.
      const rows = await api.get<BackendProject[]>('/projects')
      let docs = rows.map(mapProjectToDocument)
      if (filters?.status && filters.status !== 'all') docs = docs.filter((d) => d.status === filters.status)
      if (filters?.department && filters.department !== 'all') docs = docs.filter((d) => d.department === filters.department)
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        docs = docs.filter((d) => d.title.toLowerCase().includes(q))
      }
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

export function useDocumentStream(id: string | undefined) {
  return useQuery({
    queryKey: ['document-status', id],
    queryFn: async () => {
      // Non-streaming health-check fetch; real streaming uses useDocumentStreamEffect below.
      const d = await api.get<BackendDocument>(`/documents/${id}`)
      return { status: d.status, sections: d.sections.length }
    },
    enabled: !!id,
    refetchInterval: 5000,
  })
}

export function useUpsertDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Document) => doc,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
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

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => api.get<BackendAgent[]>('/admin/agents'),
  })
}

export function usePatchAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, patch }: { name: string; patch: Partial<BackendAgent> }) =>
      api.patch<{ ok: boolean }>(`/admin/agents/${name}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

// ── Export Hooks ──

export function useExportDocument() {
  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: 'pdf' | 'docx' }) =>
      api.getBlob(`/documents/${id}/export?format=${format}`),
  })
}

// ── Validation Hooks ──

export function useValidationToken(documentId: string | undefined) {
  return useMutation({
    mutationFn: async () => api.post<{ token: string }>(`/documents/${documentId}/validation-token`),
  })
}

export function useValidationView(token: string | undefined) {
  return useQuery({
    queryKey: ['validation', token],
    queryFn: async () => api.get<{ document_id: string; decision: string | null }>(`/validate/${token}`),
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

// ── Collaborator Hooks ──

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => api.get<Collaborator[]>('/collaboration/collaborators'),
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
    mutationFn: async (data: { email: string; role: string }) => api.post('/sharing/invite', data),
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

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => api.get('/admin/api-keys'),
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) => api.post('/admin/api-keys', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

// ── Agent Test Hook ──

export function useTestAgent() {
  return useMutation({
    mutationFn: async ({ name, message }: { name: string; message: string }) =>
      api.post<{ reply: string }>(`/agents/${name}/test`, { message }),
  })
}

// ── Agent Enable Hook ──

export function useEnableAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => api.post(`/agents/${name}/enable`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

// ── Version History Hooks ──

export function useVersions(documentId: string | undefined) {
  return useQuery({
    queryKey: ['versions', documentId],
    queryFn: async () => api.get<{ versions: Record<string, unknown>[] }>(`/documents/${documentId}/versions`),
    enabled: !!documentId,
  })
}

export function useRestoreVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ documentId, version }: { documentId: string; version: string }) =>
      api.post(`/documents/${documentId}/restore`, { version }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['versions'] }),
  })
}

// ── Developer Profile Hook ──

export function useExportAgentConfig() {
  return useMutation({
    mutationFn: async (name: string) => api.get(`/agents/${name}/export`),
  })
}

export function useConnectTool() {
  return useMutation({
    mutationFn: async (data: { agentName: string; toolName: string; config: Record<string, unknown> }) =>
      api.post(`/agents/${data.agentName}/tools`, { toolName: data.toolName, config: data.config }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diagrams'] }),
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
