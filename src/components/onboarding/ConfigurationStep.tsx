import { useState, useEffect } from 'react'
import Icon from '../Icon'
import { DocumentConfig, DEFAULT_DOCUMENT_CONFIG, DIAGRAM_TYPE_OPTIONS, PAGE_COUNT_OPTIONS, DOCUMENT_TYPE_OPTIONS } from './types'

interface ConfigurationStepProps {
  config: DocumentConfig
  setConfig: (config: DocumentConfig) => void
}

export default function ConfigurationStep({ config, setConfig }: ConfigurationStepProps) {
  const [local, setLocal] = useState<DocumentConfig>(config)

  useEffect(() => { setConfig(local) }, [local])

  const toggleDiagramType = (type: DocumentConfig['diagramTypes'][number]) => {
    setLocal(prev => ({
      ...prev,
      diagramTypes: prev.diagramTypes.includes(type)
        ? prev.diagramTypes.filter(t => t !== type)
        : [...prev.diagramTypes, type],
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline-lg text-primary-container mb-2">Configuration du Document</h2>
        <p className="font-body-md text-secondary">Configurez le type, la structure et le format de votre document.</p>
      </div>

      {/* Document type */}
      <div className="bg-white border border-outline-variant rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="article" className="text-ai-vibrant" />
          <h3 className="font-headline-sm text-primary-container">Type de document</h3>
        </div>
        <p className="font-body-sm text-secondary mb-4">Choisissez le modele qui correspond a votre besoin.</p>
        <div className="grid grid-cols-1 gap-3">
          {DOCUMENT_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLocal(prev => ({ ...prev, documentType: opt.value }))}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                local.documentType === opt.value
                  ? 'border-ai-vibrant bg-ai-vibrant/5'
                  : 'border-outline-variant hover:border-outline'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: opt.color + '15' }}
              >
                <Icon name={opt.icon} style={{ color: opt.color }} />
              </div>
              <div className="flex-1">
                <div className="font-label-md font-mono text-primary-container">{opt.label}</div>
                <div className="font-body-sm text-secondary mt-1">{opt.description}</div>
              </div>
              {local.documentType === opt.value && (
                <Icon name="check_circle" className="text-ai-vibrant shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page count */}
      <div className="bg-white border border-outline-variant rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="description" className="text-ai-vibrant" />
          <h3 className="font-headline-sm text-primary-container">Taille du document</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PAGE_COUNT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLocal(prev => ({ ...prev, pageCount: opt.value }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                local.pageCount === opt.value
                  ? 'border-ai-vibrant bg-ai-vibrant/5'
                  : 'border-outline-variant hover:border-outline'
              }`}
            >
              <div className="font-label-md font-mono text-primary-container">{opt.label}</div>
              <div className="font-body-sm text-secondary mt-1">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diagram types */}
      <div className="bg-white border border-outline-variant rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="schema" className="text-ai-vibrant" />
          <h3 className="font-headline-sm text-primary-container">Diagrammes UML</h3>
        </div>
        <p className="font-body-sm text-secondary mb-4">Selectionnez les types de diagrammes a generer automatiquement.</p>
        <div className="space-y-2">
          {DIAGRAM_TYPE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                local.diagramTypes.includes(opt.value as any)
                  ? 'border-ai-vibrant bg-ai-vibrant/5'
                  : 'border-outline-variant hover:border-outline'
              }`}
            >
              <input
                type="checkbox"
                checked={local.diagramTypes.includes(opt.value as any)}
                onChange={() => toggleDiagramType(opt.value as any)}
                className="w-4 h-4 rounded border-outline text-ai-vibrant focus:ring-ai-vibrant"
              />
              <div>
                <div className="font-label-md text-primary-container">{opt.label}</div>
                <div className="font-body-sm text-secondary">{opt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-outline-variant rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="web_asset" className="text-ai-vibrant" />
          <h3 className="font-headline-sm text-primary-container">En-tete</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-label-sm text-secondary block mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              value={local.header.companyName}
              onChange={e => setLocal(prev => ({ ...prev, header: { ...prev.header, companyName: e.target.value } }))}
              placeholder="Mon Entreprise"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-ai-vibrant"
            />
          </div>
          <div>
            <label className="font-label-sm text-secondary block mb-1">Slogan</label>
            <input
              type="text"
              value={local.header.tagline}
              onChange={e => setLocal(prev => ({ ...prev, header: { ...prev.header, tagline: e.target.value } }))}
              placeholder="Solutions innovantes"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-ai-vibrant"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border border-outline-variant rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="web_asset" className="text-ai-vibrant" />
          <h3 className="font-headline-sm text-primary-container">Pied de page</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={local.footer.showPageNumbers}
              onChange={e => setLocal(prev => ({ ...prev, footer: { ...prev.footer, showPageNumbers: e.target.checked } }))}
              className="w-4 h-4 rounded border-outline text-ai-vibrant focus:ring-ai-vibrant"
            />
            <span className="font-body-md text-primary-container">Afficher les numeros de page</span>
          </label>
          <div>
            <label className="font-label-sm text-secondary block mb-1">Mention legale</label>
            <input
              type="text"
              value={local.footer.copyright}
              onChange={e => setLocal(prev => ({ ...prev, footer: { ...prev.footer, copyright: e.target.value } }))}
              placeholder="2026 Mon Entreprise. Tous droits reserves."
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-ai-vibrant"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
