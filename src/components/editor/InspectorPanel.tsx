import type { ReactNode } from 'react'

interface InspectorPanelProps {
  children: ReactNode
}

export function InspectorPanel({ children }: InspectorPanelProps) {
  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-inspector-width bg-surface border-l border-outline-variant flex flex-col z-40 overflow-hidden">
      {children}
    </aside>
  )
}

export default InspectorPanel
