import type { ReactNode } from 'react'

interface InspectorPanelProps {
  children: ReactNode
}

export function InspectorPanel({ children }: InspectorPanelProps) {
  return (
    <aside className="w-inspector-width border-l border-outline-variant bg-surface-studio flex flex-col shrink-0 overflow-hidden">
      {children}
    </aside>
  )
}

export default InspectorPanel
