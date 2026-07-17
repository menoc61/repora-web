import { z } from 'zod'

// ── Zod Schemas (runtime validation) ──

export const CollaboratorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'editor', 'reviewer', 'viewer']),
  avatar: z.string().optional(),
})

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().optional(),
  title: z.string().min(1).max(200),
  status: z.enum(['draft', 'review', 'in_review', 'final', 'validated', 'active', 'rejected', 'reviewed', 'autonomous', 'archived']),
  department: z.string(),
  author: z.object({ name: z.string(), avatar: z.string().optional() }),
  collaborators: z.array(CollaboratorSchema).default([]),
  content: z.string().default(''),
  version: z.string().default('v1.0.0'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  outline: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    status: z.string(),
  })).optional(),
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'editor', 'reviewer', 'viewer']),
  avatar: z.string().optional(),
  department: z.string().optional(),
})

export const SettingsSchema = z.object({
  aiProvider: z.enum(['ollama', 'anthropic', 'openai', 'custom']).default('ollama'),
  selectedModel: z.string().optional(),
  endpoint: z.string().url().optional(),
  ollamaUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  language: z.string().default('en'),
  autoSave: z.boolean().default(true),
  syncMode: z.enum(['websocket', 'p2p']).default('websocket'),
})

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  icon: z.string(),
  department: z.string(),
  description: z.string().default(''),
  usageCount: z.number().default(0),
  sections: z.array(z.object({ name: z.string(), blocks: z.number() })),
})

export const versionSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  author: z.string(),
  description: z.string(),
  additions: z.number().default(0),
  removals: z.number().default(0),
})

export const MetricsSchema = z.object({
  totalDocuments: z.number(),
  activeAgents: z.number(),
  collaborationScore: z.number(),
  efficiencyIndex: z.number(),
  aiUtilization: z.number(),
  topContributor: z.string(),
})

// ── Inferred Types from Zod ──

export type Collaborator = z.infer<typeof CollaboratorSchema>
export type Document = z.infer<typeof DocumentSchema>
export type User = z.infer<typeof UserSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type Template = z.infer<typeof TemplateSchema>
export type Metrics = z.infer<typeof MetricsSchema>

// ── OOP Contracts (interfaces for services) ──

export interface IDocumentService {
  getAll(filters?: DocumentFilters): Promise<Document[]>
  getById(id: string): Promise<Document | null>
  create(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document>
  update(id: string, doc: Partial<Document>): Promise<Document>
  delete(id: string): Promise<void>
}

export interface IAnalyticsService {
  getMetrics(): Promise<Metrics>
  getTimeRange(): string
}

export interface IAuthService {
  login(email: string, password: string): Promise<{ user: User; token: string }>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}

export type DocumentFilters = {
  status?: string
  department?: string
  search?: string
  tag?: string
}

export type ViewType = 'workspace' | 'library' | 'templates' | 'agents' | 'editor' | 'analytics' | 'collaboration' | 'settings' | 'infrastructure' | 'sharing' | 'history' | 'export'
