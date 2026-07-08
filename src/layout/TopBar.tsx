import { Link } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

interface TopBarProps {
  title?: string
  tabs?: Array<{ label: string; to: string; active?: boolean }>
  right?: React.ReactNode
  searchPlaceholder?: string
}

export default function TopBar({ title, tabs = [], right = null, searchPlaceholder = 'Search documents...' }: TopBarProps) {
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
          {right || (
            <div className="flex items-center gap-2 mr-4">
              <Button variant="outline" size="sm">Export</Button>
              <Button size="sm" className="bg-ai-vibrant text-white hover:opacity-90">Share</Button>
            </div>
          )}
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="notifications" />
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="history" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant">
            <div className="w-full h-full bg-primary-container flex items-center justify-center text-inverse-primary font-label-md text-[10px]">
              AC
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
