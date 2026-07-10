import Icon from './Icon'
import { useAuthStore } from '../stores'

type Role = 'redacteur' | 'validateur' | 'admin' | 'super_admin'

export function RequireRole({ role, children, fallback }: {
  role: Role | Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const userRole = useAuthStore(s => s.user?.role) as Role | null | undefined
  const roles = Array.isArray(role) ? role : [role]
  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback ?? <AccessDenied />}</>
  }
  return <>{children}</>
}

export function AccessDenied() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-outline-variant rounded-lg p-8 max-w-md w-full text-center space-y-4 mx-auto">
        <Icon name="lock" className="text-on-surface-variant text-5xl" />
        <h2 className="font-headline-md text-headline-md text-primary">Acces refuse</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Vous n&apos;avez pas les droits necessaires pour acceder a cette section.
        </p>
      </div>
    </div>
  )
}
