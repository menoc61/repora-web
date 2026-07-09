import { useState } from 'react'
import Icon from '../components/Icon'
import { Link, useSearch } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { useExportDocument, useValidationToken, useDocument } from '../hooks/useQueries'

interface Format {
  icon: string
  label: string
  active?: boolean
}

type ExportFormat = 'pdf' | 'docx'

const FORMATS: Format[] = [
  { icon: 'picture_as_pdf', label: 'PDF', active: true },
  { icon: 'description', label: 'DOCX' },
  { icon: 'terminal', label: 'LaTeX' },
  { icon: 'markdown', label: 'MD' },
]

const FORMAT_LABEL_TO_EXPORT: Record<string, ExportFormat> = {
  PDF: 'pdf',
  DOCX: 'docx',
  LaTeX: 'pdf',
  MD: 'docx',
}

const FORMAT_EXTENSION: Record<string, string> = {
  PDF: 'pdf',
  DOCX: 'docx',
  LaTeX: 'tex',
  MD: 'md',
}

export default function ExportPreview() {
  const search = useSearch({ from: '/export' })
  const docId = search.id
  const exportDoc = useExportDocument()
  const validationToken = useValidationToken(docId)
  const { data: document } = useDocument(docId)
  const [activeFormat, setActiveFormat] = useState<string>('PDF')
  const [zoomLevel, setZoomLevel] = useState(85)
  const [currentPage, setCurrentPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  async function handleExport(format: 'pdf' | 'docx') {
    if (!docId) return
    const blob = await exportDoc.mutateAsync({ id: docId, format })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `document.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    if (!docId) return
    const { token } = await validationToken.mutateAsync()
    const base = `${window.location.origin}/validate/${token}`
    setGeneratedLink(base)
    try {
      await navigator.clipboard?.writeText(base)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleSelectFormat(label: string) {
    setActiveFormat(label)
  }

  function handleRenderNow() {
    const fmt = FORMAT_LABEL_TO_EXPORT[activeFormat] ?? 'pdf'
    handleExport(fmt)
  }

  function handleDownload() {
    const fmt = FORMAT_LABEL_TO_EXPORT[activeFormat] ?? 'pdf'
    handleExport(fmt)
  }

  function handleZoomIn() {
    setZoomLevel((z) => Math.min(z + 10, 200))
  }

  function handleZoomOut() {
    setZoomLevel((z) => Math.max(z - 10, 25))
  }

  function handlePrevPage() {
    setCurrentPage((p) => Math.max(p - 1, 1))
  }

  function handleNextPage() {
    setCurrentPage((p) => Math.min(p + 1, sectionCount))
  }

  const docTitle = document?.title ?? 'Document'
  const docContent = document?.content ?? ''
  const docAuthor = document?.author?.name ?? 'Repora AI'
  const docVersion = document?.version ?? 'v1.0.0'
  const docDate = document?.createdAt
    ? new Date(document.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const sectionCount = docContent ? Math.max(1, Math.ceil(docContent.length / 3000)) : 1
  const extension = FORMAT_EXTENSION[activeFormat] ?? 'pdf'

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 bg-surface border-b border-outline-variant flex items-center justify-between px-margin-desktop h-16 w-full">
        <div className="flex items-center gap-4">
          <Link to="/editor" search={{ id: docId }} className="p-2 hover:bg-surface-variant/50 transition-colors rounded"><Icon name="arrow_back" className="text-on-surface-variant" /></Link>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Repora AI</h1>
          <div className="h-4 w-px bg-outline-variant mx-2" />
          <span className="font-label-md text-label-md text-on-surface-variant">Apercu d&apos;export : {docTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownload} disabled={!docId || exportDoc.isPending} className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant/50 transition-all bg-transparent"><span>{exportDoc.isPending ? 'Export...' : `Telecharger ${activeFormat}`}</span></Button>
          <Button variant="default" onClick={handleShare} disabled={!docId || validationToken.isPending} className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2"><Icon name="download" className="text-[18px]" /><span>{validationToken.isPending ? 'Generation...' : copied ? 'Lien copie !' : 'Partager'}</span></Button>
        </div>
      </header>

      <main className="pt-16 flex h-screen overflow-hidden">
        <aside className="w-sidebar-width bg-surface-studio border-r border-outline-variant flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            <section>
              <label className="font-label-md text-label-md text-on-surface-variant mb-4 block uppercase tracking-wider">Selection du format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.label} onClick={() => handleSelectFormat(f.label)} className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${f.label === activeFormat ? 'border-secondary bg-surface-variant/30 text-secondary' : 'border outline-variant text-on-surface-variant hover:bg-surface-variant/50'}`}>
                    <Icon name={f.icon} className="mb-1" />
                    <span className="font-label-md text-label-md">{f.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="pt-6 border-t border-outline-variant">
              <Button variant="secondary" className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-headline-md text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-all" onClick={handleRenderNow} disabled={!docId || exportDoc.isPending}>
                <Icon name="print" className="text-[20px]" /> <span>{exportDoc.isPending ? 'Rendu en cours...' : 'Rendu maintenant'}</span>
              </Button>
            </section>
          </div>
        </aside>

        <div className="flex-1 bg-surface-studio overflow-y-auto p-12 custom-scrollbar flex flex-col items-center gap-8 relative">
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary-container text-on-secondary-container px-6 py-3 rounded-full shadow-2xl z-50">
            <button className="p-2 hover:bg-white/10 rounded-full" onClick={handleZoomOut}><Icon name="zoom_out" /></button>
            <span className="font-label-md text-label-md px-4">{zoomLevel}%</span>
            <button className="p-2 hover:bg-white/10 rounded-full" onClick={handleZoomIn}><Icon name="zoom_in" /></button>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <button className="p-2 hover:bg-white/10 rounded-full" onClick={handlePrevPage}><Icon name="chevron_left" /></button>
            <span className="font-label-md text-label-md px-2">{currentPage} / {sectionCount}</span>
            <button className="p-2 hover:bg-white/10 rounded-full" onClick={handleNextPage}><Icon name="chevron_right" /></button>
          </div>

          <div className="w-[210mm] flex justify-between items-center">
            <div className="flex items-center gap-2 text-on-surface-variant"><Icon name="visibility" className="text-[20px]" /><span className="font-label-md text-label-md">Apercu haute fidelite</span></div>
            <div className="flex gap-2">
              <Button variant="outline" className="px-4 py-2 bg-white border border-outline-variant rounded shadow-sm hover:bg-surface-variant transition-all font-label-md text-label-md flex items-center gap-2" onClick={() => window.print()}><Icon name="print" className="text-[18px]" /><span>Imprimer</span></Button>
              <Button variant="outline" className="px-4 py-2 bg-white border border-outline-variant rounded shadow-sm hover:bg-surface-variant transition-all font-label-md text-label-md flex items-center gap-2" onClick={handleDownload}><Icon name="download" className="text-[18px]" /><span>Telecharger {activeFormat}</span></Button>
            </div>
          </div>

          <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }} className="w-full flex justify-center">
            <article className="a4-page font-body-md text-on-surface relative">
              <div className="absolute top-10 right-10 text-[10px] text-outline tracking-widest font-label-sm uppercase pointer-events-none opacity-50">Brouillon genere via Repora AI</div>
              <div className="mb-12 border-b-2 border-primary pb-8">
                <h1 className="font-display-lg text-display-lg text-primary mb-2">{docTitle}</h1>
                <h2 className="font-headline-md text-headline-md text-on-surface-variant font-light">{document?.department ? `Departement ${document.department}` : ''}</h2>
                <div className="mt-8 flex gap-8">
                  <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline-variant uppercase">Auteur</span><span className="font-body-sm font-semibold">{docAuthor}</span></div>
                  <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline-variant uppercase">Date</span><span className="font-body-sm font-semibold">{docDate}</span></div>
                  <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline-variant uppercase">Classification</span><span className="font-body-sm font-semibold">Confidentiel</span></div>
                </div>
              </div>
              <div className="space-y-6 text-body-md leading-relaxed">
                {docContent ? (
                  docContent.split('\n\n').map((paragraph, i) => {
                    const trimmed = paragraph.trim()
                    if (!trimmed) return null
                    if (trimmed.startsWith('# ')) {
                      return <h3 key={i} className="font-headline-md text-headline-md border-l-4 border-secondary pl-4 mt-12 mb-6">{trimmed.replace(/^# /, '')}</h3>
                    }
                    if (trimmed.startsWith('## ')) {
                      return <h4 key={i} className="font-headline-md text-[18px] border-l-4 border-secondary pl-4 mt-8 mb-4">{trimmed.replace(/^## /, '')}</h4>
                    }
                    if (trimmed.startsWith('- ')) {
                      const items = trimmed.split('\n').filter(line => line.trim().startsWith('- '))
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-3 mt-4 text-on-surface-variant">
                          {items.map((item, j) => (
                            <li key={j}>{item.replace(/^- /, '')}</li>
                          ))}
                        </ul>
                      )
                    }
                    return (
                      <p key={i} className={i === 0 ? 'first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2' : ''}>
                        {trimmed}
                      </p>
                    )
                  })
                ) : (
                  <p className="text-on-surface-variant italic">Chargement du contenu du document...</p>
                )}
              </div>
              <div className="mt-12 flex justify-between items-center text-[10px] text-outline uppercase tracking-widest font-label-sm">
                <span>Modele Repora {docVersion}</span><span>Page {currentPage} sur {sectionCount}</span>
              </div>
            </article>
          </div>
          <div className="h-24" />
        </div>

        <aside className="w-inspector-width bg-surface border-l border-outline-variant flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Assistant d&apos;export IA</h3>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-final animate-pulse" /><span className="font-label-sm text-[10px] text-status-final">INACTIF</span></span>
            </div>
            <div className="mt-12">
              <div className="p-4 bg-ai-glow border border-secondary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2"><Icon name="auto_awesome" className="text-secondary" /><span className="font-label-md text-label-md text-secondary">Recommandation de mise en page</span></div>
                <p className="text-[11px] text-on-secondary-fixed-variant leading-relaxed">Le style &apos;Academique&apos; pourrait ameliorer la lisibilite pour cette profondeur technique. Le changement automatiserait le formatage IEEE pour toutes les entrees bibliographiques.</p>
                <Button variant="secondary" className="mt-3 w-full py-2 bg-secondary text-white rounded text-[11px] font-label-md hover:bg-secondary-container transition-colors"><span>Appliquer la recommandation</span></Button>
              </div>
            </div>
          </div>
          <div className="mt-auto p-6 border-t border-outline-variant">
            <div className="flex items-center justify-between text-[11px] font-label-sm text-on-surface-variant opacity-60"><span>Statut d&apos;export</span><span>Pret</span></div>
            <div className="mt-2 w-full bg-surface-variant h-1 rounded-full overflow-hidden"><div className="bg-secondary h-full w-full transition-all duration-1000" /></div>
          </div>
        </aside>

        {generatedLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setGeneratedLink(null)}>
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-headline-md text-headline-md mb-4">Lien de validation genere</h3>
              <div className="p-3 bg-surface-studio rounded border border-outline-variant break-all mb-4">
                <code className="text-body-sm text-primary">{generatedLink}</code>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-4">Le lien a ete copie dans le presse-papier. Partagez-le avec le validateur.</p>
              <Button className="w-full" onClick={() => setGeneratedLink(null)}>Fermer</Button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
