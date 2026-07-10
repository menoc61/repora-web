export interface Project {
  id: string
  name: string
  brief: string | null
  status: string
  owner_id: string
}

export interface Requirement {
  id: string
  type: string
  text: string
  sourceActor: string | null
}

export interface SectionRequirement {
  id: number
  type: 'functional' | 'non_functional'
  text: string
  sourceActor: string
}

export interface Preset {
  text: string
  key: string
}

export interface StepDef {
  key: string
  label: string
  icon: string
}

export const STEPS: StepDef[] = [
  { key: 'context', label: 'Contexte', icon: 'description' },
  { key: 'functional', label: 'Exigences Fonctionnelles', icon: 'checklist' },
  { key: 'nonfunctional', label: 'Exigences Non-Fonctionnelles', icon: 'speed' },
  { key: 'actors', label: 'Acteurs', icon: 'group' },
  { key: 'review', label: 'Recapitulatif', icon: 'preview' },
]

export const NFR_PRESETS: Preset[] = [
  { text: 'Le systeme doit repondre en moins de 2 secondes', key: 'perf1' },
  { text: 'Le systeme doit supporter 1000 utilisateurs simultanes', key: 'scal1' },
  { text: 'Les donnees doivent etre chiffrees en transit (HTTPS/TLS)', key: 'sec1' },
  { text: 'L\'application doit etre disponible 99,5% du temps', key: 'avail1' },
  { text: 'Le code doit etre modulaire et maintenable', key: 'maint1' },
  { text: 'L\'interface doit etre accessible sur desktop et mobile', key: 'port1' },
  { text: 'Les donnees utilisateurs doivent etre sauvegardees quotidiennement', key: 'sec2' },
  { text: 'L\'application doit fonctionner sur Chrome, Firefox, Edge', key: 'port2' },
]

export const ACTOR_PRESETS: Preset[] = [
  { text: 'Administrateur Systeme', key: 'admin' },
  { text: 'Utilisateur Final', key: 'user' },
  { text: 'Client / Validateur', key: 'client' },
  { text: 'Redacteur / Analyste', key: 'redacteur' },
  { text: 'Super Admin', key: 'superadmin' },
]
