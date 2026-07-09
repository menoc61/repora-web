# Spec: Document Generation + Export MVP

**Date:** 2025-07-09
**Status:** Approved
**Goal:** End-to-end working document generation and professional export in <5h

## 1. Core Architecture Decision

**Single model, user-configured.** The user selects one model via Ollama in Settings. All agents (Planner, Writer, Reviewer) use that same model. No per-agent model configuration for MVP.

Discovery:
- `GET /models` proxies Ollama's `/api/tags` to list available local models
- Selected model stored as a single `agent_configs` row with `agentName = '__default_model__'`
- Default on first run: query Ollama tags, use the first available model

## 2. Document Generation Flow

### Current (broken)
```
generateDocument → creates 1 "Introduction" section
orchestrateGeneration → Planner (saveOutline) → Writer (writeSection, but no sections exist) → Reviewer
```

### Fixed flow
```
POST /projects/:id/generate
  1. CREATE document row + 1 seed section ("Introduction")
  2. PLANNER → analyzes brief, calls saveOutline tool → stores outline JSON in documents.outline
  3. OUTLINE PROCESSOR → reads outline JSON → creates sections in DB (inserts rows)
  4. WRITER → iterates each section → calls writeSection tool → fills content
  5. REVIEWER → reads complete document → returns review/QC notes
  6. SSE streams all events to frontend
```

### Outline format (expected from Planner)
```json
{
  "title": "Document Title",
  "chapters": [
    {
      "title": "Introduction",
      "sections": [
        { "title": "Context", "order": 1 },
        { "title": "Objectives", "order": 2 }
      ]
    },
    {
      "title": "Requirements",
      "sections": [
        { "title": "Functional Requirements", "order": 3 },
        { "title": "Non-Functional Requirements", "order": 4 }
      ]
    }
  ]
}
```

## 3. Export Pipeline

| Format | Library | Output |
|--------|---------|--------|
| MD | (native) | Cover + TOC + sections with `#` headings |
| PDF | `pdf-lib` | Cover page, TOC, section pages, professional layout |
| DOCX | `docx` | Proper headings, page breaks, 11pt body |

All share the same structure: Cover Page → Table of Contents → Sections → (optional) References

## 4. Provider Simplification

- `ProviderType` gets `'ollama'` (points to Ollama's OpenAI-compatible endpoint at `http://localhost:11434/v1`)
- All agents read `modelId` from the single `__default_model__` config
- `runAgent` uses `getLanguageModel('ollama', modelId)` for all agents

## 5. Files to create/modify

| File | Action |
|------|--------|
| `backend/src/routes/models.ts` | CREATE — `GET /models` from Ollama `/api/tags` |
| `backend/src/index.ts` | EDIT — mount models router |
| `backend/src/ai/providers/interface.ts` | EDIT — add `'ollama'` to ProviderType |
| `backend/src/ai/hermes.ts` | EDIT — add outline processor step, use single model config |
| `backend/src/services/document.service.ts` | EDIT — add `createSectionsFromOutline` |
| `backend/src/services/export.service.ts` | CREATE — PDF/DOCX/MD export |
| `backend/src/routes/documents.ts` | EDIT — use export service |
| `backend/src/config.ts` | EDIT — add `ollamaUrl` config |

## 6. Non-Goals (explicitly deferred)

- Multiple models per agent
- OpenRouter/BYOK cloud providers
- Frontend Docker setup
- Admin UI CRUD
- No-op button wiring (templates, collaboration, etc.)
