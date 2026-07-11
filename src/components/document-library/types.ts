import type { Document } from '@/schemas'

export const STATUS_LABELS: Record<Document['status'], string> = {
  draft: 'Brouillon',
  review: 'En revision',
  in_review: 'En revision',
  final: 'Finalise',
  validated: 'Valide',
  active: 'Actif',
  rejected: 'Rejete',
  reviewed: 'Examine',
  autonomous: 'Autonome',
  archived: 'Archive',
}

export const BADGE_STATUS: Record<Document['status'], 'draft' | 'review' | 'final' | 'active' | 'autonomous'> = {
  draft: 'draft',
  review: 'review',
  in_review: 'review',
  final: 'final',
  validated: 'final',
  active: 'active',
  rejected: 'draft',
  reviewed: 'review',
  autonomous: 'autonomous',
  archived: 'draft',
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export const PAGE_SIZE = 10
