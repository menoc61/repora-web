import { z } from 'zod'

const email = z.string().email('Email invalide').max(255)
const password = z.string().min(6, 'Mot de passe trop court (min 6)').max(128)
const name = z.string().min(1, 'Nom requis').max(100)

export const registerSchema = z.object({
  name,
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password,
})

export const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(6).max(128).optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nom du projet requis').max(200),
  brief: z.string().max(5000).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brief: z.string().max(5000).optional(),
  status: z.enum(['active', 'archived']).optional(),
})

export const generateDocumentSchema = z.object({
  templateId: z.string().uuid('templateId invalide').optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const updateDocumentSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    content: z.string().optional(),
    title: z.string().optional(),
  })).optional(),
  title: z.string().max(500).optional(),
  status: z.enum(['draft', 'in_review', 'validated', 'rejected']).optional(),
})

export const createCommentSchema = z.object({
  sectionId: z.string().min(1, 'sectionId requis'),
  text: z.string().min(1, 'Texte requis').max(10000),
})

export const createDiagramSchema = z.object({
  type: z.enum(['use_case', 'sequence', 'activity', 'class', 'deployment']),
  source: z.string().max(5000).optional(),
  sectionId: z.string().optional(),
})

export const createUserSchema = z.object({
  name,
  email,
  password,
  role: z.enum(['redacteur', 'validateur', 'admin', 'super_admin']).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: email.optional(),
  role: z.enum(['redacteur', 'validateur', 'admin', 'super_admin']).optional(),
  password: password.optional(),
})

export const patchAgentSchema = z.object({
  provider: z.string().max(50).optional(),
  modelId: z.string().max(100).optional(),
  enabled: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(64).max(32768).optional(),
})

export const createApiKeySchema = z.object({
  provider: z.string().min(1).max(50),
  key: z.string().min(1, 'Clé API requise').max(2000),
})

export const createRequirementSchema = z.object({
  type: z.enum(['functional', 'non_functional']),
  text: z.string().min(1, 'Texte requis').max(5000),
  sourceActor: z.string().max(200).optional(),
})
