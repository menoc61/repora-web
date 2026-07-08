import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Document, Metrics, Template, Collaborator, DocumentFilters } from '../schemas'

// ── Backend response shapes ──

interface BackendProject {
  id: string
  name: string
  status: string
  brief?: string
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
    id: p.id,
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

// ── Template Hooks (seeded client-side from agents for now) ──

const TEMPLATE_SEED: Template[] = [
  {
    id: 'tpl-ip-assignment',
    title: 'IP Assignment Master',
    icon: 'balance',
    department: 'Legal',
    usageCount: 42,
    sections: [{ name: 'Clauses', blocks: 8 }],
    description: 'IP assignment & licensing clauses scaffold.',
  },
  {
    id: 'tpl-system-arch',
    title: 'System Architecture V2',
    icon: 'architecture',
    department: 'Engineering',
    usageCount: 18,
    sections: [{ name: 'Diagrams', blocks: 6 }],
    description: 'Architecture + deployment scaffold.',
  },
  {
    id: 'tpl-governance',
    title: 'AI Governance Policy',
    icon: 'policy',
    department: 'Security',
    usageCount: 27,
    sections: [{ name: 'Controls', blocks: 5 }],
    description: 'AI governance + compliance scaffold.',
  },
  {
    id: 'tpl-sla',
    title: 'Service Level Agreement',
    icon: 'description',
    department: 'Operations',
    usageCount: 15,
    sections: [{ name: 'Metrics', blocks: 7 }],
    description: 'SLA with uptime & penalty clauses.',
  },
]

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => TEMPLATE_SEED,
    staleTime: Infinity,
  })
}

// ── Collaborator Hooks (seeded client-side until /collaborators endpoint exists) ──

const COLLABORATOR_SEED: Collaborator[] = [
  { name: 'Alex Chen (You)', email: 'alex@repora.ai', role: 'owner' },
  { name: 'Sarah Miller', email: 's.miller@repora.ai', role: 'admin' },
  { name: 'Repora AI', email: 'hermes@repora.local', role: 'editor' },
]

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: async (): Promise<Collaborator[]> => COLLABORATOR_SEED,
    staleTime: Infinity,
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
