# Repora

## What This Is

Repora is a desktop AI-powered collaborative document generation application for enterprise teams. It combines multi-agent AI orchestration with real-time collaborative editing via Yjs/BlockNote, enabling cross-department teams (legal, engineering, marketing, etc.) to create structured documents with AI assistance. Built with ElectroBun, React 19, Bun, and designed for self-hosted deployment.

## Core Value

Users can collaboratively create structured documents with AI agent assistance that generates, reviews, and refines content in real-time — offline-first, with local LLM fallback.

## Business Context

- **Customer**: Enterprise departments with diverse specialization needs
- **Revenue model**: Self-hosted enterprise license
- **Success metric**: Documents successfully generated with AI assistance across departments
- **Strategy notes**: See `docs/init/INIT.md` for detailed setup guide

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Foundation
- [ ] **FOUND-01**: Monorepo initialized with VoidZero/Vite+ toolchain and workspace packages
- [ ] **FOUND-02**: Desktop app shell launches via ElectroBun with system tray and auto-updater
- [ ] **FOUND-03**: All packages build, type-check, lint, and test via workspace commands

#### Document Management
- [ ] **DOC-01**: User can create documents with typed schemas (title, status, metadata, template)
- [ ] **DOC-02**: Documents persist to SQLite with snapshots for version history
- [ ] **DOC-03**: User can export documents to DOCX, PDF, LaTeX, and Markdown

#### Real-Time Collaboration
- [ ] **COLLAB-01**: User can edit documents with BlockNote block editor
- [ ] **COLLAB-02**: Multiple users can collaboratively edit in real-time via Yjs CRDT
- [ ] **COLLAB-03**: User sees collaborators' cursors, presence, and status
- [ ] **COLLAB-04**: Sync supports Solo, LAN, P2P, WebSocket, and Hybrid modes

#### AI Document Generation
- [ ] **AI-01**: User can generate structured documents from natural language prompts
- [ ] **AI-02**: Multi-agent orchestrator plans outline, executes waves in parallel, and reviews quality
- [ ] **AI-03**: Agents can generate prose, diagrams, tables, code blocks, and citations
- [ ] **AI-04**: LLM client supports Ollama (local) with fallback chain to cloud providers

#### Sharing & Access Control
- [ ] **SHARE-01**: User can assign roles (owner, admin, editor, reviewer, viewer) per document
- [ ] **SHARE-02**: User can share documents via secure links with expiration, password, and NDA gate
- [ ] **SHARE-03**: User can request external validation via review portal
- [ ] **SHARE-04**: All access and sharing actions are auditable

#### Settings & Notifications
- [ ] **SETT-01**: User can configure 15+ setting categories (general, AI, collaboration, security, export, etc.)
- [ ] **SETT-02**: Settings persist across sessions with schema migration support
- [ ] **SETT-03**: User receives desktop notifications with DND mode and sound engine

#### MCP Skill System
- [ ] **MCP-01**: User can install, enable/disable, and manage MCP skills
- [ ] **MCP-02**: Skills are sandboxed and categorized (core, enterprise, user)

#### Enterprise Integration
- [ ] **ENT-01**: User receives email invitations and review notifications with HTML templates
- [ ] **ENT-02**: User can authenticate via SSO/OIDC
- [ ] **ENT-03**: Department-specific agent templates, skills, and configurations

#### Quality & Deployment
- [ ] **QUAL-01**: All packages have unit, integration, and type tests passing
- [ ] **QUAL-02**: Application builds, code-signs, and auto-updates on macOS and Windows

### Out of Scope

- **Mobile app** — Desktop-first; mobile companion deferred
- **Public cloud SaaS** — Self-hosted enterprise only
- **Real-time chat** — Comments/annotations are in scope; chat is not
- **Video/voice calls** — Out of scope entirely
- **Third-party plugin marketplace** — MCP skills system covers extensibility

## Context

Extensive design documentation exists in `docs/` including use-case diagrams, sequence diagrams, class models, and activity diagrams for all major subsystems. These informed the requirements above and serve as reference during implementation.

Built solo by a single developer. Self-hosted enterprise deployment target. No hard deadline — build it right.

## Constraints

- **Desktop shell**: ElectroBun v2.0+ — cross-platform native windows with WebView
- **Runtime**: Bun v1.2.0+ — JS/TS runtime and package manager
- **Frontend**: React 19 + Tailwind CSS — UI in WebView
- **Editor**: BlockNote v0.28.0+ — ProseMirror-based block editor
- **Collaboration**: Yjs v13.6.0+ — CRDT state management
- **LLM**: Ollama local-first with cloud provider fallback chain
- **Persistence**: SQLite via bun:sqlite (migrated from better-sqlite3 in Phase 9)
- **Export**: Pandoc + WeasyPrint for document conversion
- **Offline-first**: Every feature must work offline
- **Auditability**: Every action must be auditable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Desktop-first (ElectroBun) | Enterprise desktop app, not web | — Pending |
| Yjs CRDT for collaboration | Battle-tested, supports multiple sync transports | — Pending |
| Multi-agent wave generation | Parallel section writing with dependency ordering | — Pending |
| Ollama local-first + cloud fallback | Privacy-sensitive enterprises, offline capability | — Pending |
| Self-hosted only | Enterprise data sovereignty requirements | — Pending |
| Department-customizable agents | Polyvalent across legal, eng, marketing, etc. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-25 after initialization*
