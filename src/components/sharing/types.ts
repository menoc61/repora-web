import type { Collaborator } from '../../schemas'

export const ROLES = ['Editeur', 'Admin', 'Reviseur', 'Observateur']

export const ROLE_MAP: Record<string, string> = {
  Editeur: 'editor',
  Admin: 'admin',
  Reviseur: 'reviewer',
  Observateur: 'viewer',
}

export interface CollaboratorRow {
  name: string
  email?: string
  role: string
  badge: string
  icon?: string
  avatar?: null
  bg: string
  pending?: boolean
}

export const COLLABORATORS: CollaboratorRow[] = [
  { name: 'Alex Chen (Vous)', email: 'alex.chen@repora.ai', role: 'Proprietaire', badge: 'border border-outline-variant text-on-tertiary-container', icon: 'verified_user', avatar: null, bg: 'bg-primary-fixed' },
  { name: 'Sarah Miller', email: 's.miller@repora.ai', role: 'Admin', badge: 'bg-secondary-fixed/50 text-secondary', avatar: null, bg: 'bg-surface-container-highest' },
  { name: 'James Vance', email: 'james.vance@partner.com', role: 'Editeur', badge: 'bg-surface-variant text-on-surface-variant', pending: true, icon: 'mail', bg: 'border-2 border-dashed border-outline' },
  { name: 'Marcus Holloway', email: 'marcus.h@engineering.co', role: 'Reviseur', badge: 'border border-outline-variant text-on-tertiary-container', avatar: null, bg: 'bg-surface-container-highest' },
]

export const ROLE_STYLES: Record<string, { badge: string; icon?: string; bg: string }> = {
  owner: { badge: 'border border-outline-variant text-on-tertiary-container', icon: 'verified_user', bg: 'bg-primary-fixed' },
  admin: { badge: 'bg-secondary-fixed/50 text-secondary', bg: 'bg-surface-container-highest' },
  editor: { badge: 'bg-surface-variant text-on-surface-variant', bg: 'bg-surface-container-highest' },
  reviewer: { badge: 'border border-outline-variant text-on-tertiary-container', bg: 'bg-surface-container-highest' },
  viewer: { badge: 'bg-surface-variant text-on-surface-variant', bg: 'bg-surface-container-highest' },
}

export function toRow(c: Collaborator): CollaboratorRow {
  const role = c.role ?? 'viewer'
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.viewer
  return {
    name: c.name ?? 'Inconnu',
    email: c.email,
    role: role.charAt(0).toUpperCase() + role.slice(1),
    badge: style.badge,
    icon: style.icon,
    avatar: null,
    bg: style.bg,
  }
}
