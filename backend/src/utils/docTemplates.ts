// Document type templates with professional styling configurations
// Each template defines colors, fonts, spacing, and section structure

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: 'specification' | 'rapport' | 'technique'
  colors: {
    primary: string       // Main brand color (hex)
    secondary: string     // Accent color
    heading: string       // Heading color
    text: string          // Body text color
    muted: string         // Muted/secondary text
    border: string        // Border color
    tableHeader: string   // Table header background
    tableHeaderText: string
    tableAltRow: string   // Alternating row background
    calloutInfo: string
    calloutWarning: string
    calloutSuccess: string
    calloutDanger: string
    coverBg: string       // Cover page background
    coverText: string     // Cover page text
  }
  fonts: {
    headingFamily: string
    bodyFamily: string
    monoFamily: string
  }
  sections: {
    title: string
    description: string
    required: boolean
  }[]
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'cahier_des_charges',
    name: 'Cahier des Charges',
    description: 'Document de specification complet avec exigences, diagrams et validation client',
    category: 'specification',
    colors: {
      primary: '#1a365d',
      secondary: '#2563eb',
      heading: '#1a365d',
      text: '#1a202c',
      muted: '#718096',
      border: '#e2e8f0',
      tableHeader: '#1a365d',
      tableHeaderText: '#ffffff',
      tableAltRow: '#f7fafc',
      calloutInfo: '#ebf8ff',
      calloutWarning: '#fffbeb',
      calloutSuccess: '#f0fff4',
      calloutDanger: '#fff5f5',
      coverBg: '#1a365d',
      coverText: '#ffffff',
    },
    fonts: {
      headingFamily: 'Helvetica-Bold',
      bodyFamily: 'Helvetica',
      monoFamily: 'Courier',
    },
    sections: [
      { title: 'Page de garde', description: 'En-tete officiel du document', required: true },
      { title: 'Sommaire', description: 'Table des matieres', required: true },
      { title: 'Introduction Generale', description: 'Contexte et objectifs du projet', required: true },
      { title: 'Presentation Generale', description: 'Vue d\'ensemble du projet', required: true },
      { title: 'Exigences Fonctionnelles', description: 'Detail des besoins fonctionnels', required: true },
      { title: 'Exigences Non-Fonctionnelles', description: 'Contraintes techniques et qualite', required: true },
      { title: 'Modele de Donnees', description: 'Architecture des donnees', required: false },
      { title: 'Architecture Technique', description: 'Infrastructure et composants', required: true },
      { title: 'Diagrammes UML', description: 'Diagrams du systeme', required: true },
      { title: 'Matrice des Exigences', description: 'Tracabilite des exigences', required: false },
      { title: 'Plan de Validation', description: 'Criteria et processus de validation', required: false },
      { title: 'Chronogramme', description: 'Planning de realisation', required: false },
      { title: 'Conclusion Generale', description: 'Synthese et perspectives', required: true },
    ],
  },
  {
    id: 'rapport_technique',
    name: 'Rapport Technique',
    description: 'Rapport d\'analyse technique avec recommandations et conclusions',
    category: 'rapport',
    colors: {
      primary: '#065f46',
      secondary: '#059669',
      heading: '#065f46',
      text: '#1a202c',
      muted: '#6b7280',
      border: '#d1d5db',
      tableHeader: '#065f46',
      tableHeaderText: '#ffffff',
      tableAltRow: '#f9fafb',
      calloutInfo: '#ecfdf5',
      calloutWarning: '#fffbeb',
      calloutSuccess: '#f0fdf4',
      calloutDanger: '#fef2f2',
      coverBg: '#065f46',
      coverText: '#ffffff',
    },
    fonts: {
      headingFamily: 'Helvetica-Bold',
      bodyFamily: 'Helvetica',
      monoFamily: 'Courier',
    },
    sections: [
      { title: 'Page de garde', description: 'En-tete du rapport', required: true },
      { title: 'Resume Executif', description: 'Synthese pour les decisionnaires', required: true },
      { title: 'Sommaire', description: 'Table des matieres', required: true },
      { title: 'Contexte et Objectifs', description: 'Cadre du rapport', required: true },
      { title: 'Analyse Technique', description: 'Detail de l\'analyse', required: true },
      { title: 'Resultats', description: 'Resultats de l\'analyse', required: true },
      { title: 'Recommandations', description: 'Recommandations d\'amelioration', required: true },
      { title: 'Conclusion', description: 'Synthese et prochaines etapes', required: true },
    ],
  },
  {
    id: 'spec_fonctionnelle',
    name: 'Specification Fonctionnelle',
    description: 'Cahier des charges fonctionnelles avec user stories et cas d\'utilisation',
    category: 'specification',
    colors: {
      primary: '#5b21b6',
      secondary: '#7c3aed',
      heading: '#5b21b6',
      text: '#1a202c',
      muted: '#6b7280',
      border: '#e5e7eb',
      tableHeader: '#5b21b6',
      tableHeaderText: '#ffffff',
      tableAltRow: '#f5f3ff',
      calloutInfo: '#ede9fe',
      calloutWarning: '#fffbeb',
      calloutSuccess: '#f0fdf4',
      calloutDanger: '#fef2f2',
      coverBg: '#5b21b6',
      coverText: '#ffffff',
    },
    fonts: {
      headingFamily: 'Helvetica-Bold',
      bodyFamily: 'Helvetica',
      monoFamily: 'Courier',
    },
    sections: [
      { title: 'Page de garde', description: 'En-tete de la specification', required: true },
      { title: 'Sommaire', description: 'Table des matieres', required: true },
      { title: 'Introduction', description: 'Objectifs et perimetre', required: true },
      { title: 'Utilisateurs Cibles', description: 'Personas et acteurs', required: true },
      { title: 'Fonctionnalites', description: 'Detail des fonctionnalites', required: true },
      { title: 'User Stories', description: 'histoires utilisateurs', required: true },
      { title: 'Cas d\'Utilisation', description: 'Diagrams et scenarios', required: true },
      { title: 'Exigences Non-Fonctionnelles', description: 'Performance, securite, etc.', required: true },
      { title: 'Maquettes', description: 'Captures d\'ecran et wireframes', required: false },
      { title: 'Glossaire', description: 'Definitions des termes cles', required: false },
      { title: 'Conclusion', description: 'Synthese', required: true },
    ],
  },
]

export function getTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(t => t.id === id)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 }
}

export function hexToPdfKit(hex: string): string {
  return hex.replace('#', '')
}
