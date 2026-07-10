import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import Icon from '../Icon'
import {
  useCollaborators,
  useInvite,
  useGenerateLink,
  useResendInvite,
  useAccessLogs,
  useUpdateCollaborator,
  useRemoveCollaborator,
  useUpdateShareSettings,
} from '../../hooks/useQueries'
import { ROLES, ROLE_MAP, COLLABORATORS, toRow } from './types'
import InviteForm from './InviteForm'
import CollaboratorList from './CollaboratorList'
import ExternalAccessPanel from './ExternalAccessPanel'
import AuditPanel from './AuditPanel'
import AccessLogModal from './AccessLogModal'

interface SharingViewProps {
  docId: string | undefined
}

export default function SharingView({ docId }: SharingViewProps) {
  const { data: collaborators = [] } = useCollaborators()
  const inviteMutation = useInvite()
  const resendMutation = useResendInvite()
  const generateLinkMutation = useGenerateLink()
  const updateCollabMutation = useUpdateCollaborator()
  const removeCollabMutation = useRemoveCollaborator()
  const updateShareSettings = useUpdateShareSettings()
  const { data: accessLogs } = useAccessLogs()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAccessLogs, setShowAccessLogs] = useState(false)
  const [securityToggles, setSecurityToggles] = useState({
    passwordProtect: true,
    expiration: false,
    nda: true,
  })

  const rows = collaborators.length > 0
    ? collaborators.map(toRow)
    : COLLABORATORS

  const handleSendInvite = () => {
    if (!email.trim()) return
    inviteMutation.mutate({ email: email.trim(), documentId: docId ?? '', role: ROLE_MAP[role] ?? 'editor' }, {
      onSuccess: () => setEmail(''),
    })
  }

  const handleResend = (emailAddr: string) => {
    resendMutation.mutate(emailAddr)
  }

  const handleGenerateLink = () => {
    generateLinkMutation.mutate(docId ?? 'current', {
      onSuccess: (data: any) => {
        const url = data?.url ?? data?.token ?? window.location.origin + '/validate/generated'
        setGeneratedLink(url)
      },
    })
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const handleEditRole = (emailAddr: string, newRole: string) => {
    if (emailAddr) {
      updateCollabMutation.mutate({ email: emailAddr, role: ROLE_MAP[newRole] ?? 'editor' })
    }
  }

  const handleRemove = (emailAddr: string) => {
    if (emailAddr) {
      removeCollabMutation.mutate(emailAddr)
    }
  }

  const handleSecurityToggle = (key: 'passwordProtect' | 'expiration' | 'nda') => {
    const newToggles = { ...securityToggles, [key]: !securityToggles[key] }
    setSecurityToggles(newToggles)
    if (docId) {
      updateShareSettings.mutate({ documentId: docId, ...newToggles })
    }
  }

  const handleViewAccessLogs = () => {
    setShowAccessLogs(true)
  }

  return (
    <div className="min-h-screen bg-surface-studio">
      <main className="max-w-4xl mx-auto py-12 px-margin-desktop">
        <Link to={docId ? "/editor" : "/library"} search={docId ? { id: docId } : {}} className="flex items-center gap-2 mb-6 text-on-surface-variant font-label-md text-label-md hover:text-ai-vibrant transition-colors">
          <Icon name="arrow_back" className="text-sm" />
          <span>{docId ? "Retour au document" : "Retour a la bibliotheque"}</span>
        </Link>

        <div className="mb-10">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Partage securise et controle d&apos;acces</h2>
          <p className="text-on-surface-variant font-body-md max-w-2xl">Gerer les autorisations de documents sensibles, suivre les collaborateurs actifs et configurer les protocoles de securite souverains pour le partage externe.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 space-y-gutter">
            <InviteForm
              email={email}
              role={role}
              onEmailChange={setEmail}
              onRoleChange={setRole}
              onSend={handleSendInvite}
              sending={inviteMutation.isPending}
            />
            <CollaboratorList
              rows={rows}
              resendPending={resendMutation.isPending}
              resendVariables={resendMutation.variables}
              onResend={handleResend}
              onEditRole={handleEditRole}
              onRemove={handleRemove}
              updatePending={updateCollabMutation.isPending}
              removePending={removeCollabMutation.isPending}
            />
          </div>

          <div className="space-y-gutter">
            <ExternalAccessPanel
              docId={docId}
              generatedLink={generatedLink}
              copied={copied}
              onGenerate={handleGenerateLink}
              generating={generateLinkMutation.isPending}
              onCopy={handleCopyLink}
              securityToggles={securityToggles}
              onSecurityToggle={handleSecurityToggle}
            />
            <AuditPanel onViewLogs={handleViewAccessLogs} />
          </div>
        </div>

        <AccessLogModal open={showAccessLogs} logs={accessLogs} onClose={() => setShowAccessLogs(false)} />

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
