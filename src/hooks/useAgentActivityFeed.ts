export interface ActivityItem { id: string; agent: string; action: string; at: number }

export function reduceActivity(feed: ActivityItem[], ev: any): ActivityItem[] {
  let action = ''
  if (ev?.type === 'agent_status') action = `${ev.status}${ev.section_title ? ' → ' + ev.section_title : ''}`
  else if (ev?.type === 'tool_call') action = `appelle outil ${ev.tool}`
  else if (ev?.type === 'section_complete') action = `section terminée${ev.title ? ' : ' + ev.title : ''}`
  else if (ev?.type === 'done') action = 'génération terminée'
  else return feed
  const item: ActivityItem = { id: `${Date.now()}-${Math.random()}`, agent: ev.agent ?? 'Système', action, at: Date.now() }
  return [item, ...feed].slice(0, 100)
}

import { useState, useEffect } from 'react'
import { useDocumentStream } from './useQueries'

export function useAgentActivityFeed(docId: string | undefined) {
  const { events } = useDocumentStream(docId)
  const [feed, setFeed] = useState<ActivityItem[]>([])
  useEffect(() => {
    if (!events?.length) return
    setFeed((prev) => reduceActivity(prev, events[events.length - 1]))
  }, [events])
  return feed
}