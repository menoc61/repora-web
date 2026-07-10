import { useSearch } from '@tanstack/react-router'
import VersionHistoryView from '../components/version-history'

export default function VersionHistory() {
  const search = useSearch({ from: '/history' })
  const docId = search.id
  return <VersionHistoryView docId={docId} />
}
