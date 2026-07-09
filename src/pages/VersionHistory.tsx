import Icon from '../components/Icon'
import { Button } from '../components/ui/button'

interface Version {
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

const VERSIONS: Version[] = [
  { version: 'ACTUEL', label: 'v2.1.2', time: "A l'instant", user: 'Sarah Jenkins', avatar: null, desc: 'Ajout des clauses d\'arbitrage et affinement des limites de responsabilite.', active: true },
  { version: 'v2.1.0', time: 'Il y a 2h', user: 'Repora AI Agent', avatar: null, isAI: true, desc: 'Optimisation du ton pour la conformite corporate et verification grammaticale.' },
  { version: 'v2.0.4', time: '12 Oct, 14:20', user: 'Marcus Thorne', avatar: null, desc: 'Redaction initiale de la Section 4 : Accords de traitement des donnees.', additions: 142, removals: 28 },
  { version: 'v2.0.1', time: '11 Oct, 09:15', user: 'Auto-Backup', avatar: null, isAuto: true, desc: 'Capture systeme avant fusion collaborative.', older: true },
]

interface Collaborator {
  name: string
  status: string
  color: string
}

const COLLABORATORS: Collaborator[] = [
  { name: 'Elena Rodriguez', status: 'Revision', color: 'bg-status-final' },
  { name: 'James Chen', status: 'Inactif', color: 'bg-status-review' },
]

export default function VersionHistory() {
  return (
    <div className="pl-sidebar-width pt-16 h-screen flex overflow-hidden">
      <aside className="w-80 h-full bg-white border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-md text-body-lg font-bold">Historique des versions</h2>
          <p className="text-on-surface-variant font-body-sm text-body-sm mt-1">Suivi des captures pour legal_framework_v4.docx</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {VERSIONS.map((v) => (
            <div key={v.version}>
              {v.older && (
                <div className="flex items-center gap-2 py-4">
                  <div className="h-[1px] bg-outline-variant flex-1" />
                  <span className="font-label-sm text-label-sm text-outline">Hier</span>
                  <div className="h-[1px] bg-outline-variant flex-1" />
                </div>
              )}
              <div className={`p-4 rounded-lg cursor-pointer transition-all ${
                v.active
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary ring-2 ring-primary/10'
                  : 'bg-surface hover:bg-surface-variant/30 border border-outline-variant'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${v.active ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>{v.version}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{v.time}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {v.isAI ? (
                    <div className="w-5 h-5 rounded-full bg-ai-vibrant flex items-center justify-center">
                      <Icon name="auto_awesome" className="text-[12px] text-white" fill />
                    </div>
                  ) : v.isAuto ? (
                    <div className="w-5 h-5 rounded-full bg-on-tertiary-container flex items-center justify-center">
                      <Icon name="person" className="text-[12px] text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200" />
                  )}
                  <span className="font-label-md text-label-md">{v.user}</span>
                </div>
                <p className={`font-body-sm text-body-sm leading-snug ${v.active ? 'opacity-90' : 'text-on-surface-variant'}`}>{v.desc}</p>
                {v.additions && (
                  <div className="mt-3 flex gap-2">
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-status-final">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-final" /> +{v.additions}
                    </span>
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" /> -{v.removals}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-outline-variant">
          <Button className="w-full py-2 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg font-label-md text-label-md transition-colors">Charger plus d&apos;historique</Button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-outline-variant px-margin-desktop py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-studio px-3 py-1.5 rounded border border-outline-variant">
              <span className="font-label-md text-label-md">Comparaison :</span>
              <span className="font-label-md text-label-md font-bold text-primary">v2.0.4</span>
              <Icon name="compare_arrows" className="text-[16px]" />
              <span className="font-label-md text-label-md font-bold text-primary">Actuel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-studio transition-all">
              <Icon name="restore" /> Restaurer cette version
            </Button>
            <Button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all">
              <Icon name="done_all" /> Accepter les modifications
            </Button>
            <Button variant="ghost" size="icon" className="p-2 hover:bg-surface-studio rounded-lg text-on-surface-variant">
              <Icon name="close" />
            </Button>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto py-12 px-8 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-8">Service Level Agreement Framework</h1>
          <section className="mb-8">
            <h2 className="font-headline-md text-body-lg font-bold text-primary mb-4">1. Definitions</h2>
            <p className="mb-4">
              &quot;Service&quot; means the Repora AI platform as described in the documentation.
              <span className="diff-removed px-1">&quot;User&quot; shall mean any individual accessing the platform without a paid subscription.</span>
              <span className="diff-added px-1">&quot;Authorized User&quot; means those employees, agents, and independent contractors of the Customer who are authorized by the Customer to use the Services and the Documentation.</span>
            </p>
          </section>
          <section className="mb-8 p-4 border-l-4 border-status-final bg-status-final/5 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-label-sm text-label-sm text-status-final font-bold uppercase tracking-widest">Section ajoutee</span>
            </div>
            <h2 className="font-headline-md text-body-lg font-bold text-primary mb-4">2. AI Governance & Compliance</h2>
            <p className="mb-4">
              The Service utilizes multi-agent orchestration to facilitate collaborative document creation. Repora warrants that all AI-generated content is subject to a <span className="diff-added px-1 font-semibold italic">Human-in-the-Loop (HITL) review process</span> before final publication.
            </p>
          </section>
          <section className="mb-8">
            <h2 className="font-headline-md text-body-lg font-bold text-primary mb-4">3. Data Security</h2>
            <p className="mb-4">
              Repora employs enterprise-grade encryption.
              <span className="diff-removed px-1">Data is stored in regional data centers located in North America.</span>
              <span className="diff-added px-1">Data is localized to the region specified in the Customer&apos;s Provisioning Form, adhering strictly to GDPR and CCPA requirements.</span>
            </p>
            <p>
              Backup snapshots are created every 15 minutes. In the event of a failure, the RTO (Recovery Time Objective) is <span className="diff-removed px-1">4 hours</span> <span className="diff-added px-1 font-bold">15 minutes</span>.
            </p>
          </section>
          <section className="mb-8 p-4 border-l-4 border-error bg-error/5 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-label-sm text-label-sm text-error font-bold uppercase tracking-widest">Section supprimee</span>
            </div>
            <h2 className="font-headline-md text-body-lg font-bold text-on-surface/50 line-through mb-4">4. Legacy Support</h2>
            <p className="text-on-surface/40 italic line-through">
              Supporting documentation for version 1.0 architecture is available upon written request for a period of six months from the date of upgrade.
            </p>
          </section>
          <div className="mt-12 py-6 border-t border-outline-variant flex justify-between items-center text-on-surface-variant font-label-md text-label-md">
            <span>Brouillon v4.2.1 • Confidentiel</span>
            <span className="flex items-center gap-2">
              <Icon name="visibility" className="text-[16px]" /> Vu par 4 collaborateurs
            </span>
          </div>
        </div>
      </div>

      <aside className="w-inspector-width h-full bg-white border-l border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">Orchestrateur IA</h3>
          <Icon name="monitoring" className="text-ai-vibrant animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="p-4 rounded-xl border border-ai-vibrant/30 bg-ai-glow/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-ai-vibrant flex items-center justify-center shadow-sm">
                <Icon name="policy" className="text-white text-[18px]" fill />
              </div>
              <div>
                <p className="font-label-md text-label-md font-bold">Legal Scout</p>
                <p className="font-label-sm text-label-sm text-on-tertiary-container">Analyse du diff v2.0.4...</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border border-outline-variant text-body-sm text-body-sm leading-snug">
                &quot;La suppression de la Section 4 pourrait creer un vide juridique pour les clients enterprise encore sur l&apos;API 1.0. Recommandation d&apos;ajouter une clause de temporisation.&quot;
              </div>
              <div className="h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-ai-vibrant w-2/3" />
              </div>
              <Button className="w-full py-1.5 text-ai-vibrant border border-ai-vibrant rounded font-label-md text-label-md hover:bg-ai-vibrant hover:text-white transition-all">Appliquer la suggestion</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-label-md text-label-md text-on-surface-variant font-semibold">Collaborateurs actifs</h4>
            {COLLABORATORS.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-2 rounded hover:bg-surface-studio cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${c.color} border-2 border-white rounded-full`} />
                  </div>
                  <span className="font-body-sm text-body-sm">{c.name}</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{c.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-surface-studio border-t border-outline-variant">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="info" className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">Les captures sont conservees pendant 365 jours dans le cadre de votre abonnement Enterprise.</p>
          </div>
          <Button variant="ghost" className="w-full py-2 flex items-center justify-center gap-2 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
            <Icon name="settings_backup_restore" /> Gerer la retention
          </Button>
        </div>
      </aside>
    </div>
  )
}
