import { useCallback } from 'react'
import Icon from '../Icon'
import type { OutlineSection } from './EditorCanvas'

interface OutlineItemProps {
  label: string
  done?: boolean
  active?: boolean
  sub?: string[]
  onClick?: () => void
}

export function OutlineItem({ label, done, active, sub, onClick }: OutlineItemProps) {
  return (
    <div>
      <div
        className={`flex items-start gap-3 group cursor-pointer py-1 px-2 -mx-2 rounded transition-colors ${active ? 'bg-ai-vibrant/5' : 'hover:bg-surface-container-low'}`}
        onClick={onClick}
      >
        <div className={`w-4 h-4 border mt-0.5 rounded-sm flex items-center justify-center shrink-0 ${done ? 'bg-status-final border-none' : active ? 'border-ai-vibrant' : 'border-outline-variant'}`}>
          {done && <Icon name="check" className="text-white" style={{ fontSize: 12 }} />}
          {active && <div className="w-1.5 h-1.5 bg-ai-vibrant rounded-full animate-pulse" />}
        </div>
        <span className={`text-body-sm ${active ? 'text-ai-vibrant font-medium' : done ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
      </div>
      {sub && sub.length > 0 && (
        <div className="ml-7 space-y-1 border-l border-outline-variant pl-4 py-1">
          {sub.map((s, i) => (
            <div key={`${label}-sub-${i}`} className="text-body-sm text-on-surface-variant hover:text-primary cursor-pointer py-0.5">{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

interface OutlineTreeProps {
  sections: OutlineSection[]
  onSectionClick?: (title: string) => void
}

export function OutlineTree({ sections, onSectionClick }: OutlineTreeProps) {
  const handleClick = useCallback((title: string) => {
    onSectionClick?.(title)
  }, [onSectionClick])

  return (
    <>
      <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-4">Plan du document</h3>
      {sections.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant italic py-4">Aucune section definie.</p>
      ) : (
        <nav className="space-y-1">
          {sections.map((section, idx) => (
            <OutlineItem
              key={`${section.title}-${idx}`}
              label={section.title}
              done={section.done}
              active={section.active}
              sub={section.sub}
              onClick={() => handleClick(section.title)}
            />
          ))}
        </nav>
      )}
    </>
  )
}

export default OutlineTree
