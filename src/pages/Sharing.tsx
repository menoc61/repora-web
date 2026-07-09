import { useState, useRef } from 'react'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select'
import { useCollaborators, useInvite, useGenerateLink, useResendInvite, useAccessLogs } from '../hooks/useQueries'
import type { Collaborator } from '../schemas'

const ROLES = ['Editeur', 'Admin', 'Reviseur', 'Observateur']

interface CollaboratorRow {
  name: string
  email?: string
  role: string
  badge: string
  icon?: string
  avatar?: null
  bg: string
  pending?: boolean
}

const COLLABORATORS: CollaboratorRow[] = [
  { name: 'Alex Chen (Vous)', email: 'alex.chen@repora.ai', role: 'Proprietaire', badge: 'border border-outline-variant text-on-tertiary-container', icon: 'verified_user', avatar: null, bg: 'bg-primary-fixed' },
  { name: 'Sarah Miller', email: 's.miller@repora.ai', role: 'Admin', badge: 'bg-secondary-fixed/50 text-secondary', avatar: null, bg: 'bg-surface-container-highest' },
  { name: 'james.vance@partner.com', role: 'Editeur', badge: 'bg-surface-variant text-on-surface-variant', pending: true, icon: 'mail', bg: 'border-2 border-dashed border-outline' },
  { name: 'Marcus Holloway', email: 'marcus.h@engineering.co', role: 'Reviseur', badge: 'border border-outline-variant text-on-tertiary-container', avatar: null, bg: 'bg-surface-container-highest' },
]

const ROLE_STYLES: Record<string, { badge: string; icon?: string; bg: string }> = {
  owner: { badge: 'border border-outline-variant text-on-tertiary-container', icon: 'verified_user', bg: 'bg-primary-fixed' },
  admin: { badge: 'bg-secondary-fixed/50 text-secondary', bg: 'bg-surface-container-highest' },
  editor: { badge: 'bg-surface-variant text-on-surface-variant', bg: 'bg-surface-container-highest' },
  reviewer: { badge: 'border border-outline-variant text-on-tertiary-container', bg: 'bg-surface-container-highest' },
  viewer: { badge: 'bg-surface-variant text-on-surface-variant', bg: 'bg-surface-container-highest' },
}

function toRow(c: Collaborator): CollaboratorRow {
  const style = ROLE_STYLES[c.role] ?? ROLE_STYLES.viewer
  return {
    name: c.name,
    email: c.email,
    role: c.role.charAt(0).toUpperCase() + c.role.slice(1),
    badge: style.badge,
    icon: style.icon,
    avatar: null,
    bg: style.bg,
  }
}

