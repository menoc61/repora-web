import { describe, it, expect } from 'vitest'
import { mergeTemplateWithOutline } from '../src/services/outline.service'
import type { OutlineJson } from '../src/services/outline.service'

describe('mergeTemplateWithOutline', () => {
  const templateOutline: OutlineJson = {
    title: 'Template Document',
    chapters: [
      {
        title: 'Introduction',
        sections: [
          { title: 'Contexte', order: 1 },
          { title: 'Objectifs', order: 2 },
        ],
      },
      {
        title: 'Specifications techniques',
        sections: [
          { title: 'Architecture', order: 3 },
          { title: 'API', order: 4 },
        ],
      },
    ],
  }

  it('preserves template structure when planner output is empty', () => {
    const plannerOutline: OutlineJson = {
      title: 'Untitled',
      chapters: [],
    }
    const result = mergeTemplateWithOutline(templateOutline, plannerOutline)
    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].title).toBe('Introduction')
    expect(result.chapters[1].title).toBe('Specifications techniques')
  })

  it('uses template title when planner produces generic title', () => {
    const plannerOutline: OutlineJson = {
      title: 'Cahier des Charges',
      chapters: [{ title: 'Intro', sections: [{ title: 'Apercu', order: 1 }] }],
    }
    const result = mergeTemplateWithOutline(templateOutline, plannerOutline)
    expect(result.title).toBe('Template Document')
  })

  it('fills in planner-generated titles where template sections are empty', () => {
    const templateWithEmptySections: OutlineJson = {
      title: 'Template',
      chapters: [
        {
          title: 'Intro',
          sections: [
            { title: '', order: 1 },
            { title: '', order: 2 },
          ],
        },
      ],
    }
    const plannerOutline: OutlineJson = {
      title: 'Cahier des Charges',
      chapters: [
        {
          title: 'Intro',
          sections: [
            { title: 'Overview', order: 1 },
            { title: 'Goals', order: 2 },
          ],
        },
      ],
    }
    const result = mergeTemplateWithOutline(templateWithEmptySections, plannerOutline)
    expect(result.chapters[0].sections[0].title).toBe('Overview')
    expect(result.chapters[0].sections[1].title).toBe('Goals')
  })

  it('appends planner chapters that do not match template chapters', () => {
    const plannerOutline: OutlineJson = {
      title: 'Planner Doc',
      chapters: [
        {
          title: 'Extra Chapter',
          sections: [{ title: 'Extra Section', order: 1 }],
        },
      ],
    }
    const result = mergeTemplateWithOutline(templateOutline, plannerOutline)
    // Should have template chapters + the extra planner chapter
    expect(result.chapters.length).toBeGreaterThanOrEqual(3)
    const extraChapter = result.chapters.find(c => c.title === 'Extra Chapter')
    expect(extraChapter).toBeDefined()
  })

  it('matches planner chapter to template chapter by fuzzy title match', () => {
    const template: OutlineJson = {
      title: 'Template',
      chapters: [
        {
          title: 'Introduction',
          sections: [
            { title: 'Placeholder 1', order: 1 },
            { title: 'Placeholder 2', order: 2 },
          ],
        },
      ],
    }
    const planner: OutlineJson = {
      title: 'My Doc',
      chapters: [
        {
          title: 'introduction', // different case
          sections: [
            { title: 'Contexte du projet', order: 1 },
            { title: 'Objectifs specifiques', order: 2 },
          ],
        },
      ],
    }
    const result = mergeTemplateWithOutline(template, planner)
    // The planner sections should replace the template placeholders because "introduction" fuzzy-matches "Introduction"
    expect(result.chapters[0].sections[0].title).toBe('Contexte du projet')
    expect(result.chapters[0].sections[1].title).toBe('Objectifs specifiques')
  })
})
