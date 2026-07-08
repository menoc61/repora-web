import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Document, Metrics, Template, Collaborator, DocumentFilters } from '../schemas'

// ── Mock Data (will be replaced by API calls) ──

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const uuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

class MockAdapter {
  private documents: Document[] = [
    { id: uuid(), title: '2024 Legal Framework - Section IV', status: 'review', department: 'Legal', author: { name: 'Alex Chen' }, content: '', version: 'v2.1.0', updatedAt: new Date().toISOString(), tags: ['legal', 'compliance'], collaborators: [] },
    { id: uuid(), title: 'Infrastructure Scaling Protocol v2', status: 'active', department: 'Engineering', author: { name: 'Sarah Miller' }, content: '', version: 'v3.0.0', updatedAt: new Date().toISOString(), tags: ['infra', 'devops'], collaborators: [] },
    { id: uuid(), title: 'AI Orchestration Governance Policy', status: 'autonomous', department: 'Security', author: { name: 'Repora AI' }, content: '', version: 'v1.5.0', updatedAt: new Date().toISOString(), tags: ['ai', 'governance'], collaborators: [] },
  ]

  private metrics: Metrics = {
    totalDocuments: 247,
    activeAgents: 14,
    collaborationScore: 94.2,
    efficiencyIndex: 94.2,
    aiUtilization: 68,
    topContributor: 'Autonomous Orchestrator',
  }

  private templates: Template[] = [
    { id: uuid(), title: 'IP Assignment Master', icon: 'balance', department: 'Legal', usageCount: 42, sections: [{ name: 'Clauses', blocks: 8 }], description: '' },
    { id: uuid(), title: 'System Architecture V2', icon: 'architecture', department: 'Engineering', usageCount: 18, sections: [{ name: 'Diagrams', blocks: 6 }], description: '' },
  ]

  private collaborators: Collaborator[] = [
    { name: 'Alex Chen (You)', email: 'alex@repora.ai', role: 'owner' },
    { name: 'Sarah Miller', email: 's.miller@repora.ai', role: 'admin' },
  ]

  async getDocuments(filters?: DocumentFilters): Promise<Document[]> {
    await delay(250)
    let filtered = [...this.documents]
    if (filters?.status && filters.status !== 'all') filtered = filtered.filter((d) => d.status === filters.status)
    if (filters?.department && filters.department !== 'all') filtered = filtered.filter((d) => d.department === filters.department)
    if (filters?.search) filtered = filtered.filter((d) => d.title.toLowerCase().includes(filters.search!.toLowerCase()))
    return filtered
  }

  async getAnalytics(): Promise<Metrics> {
    await delay(200)
    return this.metrics
  }

  async getTemplates(): Promise<Template[]> {
    await delay(150)
    return this.templates
  }

  async getCollaborators(): Promise<Collaborator[]> {
    await delay(100)
    return this.collaborators
  }
}

const mock = new MockAdapter()

// ── Query Hooks ──

export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => mock.getDocuments(filters),
  })
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => mock.getAnalytics(),
    staleTime: 30_000,
  })
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => mock.getTemplates(),
  })
}

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: () => mock.getCollaborators(),
  })
}

// ── Mutation Hooks ──

export function useUpsertDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Document) => { await delay(200); return doc },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
