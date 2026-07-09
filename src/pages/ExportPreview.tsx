import Icon from '../components/Icon'
import { Link, useSearch } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { useExportDocument, useValidationToken } from '../hooks/useQueries'

interface Format {
  icon: string
  label: string
  active?: boolean
}

const FORMATS: Format[] = [
  { icon: 'picture_as_pdf', label: 'PDF', active: true },
  { icon: 'description', label: 'DOCX' },
  { icon: 'terminal', label: 'LaTeX' },
  { icon: 'markdown', label: 'MD' },
]

export default function ExportPreview() {
  const search = useSearch({ from: '/export' })
  const docId = search.id
  const exportDoc = useExportDocument()
  const validationToken = useValidationToken(docId)

  async function handleExport(format: 'pdf' | 'docx') {
    if (!docId) return
    const blob = await exportDoc.mutateAsync({ id: docId, format })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    if (!docId) return
    const { token } = await validationToken.mutateAsync()
    const base = `${window.location.origin}/validate/${token}`
    await navigator.clipboard?.writeText(base)
  }

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 bg-surface border-b border-outline-variant flex items-center justify-between px-margin-desktop h-16 w-full">
        <div className="flex items-center gap-4">
          <Link to="/editor" search={{ id: undefined }} className="p-2 hover:bg-surface-variant/50 transition-colors rounded"><Icon name="arrow_back" className="text-on-surface-variant" /></Link>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Repora AI</h1>
          <div className="h-4 w-px bg-outline-variant mx-2" />
          <span className="font-label-md text-label-md text-on-surface-variant">Apercu d&apos;export : Quarterly Analysis 2024</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!docId || exportDoc.isPending} className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant/50 transition-all bg-transparent"><span>Exporter</span></Button>
          <Button variant="default" onClick={handleShare} disabled={!docId || validationToken.isPending} className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center gap-2"><Icon name="download" className="text-[18px]" /><span>Partager</span></Button>
        </div>
      </header>

      <main className="pt-16 flex h-screen overflow-hidden">
        <aside className="w-sidebar-width bg-surface-studio border-r border-outline-variant flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            <section>
              <label className="font-label-md text-label-md text-on-surface-variant mb-4 block uppercase tracking-wider">Selection du format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.label} className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${f.active ? 'border-secondary bg-surface-variant/30 text-secondary' : 'border outline-variant text-on-surface-variant hover:bg-surface-variant/50'}`}>
                    <Icon name={f.icon} className="mb-1" />
                    <span className="font-label-md text-label-md">{f.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="font-label-md text-label-md text-on-surface-variant mb-4 block uppercase tracking-wider">Presents de style</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-surface-container-highest border-l-4 border-secondary rounded-r-lg">
                  <div className="flex flex-col"><span className="font-body-md font-semibold">Corporate</span><span className="text-[10px] text-on-surface-variant opacity-70">Titres avec serif, marges strictes</span></div>
                  <Icon name="check_circle" className="text-secondary" />
                </div>
                {['Academique', 'Moderne'].map((s) => (
                  <div key={s} className="flex items-center justify-between p-3 hover:bg-surface-variant/30 border border-transparent hover:border-outline-variant rounded-lg cursor-pointer transition-all">
                    <div className="flex flex-col"><span className="font-body-md font-medium text-on-surface-variant">{s}</span><span className="text-[10px] text-on-surface-variant opacity-70">{s === 'Academique' ? 'Double interligne, norme IEEE' : 'Sans-serif, typographie fluide'}</span></div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <label className="font-label-md text-label-md text-on-surface-variant mb-4 block uppercase tracking-wider">Composants du document</label>
              <div className="space-y-4">
                {['Table des matieres', 'Citations', 'Annexe'].map((c, i) => (
                  <div key={c} className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">{c}</span>
                    <Toggle on={i < 2} />
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-6 border-t border-outline-variant">
              <Button variant="secondary" className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-headline-md text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                <Icon name="print" className="text-[20px]" /> <span>Rendu maintenant</span>
              </Button>
            </section>
          </div>
        </aside>

        <div className="flex-1 bg-surface-studio overflow-y-auto p-12 custom-scrollbar flex flex-col items-center gap-8 relative">
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary-container text-on-secondary-container px-6 py-3 rounded-full shadow-2xl z-50">
            <button className="p-2 hover:bg-white/10 rounded-full"><Icon name="zoom_out" /></button>
            <span className="font-label-md text-label-md px-4">85%</span>
            <button className="p-2 hover:bg-white/10 rounded-full"><Icon name="zoom_in" /></button>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <button className="p-2 hover:bg-white/10 rounded-full"><Icon name="chevron_left" /></button>
            <span className="font-label-md text-label-md px-2">1 / 12</span>
            <button className="p-2 hover:bg-white/10 rounded-full"><Icon name="chevron_right" /></button>
          </div>

          <div className="w-[210mm] flex justify-between items-center">
            <div className="flex items-center gap-2 text-on-surface-variant"><Icon name="visibility" className="text-[20px]" /><span className="font-label-md text-label-md">Apercu haute fidelite</span></div>
            <div className="flex gap-2">
              <Button variant="outline" className="px-4 py-2 bg-white border border-outline-variant rounded shadow-sm hover:bg-surface-variant transition-all font-label-md text-label-md flex items-center gap-2" onClick={() => window.print()}><Icon name="print" className="text-[18px]" /><span>Imprimer</span></Button>
              <Button variant="outline" className="px-4 py-2 bg-white border border-outline-variant rounded shadow-sm hover:bg-surface-variant transition-all font-label-md text-label-md flex items-center gap-2"><Icon name="download" className="text-[18px]" /><span>Telecharger PDF</span></Button>
            </div>
          </div>

          <article className="a4-page font-body-md text-on-surface">
            <div className="absolute top-10 right-10 text-[10px] text-outline tracking-widest font-label-sm uppercase pointer-events-none opacity-50">Brouillon genere via Repora AI</div>
            <div className="mb-12 border-b-2 border-primary pb-8">
              <h1 className="font-display-lg text-display-lg text-primary mb-2">Analyse trimestrielle</h1>
              <h2 className="font-headline-md text-headline-md text-on-surface-variant font-light">Infrastructure de marche et evolutivite des agents IA</h2>
              <div className="mt-8 flex gap-8">
                {[['Auteur', 'Repora Strategic Unit'], ['Date', '24 Octobre 2024'], ['Classification', 'Confidentiel']].map(([k, v]) => (
                  <div key={k} className="flex flex-col"><span className="font-label-sm text-label-sm text-outline-variant uppercase">{k}</span><span className="font-body-sm font-semibold">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="space-y-6 text-body-md leading-relaxed">
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2">Alors que nous naviguons dans la seconde moitie de l&apos;exercice fiscal, l&apos;integration de couches d&apos;orchestration autonome dans les flux de travail documentaires d&apos;entreprise est passee d&apos;un avantage theorique a une necessite structurelle.</p>
              <h3 className="font-headline-md text-headline-md border-l-4 border-secondary pl-4 mt-12 mb-6">1. Resume executif</h3>
              <p>La transition vers l&apos;Intelligence Souveraine dans la documentation d&apos;entreprise permet une auditabilite sans precedent. Nos benchmarks internes indiquent une reduction de 40% de la latence de revision lors de l&apos;utilisation de la redaction multi-agents parallele.</p>
              <div className="my-10 bg-surface-studio p-8 border border-outline-variant rounded-xl flex items-center justify-between gap-8">
                <div className="w-1/2"><h4 className="font-label-md text-label-md text-secondary mb-2 uppercase">Fig 1.1 : Evolution de la productivite</h4><p className="text-xs text-on-surface-variant">Analyse comparative des cycles de documentation manuels vs augmentes par IA sur une periode glissante de 12 mois.</p></div>
                <div className="w-1/2 h-32 bg-white border border-outline-variant flex items-end justify-around p-2 gap-1 rounded-lg">
                  {[30, 45, 40, 70, 85, 95].map((h, i) => (
                    <div key={i} className={`w-full ${h >= 70 ? 'bg-secondary' : 'bg-outline-variant'} rounded-t`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md border-l-4 border-secondary pl-4 mt-12 mb-6">2. Cadre technique</h3>
              <p>L&apos;architecture sous-jacente de Repora repose sur une triade d&apos;instances LLM specialisees fonctionnant en boucle de critique recursive.</p>
              <ul className="list-disc pl-5 space-y-3 mt-4 text-on-surface-variant">
                <li><strong>Ancrage semantique :</strong> Preservation des concepts fondamentaux a travers les couches de traduction.</li>
                <li><strong>Orchestration multi-agents :</strong> Gestion de la concurrence dans les mises a jour de l&apos;etat du document.</li>
                <li><strong>Traits affines :</strong> Maintien de l&apos;esthetique professionnelle via la superposition tonale.</li>
              </ul>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-[25mm] flex justify-between items-center text-[10px] text-outline uppercase tracking-widest font-label-sm">
              <span>Modele Corporate Repora v4.2</span><span>Page 1 sur 12</span>
            </div>
          </article>
          <div className="h-24" />
        </div>

        <aside className="w-inspector-width bg-surface border-l border-outline-variant flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Assistant d&apos;export IA</h3>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-final animate-pulse" /><span className="font-label-sm text-[10px] text-status-final">INACTIF</span></span>
            </div>
            <div className="bg-white/70 backdrop-blur border border-outline-variant p-4 rounded-xl mb-6">
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">&quot;J&apos;ai detecte trois figures sans legendes. Voulez-vous que je genere des labels descriptifs bases sur le contexte du document ?&quot;</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 py-1.5 bg-primary-container text-on-secondary-container text-[11px] font-label-md rounded border border-white/10 hover:bg-white/20 transition-all"><span>Corriger maintenant</span></Button>
                <button className="p-1.5 border border-outline-variant rounded hover:bg-surface-variant transition-all"><Icon name="close" className="text-[16px]" /></button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-label-md text-label-md text-on-surface">Verification pre-export</h4>
              <div className="space-y-2">
                <CheckLine cls="text-status-final" icon="check_circle" text="Marges conformes a la norme Corporate" />
                <CheckLine cls="text-status-final" icon="check_circle" text="Les 14 citations validees via CrossRef" />
                <CheckLine cls="text-status-review" icon="warning" text="Image basse resolution en Page 4" />
              </div>
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
      </main>
    </>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={on} className="sr-only peer" />
      <div className="w-10 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
    </label>
  )
}

function CheckLine({ cls, icon, text }: { cls: string; icon: string; text: string }) {
  return (
    <div className={`flex items-center gap-3 p-2 ${cls}`}>
      <Icon name={icon} className="text-[18px]" />
      <span className="text-xs font-body-md">{text}</span>
    </div>
  )
}
