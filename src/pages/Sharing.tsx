import { useSearch } from '@tanstack/react-router'
import SharingView from '../components/sharing'

export default function Sharing() {
  const search = useSearch({ from: '/sharing' })
  const docId = search.id
  return <SharingView docId={docId} />
}
