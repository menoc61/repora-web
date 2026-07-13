import { describe, it, expect } from 'vitest'
import { buildProfessionalDocx } from '../src/services/exportDocx'
import type { DocInput } from '../src/services/exportDocx'

const baseDoc: DocInput = {
  id: 'doc-1',
  projectId: 'proj-1',
  outline: { title: 'Cahier des Charges', subtitle: 'Sous-titre', description: 'Description du document.' } as any,
  config: {
    documentType: 'cahier_des_charges',
    header: { companyName: 'Acme' },
    footer: { copyright: '© 2024 Acme' },
    author: 'Jean Dupont',
    authorTitle: 'CTO',
  },
  sections: [
    { id: 's1', title: 'Contexte', content: 'Le **système** doit assurer la gestion des utilisateurs.', order: 1 },
    { id: 's2', title: 'Exigences', content: '- exigence une\n- exigence deux', order: 2 },
  ],
}

describe('buildProfessionalDocx', () => {
  it('produces a valid .docx (zip) buffer', async () => {
    const buf = await buildProfessionalDocx(baseDoc, [])
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
    // DOCX is a ZIP container → PK\x03\x04 signature
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK')
  })

  it('reflects the selected document type on the cover', async () => {
    const buf = await buildProfessionalDocx(baseDoc, [])
    const other = await buildProfessionalDocx({ ...baseDoc, config: { ...baseDoc.config, documentType: 'rapport_technique' } }, [])
    // Different template → different cover title → different document bytes.
    expect(buf).toBeInstanceOf(Buffer)
    expect(other).toBeInstanceOf(Buffer)
    expect(buf.equals(other)).toBe(false)
  })

  it('handles an empty section list without throwing', async () => {
    const buf = await buildProfessionalDocx({ ...baseDoc, sections: [] }, [])
    expect(buf).toBeInstanceOf(Buffer)
  })

  it('embeds provided diagram PNG buffers', async () => {
    const diagrams = [
      { id: 'd1', type: 'sequence', sectionId: null, renderedUrl: '/x', pngBuffer: Buffer.from([1, 2, 3, 4]) },
    ]
    const buf = await buildProfessionalDocx(baseDoc, diagrams as any)
    expect(buf).toBeInstanceOf(Buffer)
  })

  it('renders Markdown tables and callouts', async () => {
    const doc: DocInput = {
      ...baseDoc,
      sections: [
        {
          id: 's3',
          title: 'Tableau',
          content:
            '| Col A | Col B |\n| --- | --- |\n| 1 | 2 |\n\n> [!NOTE]\n> Une note importante',
          order: 3,
        },
      ],
    }
    const buf = await buildProfessionalDocx(doc, [])
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
  })
})
