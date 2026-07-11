import { useState } from 'react'
import Icon from '../Icon'
import { Button } from '../ui/button'
import { ROLES, ROLE_MAP, DISPLAY_ROLE_MAP } from './types'
import type { CollaboratorRow } from './types'

interface CollaboratorListProps {
  rows: CollaboratorRow[]
  resendPending: boolean
  resendVariables: any
  onResend: (email: string) => void
  onEditRole: (email: string, newRole: string) => void
  onRemove: (email: string) => void
  updatePending: boolean
  removePending: boolean
}

export default function CollaboratorList({
  rows,
  resendPending,
  resendVariables,
  onResend,
  onEditRole,
  onRemove,
  updatePending,
  removePending,
}: CollaboratorListProps) {
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
  const [editRoleOpen, setEditRoleOpen] = useState<number | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)

  const toggleDropdown = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index)
  }

  const getCurrentRoleDisplayName = (row: CollaboratorRow): string => {
    const internalRole = ROLE_MAP[row.role] ?? row.role.toLowerCase()
    return DISPLAY_ROLE_MAP[internalRole] ?? row.role
  }

  return (
    <>
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-primary">Collaborateurs actuels</h3>
          <span className="px-2 py-1 bg-surface-variant/50 text-on-surface-variant font-label-sm text-label-sm rounded uppercase tracking-tighter">{rows.length} actifs</span>
        </div>
        <div className="divide-y divide-outline-variant">
          {rows.map((c, index) => (
            <div key={c.email ?? `${c.name ?? 'unknown'}-${index}`} className={`p-4 flex items-center justify-between hover:bg-surface-studio transition-colors ${c.pending ? 'opacity-75' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center ${c.pending ? 'border-2 border-dashed border-outline' : ''}`}>
                  {c.icon ? <Icon name={c.icon} className="text-primary" fill /> : <Icon name="person" className="text-outline" />}
                </div>
                <div>
                  <p className="font-body-md font-semibold text-primary">{c.name}</p>
                  <p className={`font-label-sm text-label-sm ${c.pending ? 'text-status-review' : 'text-on-surface-variant'}`}>
                    {c.pending ? 'Invitation en attente' : c.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 relative">
                <span className={`font-label-sm text-label-sm uppercase px-2 py-1 rounded ${c.badge}`}>{c.role}</span>
                {c.pending ? (
                  <Button variant="link" className="text-secondary font-label-md text-label-md p-0 h-auto" onClick={() => onResend(c.email ?? '')}>
                    {resendPending && resendVariables === c.email ? 'Envoi...' : 'Renvoyer'}
                  </Button>
                ) : c.role === 'Proprietaire' ? null : (
                  <div className="relative">
                    <button className="cursor-pointer" onClick={() => toggleDropdown(index)}><Icon name="more_vert" className="text-outline" /></button>
                    {openDropdownIndex === index && (
                      <div className="absolute right-0 top-8 bg-white border border-outline-variant rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                        <button
                          className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-studio flex items-center gap-2"
                          onClick={() => { setEditRoleOpen(index); setOpenDropdownIndex(null) }}
                          disabled={updatePending}
                        >
                          <Icon name="edit" className="text-sm" />
                          Modifier le role
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-studio flex items-center gap-2 text-error"
                          onClick={() => { setConfirmRemove(index); setOpenDropdownIndex(null) }}
                          disabled={removePending}
                        >
                          <Icon name="person_remove" className="text-sm" />
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {confirmRemove !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-2">Retirer le collaborateur</h3>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Voulez-vous retirer <strong>{rows[confirmRemove]?.name}</strong> de cette session ? Cette action est irreversible.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmRemove(null)}>Annuler</Button>
              <Button
                className="flex-1 bg-error text-white hover:bg-error/90"
                onClick={() => { onRemove(rows[confirmRemove]?.email ?? ''); setConfirmRemove(null) }}
                disabled={removePending}
              >
                {removePending ? 'Retrait...' : 'Retirer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editRoleOpen !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setEditRoleOpen(null)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-4">Modifier le role</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              {rows[editRoleOpen]?.name} ({rows[editRoleOpen]?.email})
            </p>
            <div className="space-y-2 mb-6">
              {ROLES.map((r) => {
                const currentDisplayName = getCurrentRoleDisplayName(rows[editRoleOpen])
                return (
                  <button
                    key={r}
                    onClick={() => { onEditRole(rows[editRoleOpen]?.email ?? '', r); setEditRoleOpen(null) }}
                    disabled={updatePending}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all font-body-sm ${r === currentDisplayName ? 'bg-secondary/10 border-secondary text-secondary' : 'border-outline-variant hover:bg-surface-studio text-on-surface'}`}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setEditRoleOpen(null)}>Annuler</Button>
          </div>
        </div>
      )}
    </>
  )
}
