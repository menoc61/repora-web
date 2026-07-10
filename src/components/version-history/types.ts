export interface Version {
  version: string
  label?: string
  time: string
  user: string
  avatar?: null
  desc: string
  active?: boolean
  isAI?: boolean
  isAuto?: boolean
  additions?: number
  removals?: number
  older?: boolean
}

export const VERSIONS: Version[] = [
  { version: 'ACTUEL', label: 'v2.1.2', time: "A l'instant", user: 'Sarah Jenkins', avatar: null, desc: "Ajout des clauses d'arbitrage et affinement des limites de responsabilite.", active: true },
  { version: 'v2.1.0', time: 'Il y a 2h', user: 'Repora AI Agent', avatar: null, isAI: true, desc: 'Optimisation du ton pour la conformite corporate et verification grammaticale.' },
  { version: 'v2.0.4', time: '12 Oct, 14:20', user: 'Marcus Thorne', avatar: null, desc: 'Redaction initiale de la Section 4 : Accords de traitement des donnees.', additions: 142, removals: 28 },
  { version: 'v2.0.1', time: '11 Oct, 09:15', user: 'Auto-Backup', avatar: null, isAuto: true, desc: 'Capture systeme avant fusion collaborative.', older: true },
]

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietaire',
  admin: 'Admin',
  editor: 'Edition',
  reviewer: 'Revision',
  viewer: 'Lecture',
}

export const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-status-final',
  admin: 'bg-primary',
  editor: 'bg-ai-vibrant',
  reviewer: 'bg-status-review',
  viewer: 'bg-on-surface-variant',
}
