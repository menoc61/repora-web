import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCreateProject } from './useQueries'
import { useWorkspaceStore } from '../stores'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const createProject = useCreateProject()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (!isMod) return

      switch (e.key.toLowerCase()) {
        case 'n': {
          e.preventDefault()
          createProject.mutateAsync({ name: 'Nouveau projet' }).then((project) => {
            navigate({ to: '/onboarding/$id', params: { id: project.id } })
          }).catch(() => {})
          break
        }
        case 's': {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('repora:save'))
          break
        }
        case 'e': {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('repora:export'))
          break
        }
        case 'k': {
          e.preventDefault()
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
          searchInput?.focus()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, createProject])
}
