import Icon from '../Icon'
import { Version } from './types'

interface VersionCardProps {
  version: Version
  active: boolean
  selected: boolean
  onSelect: () => void
}

export default function VersionCard({ version, active, selected, onSelect }: VersionCardProps) {
  return (
    <div key={version.version} onClick={onSelect}>
      {version.older && (
        <div className="flex items-center gap-2 py-4">
          <div className="h-[1px] bg-outline-variant flex-1" />
          <span className="font-label-sm text-label-sm text-outline">Hier</span>
          <div className="h-[1px] bg-outline-variant flex-1" />
        </div>
      )}
      <div className={`p-4 rounded-lg cursor-pointer transition-all ${
        active
          ? 'bg-primary-container text-on-primary-container border-2 border-primary ring-2 ring-primary/10'
          : selected
            ? 'bg-secondary-container/30 border-2 border-secondary ring-2 ring-secondary/10'
            : 'bg-surface hover:bg-surface-variant/30 border border-outline-variant'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${active ? 'bg-primary text-on-primary' : selected ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant'}`}>{version.version}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{version.time}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {version.isAI ? (
            <div className="w-5 h-5 rounded-full bg-ai-vibrant flex items-center justify-center">
              <Icon name="auto_awesome" className="text-[12px] text-white" fill />
            </div>
          ) : version.isAuto ? (
            <div className="w-5 h-5 rounded-full bg-on-tertiary-container flex items-center justify-center">
              <Icon name="person" className="text-[12px] text-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200" />
          )}
          <span className="font-label-md text-label-md">{version.user}</span>
        </div>
        <p className={`font-body-sm text-body-sm leading-snug ${active ? 'opacity-90' : 'text-on-surface-variant'}`}>{version.desc}</p>
        {version.additions ? (
          <div className="mt-3 flex gap-2">
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-status-final">
              <span className="w-1.5 h-1.5 rounded-full bg-status-final" /> +{version.additions}
            </span>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-error">
              <span className="w-1.5 h-1.5 rounded-full bg-error" /> -{version.removals}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
