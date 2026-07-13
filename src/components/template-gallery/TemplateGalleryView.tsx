import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTemplates, useCreateDocumentFromTemplate, useGenerateDocument } from '../../hooks/useQueries'
import type { Template } from '../../schemas'
import { TEMPLATES, FILTERS, type TemplateItem } from './types'
import SearchNav from './SearchNav'
import FilterChips from './FilterChips'
import TemplateCard from './TemplateCard'
import CreateTemplateCard from './CreateTemplateCard'
import OrchestratorBanner from './OrchestratorBanner'

export default function TemplateGalleryView() {
  const [active, setActive] = useState<string>('Tous les modeles')
  const [searchQuery, setSearchQuery] = useState('')
  const { data: apiTemplates = [], isLoading } = useTemplates()
  const createFromTemplate = useCreateDocumentFromTemplate()
  const generateDoc = useGenerateDocument()
  const navigate = useNavigate()

  const cards: TemplateItem[] = apiTemplates.length > 0
    ? apiTemplates.map((t) => ({
        title: t.title,
        dept: t.department,
        icon: t.icon,
        color: 'bg-secondary-container text-secondary',
        // TODO: API does not return agent data; wire to GET /templates/:id/agents when endpoint exists
        agents: [] as [string, string][],
      }))
    : TEMPLATES

  let filtered = active === 'Tous les modeles' ? cards : cards.filter((c) => c.dept === active)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((c) =>
      c.title.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q)
    )
  }

  const handleUseTemplate = async (tpl: TemplateItem) => {
    const t = apiTemplates.find((at) => at.title === tpl.title)
    if (!t) return
    try {
      // Create project + document from template (backend sets template outline)
      const project = await createFromTemplate.mutateAsync({ templateId: t.id, projectName: tpl.title })
      const docId = project.documentId ?? project.id
      // Trigger generation with templateId for template-aware pipeline
      await generateDoc.mutateAsync({
        projectId: project.id,
        prompt: tpl.title,
        templateId: t.id,
      })
      navigate({ to: '/editor', search: { id: docId } })
    } catch {
      // Errors surfaced via mutation states
    }
  }

  const isPending = createFromTemplate.isPending || generateDoc.isPending

  return (
    <>
      <SearchNav searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="p-gutter max-w-[1200px] mx-auto">
        <div className="mb-10">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Bibliotheque de modeles</h2>
          <p className="text-on-surface-variant font-body-md max-w-2xl">
            Deployez des environnements souverains preconfigures adaptes aux flux de travail departementaux complexes. Chaque modele inclut la logique d&apos;orchestration et des agents IA specialises par domaine.
          </p>
          <FilterChips filters={FILTERS} active={active} onSelect={setActive} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((t, i) => (
            <TemplateCard key={`${t.title}-${i}`} template={t} onUse={() => handleUseTemplate(t)} isPending={isPending} />
          ))}

          <CreateTemplateCard />
        </div>

        <OrchestratorBanner />
      </div>
    </>
  )
}
