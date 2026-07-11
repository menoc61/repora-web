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

export interface DocumentConfig {
  documentType: 'cahier_des_charges' | 'rapport_technique' | 'spec_fonctionnelle'
  pageCount: 'short' | 'medium' | 'long'
  diagramTypes: ('use_case' | 'sequence' | 'activity' | 'class' | 'deployment')[]
  header: {
    companyName: string
    tagline: string
  }
  footer: {
    showPageNumbers: boolean
    copyright: string
  }
}

export const DEFAULT_DOCUMENT_CONFIG: DocumentConfig = {
  documentType: 'cahier_des_charges',
  pageCount: 'medium',
  diagramTypes: ['use_case'],
  header: { companyName: '', tagline: '' },
  footer: { showPageNumbers: true, copyright: '' },
}

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'cahier_des_charges' as const, label: 'Cahier des Charges', description: 'Specification complete avec exigences, diagrams et validation', color: '#1a365d', icon: 'description' },
  { value: 'rapport_technique' as const, label: 'Rapport Technique', description: 'Analyse technique avec recommandations et conclusions', color: '#065f46', icon: 'analytics' },
  { value: 'spec_fonctionnelle' as const, label: 'Specification Fonctionnelle', description: 'Cahier des charges fonctionnelles avec user stories', color: '#5b21b6', icon: 'checklist' },
]

export const STEPS: StepDef[] = [
  { key: 'context', label: 'Contexte', icon: 'description' },
  { key: 'functional', label: 'Exigences Fonctionnelles', icon: 'checklist' },
  { key: 'nonfunctional', label: 'Exigences Non-Fonctionnelles', icon: 'speed' },
  { key: 'actors', label: 'Acteurs', icon: 'group' },
  { key: 'configuration', label: 'Configuration', icon: 'tune' },
  { key: 'review', label: 'Recapitulatif', icon: 'preview' },
]

export const DIAGRAM_TYPE_OPTIONS = [
  { value: 'use_case', label: "Cas d'utilisation", description: "Diagramme des acteurs et cas d'utilisation" },
  { value: 'sequence', label: 'Séquence', description: 'Interactions entre composants dans le temps' },
  { value: 'activity', label: 'Activité', description: 'Flux de processus et workflows' },
  { value: 'class', label: 'Classes', description: 'Structure des classes et relations' },
  { value: 'deployment', label: 'Déploiement', description: 'Architecture technique et déploiement' },
]

export const PAGE_COUNT_OPTIONS = [
  { value: 'short' as const, label: 'Court', description: '~5 sections, 3-4 pages' },
  { value: 'medium' as const, label: 'Moyen', description: '~10 sections, 6-8 pages' },
  { value: 'long' as const, label: 'Long', description: '~15 sections, 10-12 pages' },
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