export default function Sharing() {
  const { data: collaborators = [] } = useCollaborators()
  const inviteMutation = useInvite()
  const resendMutation = useResendInvite()
  const generateLinkMutation = useGenerateLink()
  const { data: accessLogs } = useAccessLogs()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [showAccessLogs, setShowAccessLogs] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const rows: CollaboratorRow[] = collaborators.length > 0
    ? collaborators.map(toRow)
    : COLLABORATORS

  const handleSendInvite = () => {
    if (!email.trim()) return
    inviteMutation.mutate({ email: email.trim(), role: role.toLowerCase() }, {
      onSuccess: () => setEmail(''),
    })
  }

  const handleResend = (emailAddr: string) => {
    resendMutation.mutate(emailAddr)
  }

  const handleGenerateLink = (docId?: string) => {
    generateLinkMutation.mutate(docId ?? 'current', {
      onSuccess: (data: any) => {
        setGeneratedLink(data?.url ?? data?.token ?? 'Lien genere')
      },
    })
  }

  const handleViewAccessLogs = () => {
    setShowAccessLogs(true)
  }

  return (
    <div className="min-h-screen bg-surface-studio">
      <main className="max-w-4xl mx-auto py-12 px-margin-desktop">
        <div className="flex items-center gap-2 mb-6 text-on-surface-variant font-label-md text-label-md">
          <Icon name="arrow_back" className="text-sm" />
          <span>Retour a &quot;Q4 Strategy Sovereign Analysis&quot;</span>
        </div>

        <div className="mb-10">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Partage securise et controle d&apos;acces</h2>
          <p className="text-on-surface-variant font-body-md max-w-2xl">Gerer les autorisations de documents sensibles, suivre les collaborateurs actifs et configurer les protocoles de securite souverains pour le partage externe.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 space-y-gutter">
            <section className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
                <Icon name="person_add" className="text-secondary" />
                Inviter des collaborateurs
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      className="w-full px-4 py-3 bg-surface-studio border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
                      placeholder="Saisir les adresses e-mail..."
                      type="email"
                      value={email}
                      onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite() }}
                    />
                  </div>
                  <div className="relative min-w-[140px]">
                    <Select value={role} onValueChange={(v) => setRole(v ?? ROLES[0])}>
                      <SelectTrigger className="w-full px-4 py-3 bg-surface-studio border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input className="rounded border-outline text-secondary focus:ring-secondary" id="notify" type="checkbox" />
                    <label className="text-body-sm text-on-surface-variant" htmlFor="notify">Notifier les destinataires par e-mail</label>
                  </div>
                  <Button
                    className="bg-primary text-white px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                    onClick={handleSendInvite}
                    disabled={inviteMutation.isPending || !email.trim()}
                  >
                    {inviteMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-primary">Collaborateurs actuels</h3>
                <span className="px-2 py-1 bg-surface-variant/50 text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-tighter">4 actifs</span>
              </div>
              <div className="divide-y divide-outline-variant">
                {rows.map((c) => (
                  <div key={c.name} className={`p-4 flex items-center justify-between hover:bg-surface-studio transition-colors ${c.pending ? 'opacity-75' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center ${c.pending ? 'border-2 border-dashed border-outline' : ''}`}>
                        {c.icon ? <Icon name={c.icon} className="text-primary" fill /> : <Icon name="person" className="text-outline" />}
                      </div>
                      <div>
                        <p className="font-body-md font-semibold text-primary">{c.name}</p>
                        <p className={`font-label-sm text-label-sm ${c.pending ? 'text-status-review' : 'text-on-surface-variant'}`}>
                          {c.pending ? 'Invitation en attente • Envoyee il y a 2h' : c.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-label-sm text-label-sm uppercase px-2 py-1 rounded ${c.badge}`}>{c.role}</span>
                      {c.pending ? (
                        <Button variant="link" className="text-secondary font-label-md text-label-md p-0 h-auto" onClick={() => handleResend(c.email ?? '')}>{resendMutation.isPending ? 'Envoi...' : 'Renvoyer'}</Button>
                      ) : (
                        <Icon name="more_vert" className="text-outline cursor-pointer" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-gutter">
            <section className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-white mb-4 flex items-center gap-2">
                  <Icon name="link" className="text-ai-vibrant" />
                  Acces externe
                </h3>
                <p className="text-on-primary-container text-body-sm mb-6">Creez une passerelle unique et chiffree pour les utilisateurs hors de votre organisation.</p>
                <Button className="w-full py-3 bg-ai-vibrant text-white font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 hover:bg-ai-vibrant/90 transition-all mb-6" onClick={() => handleGenerateLink()} disabled={generateLinkMutation.isPending}>
                  <Icon name="shield" />
                  {generateLinkMutation.isPending ? 'Generation...' : 'Generer un lien securise'}
                </Button>
                {generatedLink && (
                  <div className="mb-6 p-3 bg-surface-studio rounded-lg border border-outline-variant break-all">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Lien genere :</p>
                    <code className="text-body-sm text-secondary">{generatedLink}</code>
                  </div>
                )}
                <div className="space-y-4 border-t border-on-primary-container/20 pt-6">
                  {[
                    { label: 'Protection par mot de passe', desc: 'Connexion obligatoire pour les detenteurs de lien', checked: true },
                    { label: 'Date d\'expiration', desc: 'Le lien expire dans 7 jours', checked: false },
                    { label: 'Clause NDA', desc: 'Signature electronique requise pour voir', checked: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-white">{item.label}</span>
                        <span className="text-[10px] text-on-primary-container/70">{item.desc}</span>
                      </div>
                      <Toggle checked={item.checked} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="auto_awesome" className="text-secondary" fill />
                <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest">Audit souverain</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-body-sm text-on-surface-variant p-2 bg-surface-studio rounded">
                  <Icon name="check_circle" className="text-status-final text-lg" />
                  <span>Aucune tentative d&apos;acces non autorisee au cours des dernieres 24h.</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-on-surface-variant p-2 bg-surface-studio rounded">
                  <Icon name="info" className="text-status-review text-lg" />
                  <span>1 lien externe actuellement actif.</span>
                </div>
              </div>
              <Button variant="link" className="mt-4 w-full text-center text-secondary font-label-md text-label-md hover:underline p-0 h-auto" onClick={handleViewAccessLogs}>Voir les journaux d&apos;acces</Button>
            </section>
          </div>
        </div>

        {showAccessLogs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowAccessLogs(false)}>
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-headline-md text-headline-md mb-4">Journaux d&apos;acces</h3>
              {accessLogs && Array.isArray(accessLogs) ? (
                <div className="space-y-3">
                  {(accessLogs as any[]).map((log: any, i: number) => (
                    <div key={i} className="p-3 bg-surface-studio rounded border border-outline-variant">
                      <div className="flex justify-between text-body-sm">
                        <span className="font-semibold">{log.user ?? log.email ?? 'Inconnu'}</span>
                        <span className="text-label-sm text-on-surface-variant">{log.timestamp ?? log.time ?? ''}</span>
                      </div>
                      <p className="text-label-sm text-on-surface-variant">{log.action ?? log.event ?? 'Acces'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-on-surface-variant">Aucune tentative d&apos;acces non autorisee au cours des dernieres 24h.</p>
              )}
              <Button variant="outline" className="mt-4 w-full" onClick={() => setShowAccessLogs(false)}>Fermer</Button>
            </div>
          </div>
        )}

        <footer className="mt-12 flex items-center justify-center gap-8 border-t border-outline-variant pt-8 opacity-60 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0">
          {[
            { icon: 'verified', text: 'CONFORME SOC-2' },
            { icon: 'lock', text: 'CHIFFREMENT AES-256' },
            { icon: 'gpp_good', text: 'CERTIFIE ISO 27001' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <Icon name={item.icon} />
              <span className="font-label-sm text-label-sm">{item.text}</span>
            </div>
          ))}
        </footer>
      </main>
    </div>
  )
}

function Toggle({ checked }: { checked: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
      <div className="w-11 h-6 bg-on-primary-container/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-vibrant" />
    </label>
  )
}
