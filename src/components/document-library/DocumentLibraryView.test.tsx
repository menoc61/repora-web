import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DocumentLibraryView from './DocumentLibraryView'

const deleteMock = vi.fn()
const saveMock = vi.fn()
const docs = [
  { id: 'doc-1', projectId: 'p1', title: 'Doc One', status: 'draft', department: 'Legal', author: { name: 'A' }, collaborators: [], content: '', version: 'v1', createdAt: '', updatedAt: '' },
  { id: 'doc-2', projectId: 'p2', title: 'Doc Two', status: 'draft', department: 'Legal', author: { name: 'A' }, collaborators: [], content: '', version: 'v1', createdAt: '', updatedAt: '' },
] as any

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

vi.mock('@/stores', () => ({
  useWorkspaceStore: () => ({ setActiveView: vi.fn() }),
  useAuthStore: () => ({ user: { name: 'Test' }, logout: vi.fn() }),
}))

vi.mock('@/hooks/useQueries', () => ({
  useDocuments: () => ({ data: docs }),
  useExportDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGenerateDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAnalytics: () => ({ data: {} }),
  useActivity: () => ({ data: [] }),
  useDeleteDocument: () => ({ mutate: deleteMock, isPending: false }),
  useSaveDocument: () => ({ mutate: saveMock }),
}))

// NOTE: ConfirmDialog is NOT mocked here — we exercise the real base-ui Dialog.
describe('DocumentLibraryView bulk delete (real ConfirmDialog)', () => {
  beforeEach(() => {
    deleteMock.mockClear()
    saveMock.mockClear()
  })

  it('selects rows and bulk-deletes them through the real dialog', () => {
    render(<DocumentLibraryView />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // Doc One
    fireEvent.click(checkboxes[2]) // Doc Two

    expect(screen.getByText(/Supprimer \(2\)/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Supprimer \(2\)/))

    // Real dialog confirm button
    const confirm = screen.getByRole('button', { name: 'Supprimer' })
    fireEvent.click(confirm)

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(deleteMock).toHaveBeenCalledWith('doc-1')
    expect(deleteMock).toHaveBeenCalledWith('doc-2')
  })
})
