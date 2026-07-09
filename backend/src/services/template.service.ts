const TEMPLATES = [
  {
    id: '1',
    name: 'Cahier des Charges Standard',
    category: 'Legal',
    description: 'Modele standard pour un cahier des charges complet avec sections obligatoires.',
    sections: ['Introduction', 'Objectifs', 'Perimetre', 'Exigences Fonctionnelles', 'Exigences Techniques', 'Contraintes', 'Livrables', 'Planning'],
  },
  {
    id: '2',
    name: 'Specification Technique',
    category: 'Engineering',
    description: 'Document de specification technique detaille pour les equipes de developpement.',
    sections: ['Vue d\'ensemble', 'Architecture', 'Composants', 'Interfaces', 'Base de donnees', 'Securite', 'Deploiement'],
  },
  {
    id: '3',
    name: 'Rapport Financier',
    category: 'Finance',
    description: 'Modele de rapport financier avec analyse des couts et budget.',
    sections: ['Resume executif', 'Analyse des couts', 'Budget previsionnel', 'Retour sur investissement', 'Risques financiers', 'Recommandations'],
  },
  {
    id: '4',
    name: 'Audit de Securite',
    category: 'Security',
    description: 'Modele pour un rapport d\'audit de securite complet.',
    sections: ['Perimetre de l\'audit', 'Methodologie', 'Vulnerabilites identifiees', 'Evaluation des risques', 'Recommandations', 'Plan d\'action'],
  },
]

export function listTemplates() {
  return TEMPLATES
}

export function getTemplate(id: string) {
  return TEMPLATES.find(t => t.id === id) ?? null
}
