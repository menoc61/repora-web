import Toggle from './Toggle'

interface SecuritySettingsProps {
  toggles: { passwordProtect: boolean; expiration: boolean; nda: boolean }
  onToggle: (key: 'passwordProtect' | 'expiration' | 'nda') => void
}

const SECURITY_ITEMS = [
  { key: 'passwordProtect' as const, label: 'Protection par mot de passe', desc: 'Connexion obligatoire pour les detenteurs de lien' },
  { key: 'expiration' as const, label: "Date d'expiration", desc: 'Le lien expire dans 7 jours' },
  { key: 'nda' as const, label: 'Clause NDA', desc: 'Signature electronique requise pour voir' },
]

export default function SecuritySettings({ toggles, onToggle }: SecuritySettingsProps) {
  return (
    <div className="space-y-4 border-t border-on-primary-container/20 pt-6">
      {SECURITY_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-white">{item.label}</span>
            <span className="text-[10px] text-on-primary-container/70">{item.desc}</span>
          </div>
          <Toggle checked={toggles[item.key]} onChange={() => onToggle(item.key)} />
        </div>
      ))}
    </div>
  )
}
