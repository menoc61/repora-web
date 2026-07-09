# Repora — Roadmap

## Milestone 1: Core AI Orchestration

### Phase 1: Hermes Multi-Agent Orchestration
**Goal:** A working multi-agent pipeline (Planner → Writer → UML → Tables → Reviewer) with shared GenerationContext, Hermes negotiation loop (accept/rescope/adjust), live SSE streaming to frontend, template integration, and properly typed tools.

**Requirements:**
- HMO-01: GenerationContext — shared state object passed between agents
- HMO-02: Hermes Negotiation Loop — accept/rescope/adjust with maxSteps + generateText + tools
- HMO-03: Agent Registry — native tool() from Vercel AI SDK v7 with Zod schemas
- HMO-04: SSE Streaming — real-time progress events (agent status, tokens, sections)
- HMO-05: Frontend Integration — Editor live agent chips, Dashboard generation status
- HMO-06: Default Model — Ollama-discovered model, fallback to BYOK if configured
- HMO-07: Template Integration — generate documents from templates + user prompts
- HMO-08: Page Fixes — all pages work correctly with new pipeline

**Plans:** 3 plans

Plans:
- [ ] 001-01-PLAN.md — GenerationContext + Agent Registry + SSE Event Types + Tool Migration
- [ ] 001-02-PLAN.md — Hermes Negotiation Loop + Template Integration + Default Model
- [ ] 001-03-PLAN.md — Frontend Live Agent Progress + Dashboard + Page Fixes
