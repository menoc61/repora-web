import type { Document } from '@/schemas'

export const STATUS_LABELS: Record<Document['status'], string> = {
  draft: 'Brouillon',
  review: 'En revision',
  final: 'Finalise',
  active: 'Actif',
  autonomous: 'Autonome',
  archived: 'Archive',
}

export const BADGE_STATUS: Record<Document['status'], 'draft' | 'review' | 'final' | 'active' | 'autonomous'> = {
  draft: 'draft',
  review: 'review',
  final: 'final',
  active: 'active',
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
