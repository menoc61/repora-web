import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Input } from '../components/ui/input'
import { notify } from '../components/Toast'
import { useAuthStore } from '../stores'
import { NotificationBell } from '../components/NotificationCenter'

interface TopBarProps {
  title?: string
  tabs?: Array<{ label: string; to: string; active?: boolean }>
  right?: React.ReactNode
  searchPlaceholder?: string
}

export default function TopBar({ title, tabs = [], right = null, searchPlaceholder = 'Rechercher des documents...' }: TopBarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const userInitials = user?.name ? user.name.split(' ').filter(Boolean).map((n: string) => n[0] || '').join('').toUpperCase().slice(0, 2) || '??' : '??'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate({ to: '/login' })
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
      notify({
        type: 'info',
        title: 'Recherche',
        message: `Recherche de "${(e.target as HTMLInputElement).value.trim()}" en cours...`,
        timeout: 3000,
      })
    }
  }

  return (
    <header className="sticky top-0 w-full bg-surface-studio z-40 border-b border-outline-variant">
      <div className="flex justify-between items-center h-16 px-gutter">
        <div className="flex items-center gap-8">
          {title && <h2 className="font-headline-md text-headline-md font-black text-primary">{title}</h2>}
          <div className="relative">
            <Icon name="search" className="text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-1.5 w-64 text-body-sm focus:ring-2 focus:ring-ai-vibrant"
              placeholder={searchPlaceholder}
              type="text"
              onKeyDown={handleSearch}
            />
          </div>
          {tabs.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {tabs.map((t) => (
                <Link
                  key={t.label}
                  to={t.to}
                  className={
                    t.active
                      ? 'text-primary border-b-2 border-ai-vibrant pb-1 font-label-md'
                      : 'text-on-surface-variant hover:text-ai-vibrant transition-all font-label-md'
                  }
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {right}
          <NotificationBell />
          <button className="text-on-surface-variant hover:text-primary transition-colors" onClick={() => navigate({ to: '/history' })}>
            <Icon name="history" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant hover:border-ai-vibrant transition-colors cursor-pointer"
            >
              <div className="w-full h-full bg-primary-container flex items-center justify-center text-inverse-primary font-label-md text-[10px]">
                {userInitials}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-outline-variant py-1 z-50" style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.08)' }}>
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="font-label-md text-primary-container font-medium">{user?.name || 'Utilisateur'}</p>
                  <p className="font-body-sm text-secondary">{user?.email || ''}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-primary-container hover:bg-surface transition-colors"
                >
                  <Icon name="settings" className="text-base" />
                  Parametres
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="logout" className="text-base" />
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
