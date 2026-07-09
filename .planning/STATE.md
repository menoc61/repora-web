# Repora — Project State

## Active Milestone
**Milestone 1: Core AI Orchestration**

## Current Phase
**Phase 1: Hermes Multi-Agent Orchestration** — Planning Complete

## Tech Stack (from AGENTS.md + package.json)
- **Frontend:** React 19, Vite, TanStack Router, BlockNote, TanStack Query, Tailwind CSS
- **Backend:** Node.js, Express 5, Vercel AI SDK v7, Drizzle ORM, PostgreSQL
- **AI:** Vercel AI SDK `streamText`/`generateText`/`tool()`, Ollama model discovery, BYOK multi-provider
- **Infrastructure:** Docker (frontend + backend + postgres + llama-server)

## Key Decisions
- **D-01:** Vercel AI SDK v7 standalone — no LangGraph/CrewAI. Custom orchestration on top of `streamText` + `maxSteps` + `tool()`.
- **D-02:** 5-agent sequential pipeline: Planner → Writer → UML → Tables → Reviewer
- **D-03:** Tools defined via SDK-native `tool()` with Zod input schemas, not custom wrapper
- **D-04:** Shared GenerationContext passed between pipeline stages (not persisted between runs)
- **D-05:** SSE streaming for real-time agent progress to frontend
- **D-06:** Default model auto-discovered from Ollama; BYOK opt-in per agent
- **D-07:** DESIGN.md ("Repora Sovereign") is the authoritative visual system for all UI
- **D-08:** French language for generated document content; platform UI in French

## Active Plans (Phase 1)
| Wave | Plan | Description | Status |
|------|------|-------------|--------|
| 1 | 001-01 | GenerationContext + Agent Registry + Tool Migration | pending |
| 1 | 001-02 | Hermes Negotiation Loop + Template Integration | pending |
| 2 | 001-03 | Frontend Live Agent Progress + Page Fixes | pending |

## Requirement Coverage
| ID | Description | Plan |
|----|-------------|------|
| HMO-01 | GenerationContext shared state | 001-01 |
| HMO-02 | Hermes Negotiation Loop (accept/rescope/adjust) | 001-02 |
| HMO-03 | Agent Registry with native tool() | 001-01 |
| HMO-04 | SSE Streaming real-time events | 001-02, 001-03 |
| HMO-05 | Frontend live agent chips + dashboard status | 001-03 |
| HMO-06 | Default model (Ollama-discovered) + BYOK fallback | 001-02 |
| HMO-07 | Template integration | 001-02 |
| HMO-08 | Page fixes (all pages work with new pipeline) | 001-03 |

## Next Steps
Run `/gsd-execute-phase 001` to execute Phase 1 plans in wave order.
