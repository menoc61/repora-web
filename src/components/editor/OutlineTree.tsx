import Icon from '../Icon'
import type { OutlineSection } from './EditorCanvas'

interface OutlineItemProps {
  label: string
  done?: boolean
  active?: boolean
  sub?: string[]
}

export function OutlineItem({ label, done, active, sub }: OutlineItemProps) {
  return (
    <div>
      <div className="flex items-start gap-3 group cursor-pointer">
        <div className={`w-4 h-4 border mt-1 rounded-sm flex items-center justify-center ${done ? 'bg-status-final border-none' : active ? 'border-ai-vibrant' : 'border-outline-variant'}`}>
          {done && <Icon name="check" className="text-white" style={{ fontSize: 12 }} />}
          {active && <div className="w-1.5 h-1.5 bg-ai-vibrant rounded-full animate-pulse" />}
        </div>
        <span className={`text-body-sm font-medium ${active ? 'text-ai-vibrant' : done ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
      </div>
      {sub && (
        <div className="ml-7 space-y-2 border-l border-outline-variant pl-4 py-1">
          {sub.map((s) => (
            <div key={s} className="text-body-sm text-on-surface-variant hover:text-primary">{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

interface OutlineTreeProps {
  sections: OutlineSection[]
}

export function OutlineTree({ sections }: OutlineTreeProps) {
  return (
    <>
      <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-4">Plan du document</h3>
      <nav className="space-y-3">
        {sections.map((section) => (
          <OutlineItem
            key={section.title}
            label={section.title}
            done={section.done}
            active={section.active}
            sub={section.sub}
          />
        ))}
      </nav>
    </>
  )
}

export default OutlineTree
