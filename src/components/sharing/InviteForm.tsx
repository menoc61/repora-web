import Icon from '../Icon'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select'
import { ROLES } from './types'

interface InviteFormProps {
  email: string
  role: string
  onEmailChange: (v: string) => void
  onRoleChange: (v: string) => void
  onSend: () => void
  sending: boolean
}

export default function InviteForm({
  email,
  role,
  onEmailChange,
  onRoleChange,
  onSend,
  sending,
}: InviteFormProps) {
  return (
    <section className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
        <Icon name="person_add" className="text-secondary" />
        Inviter des collaborateurs
      </h3>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              className="w-full px-4 py-3 bg-surface-studio border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
              placeholder="Saisir l'adresse e-mail..."
              type="email"
              value={email}
              onChange={(e) => onEmailChange((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSend() }}
            />
          </div>
          <div className="relative min-w-[140px]">
            <Select value={role} onValueChange={(v) => onRoleChange(v ?? ROLES[0])}>
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
        <div className="flex justify-end">
          <Button
            className="bg-ai-vibrant text-white px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-ai-vibrant/90 transition-all"
            onClick={onSend}
            disabled={sending || !email.trim()}
          >
            {sending ? 'Envoi...' : "Envoyer l'invitation"}
          </Button>
        </div>
      </div>
    </section>
  )
}
