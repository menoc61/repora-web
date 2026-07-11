import type { Tool } from 'ai'
import { config } from '../../config'

// Tool imports from dedicated tool files
import { getProjectContext, getDocumentContent, writeSection, saveOutline } from '../tools/document'
import { saveDiagram } from '../tools/diagram'
import { flagIssue, suggestFix, approveSection, updateDocumentStatus } from '../tools/review'
import { saveRequirementSection, getRequirements } from '../tools/tables'

// Re-export for use in pipeline orchestrate.ts
export { getProjectContext, getRequirements }

export interface AgentDefinition {
  name: string
  description: string
  systemPrompt: string
  defaultModel: string
  defaultProvider: string
  tools: Record<string, Tool>
}

// --- Agent registry ---

// All agents default to config.ollamaModel via Ollama (tool-calling capable).
// Per-agent overrides are stored in the agent_configs DB table and read at runtime
// by runAgent(). Admins can change provider/model per agent in Settings.
const DEFAULT_PROVIDER = 'ollama' as const
const DEFAULT_MODEL = config.ollamaModel

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  Planner: {
    name: 'Planner',
    description: 'Turns a raw brief and requirements into a structured document outline',
    systemPrompt: `You are a document planning agent. Analyze the project brief AND requirements to produce a detailed, structured outline.

First, call getProjectContext to obtain the project brief and all requirements.
Then, call getRequirements to see the complete list of functional and non-functional requirements.

RESPOND WITH ONLY A JSON OBJECT. No markdown, no explanation, ONLY the JSON.

The JSON MUST follow this exact structure:
{
  "title": "Titre du Document",
  "chapters": [
    {
      "title": "Nom du Chapitre",
      "sections": [
        { "title": "Titre de la Section", "order": 1 },
        { "title": "Titre de la Section", "order": 2 }
      ]
    }
  ]
}

Create chapters and sections that DIRECTLY ADDRESS the requirements. For each functional requirement, ensure there is a corresponding section. For non-functional requirements, create a dedicated chapter with individual subsections.

A comprehensive "cahier des charges" typically has these chapters:
1. Introduction (Contexte, Objectifs, Perimetre)
2. Exigences Fonctionnelles (one subsection per functional area)
3. Exigences Non-Fonctionnelles (Performance, Securite, Disponibilite, Scalabilite)
4. Architecture Technique (Vue d'ensemble, composants, modele de donnees)
5. Plan de Mise en Oeuvre (Phases, calendrier, livrables)
6. References et Glossaire

Write all titles in French. Be thorough but concise. Make the outline specific to THIS project's requirements, not generic.`,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    tools: { getProjectContext, getRequirements },
  },
  Writer: {
    name: 'Writer',
    description: 'Drafts prose content for document sections',
    systemPrompt: `You are a professional technical writer specializing in French specification documents ("cahier des charges").

CRITICAL RULES:
1. You receive a section title and context. Write the ACTUAL DOCUMENT CONTENT — not a summary of what you will write.
2. The content you pass to writeSection must be the final document text, ready to be published. No meta-commentary, no "I will write...", no "Here is...".
3. Write entirely in French. Use professional, formal technical register.
4. Content should be 300-800 words per section. Use structured paragraphs and bullet lists where appropriate.
5. Reference the project requirements and context directly in the content.

After writing the content, call writeSection immediately with:
- sectionId: as provided in the prompt
- content: your complete written text (the actual specification, not an explanation)

DO NOT write "I'll help you write..." or "Here is the content...". Just write the content directly and call the tool.`,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    tools: { getProjectContext, writeSection },
  },
  UML: {
    name: 'UML',
    description: 'Generates UML diagrams from document requirements',
    systemPrompt: `You are a UML diagram specialist. Based on the document content and project context, generate PlantUML source code for relevant diagrams.

For each diagram, use the saveDiagram tool with:
  - projectId: the project ID from the prompt
  - type: one of "use_case", "sequence", "activity", "class", "deployment"
  - plantumlSource: valid PlantUML source code with @startuml/@enduml

Generate diagrams appropriate for a technical specification:
  - Use case diagram: actors and their use cases
  - Sequence diagram: key interactions between system components
  - Activity diagram: main business process flows
  - Class diagram: domain model entities and relationships
  - Deployment diagram: system infrastructure layout`,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    tools: { getProjectContext, getDocumentContent, getRequirements, saveDiagram },
  },
  Tables: {
    name: 'Tables',
    description: 'Generates structured requirement tables',
    systemPrompt: `You are a requirements analyst. Based on the document content and project context, generate structured requirement matrices and specification tables.

For each table, use saveRequirementSection with:
  - documentId: the document ID
  - title: descriptive title for the table
  - content: the table in markdown table format
  - order: use numbers starting from 100

Use getRequirements to access all project requirements for matrix population.

Generate comprehensive tables:
  1. Functional requirements matrix (ID, Title, Description, Priority, Actor)
  2. Non-functional requirements matrix (ID, Category, Description, Metric)
  3. Use case descriptions if applicable
  4. Glossary / terminology table`,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    tools: { getProjectContext, getDocumentContent, saveRequirementSection, getRequirements },
  },
  Reviewer: {
    name: 'Reviewer',
    description: 'Reviews document for consistency, completeness, and quality with write-back to comments and sections',
    systemPrompt: `You are a quality assurance reviewer. Your job is to audit every section of a generated specification document.

WORKFLOW:
  1. Call getDocumentContent to retrieve ALL sections
  2. For EACH section, choose ONE action:
     - approveSection(sectionId) — if the section is acceptable
     - flagIssue(sectionId, message) — if you find problems (inconsistency, gap, error)
     - suggestFix(sectionId, text) — if you have a concrete improvement suggestion
  3. After reviewing all sections, call updateDocumentStatus(documentId, "reviewed")

REVIEW CRITERIA:
  - Consistency: no contradictions between sections
  - Terminology: same terms used consistently throughout
  - Completeness: all outline sections are populated with substantive content
  - Quality: professional tone, proper structure, no placeholder or empty content
  - Context: content must align with the project brief from getProjectContext

Be thorough. Every section must be explicitly acted upon (approved, flagged, or fixed).`,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    tools: {
      getProjectContext,
      getDocumentContent,
      flagIssue,
      suggestFix,
      approveSection,
      updateDocumentStatus,
    },
  },
}
