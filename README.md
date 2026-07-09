# Repora

> **Cahier des Charges intelligent** — plateforme PWA auto-hebergee de generation de specifications techniques par orchestration multi-agents IA.

Repora automatise la redaction, la structuration, la generation de diagrammes UML et la validation des cahiers des charges a partir des besoins exprimes en langage naturel. Une equipe d'agents IA specialises collabore pour produire un document professionnel complet — avec diagrammes UML, matrices d'exigences et controle qualite — dans un editeur collaboratif par blocs.

---

## Installation — Une commande

### Pre-requis

- **Docker Desktop** (Windows / Mac) ou **Docker Engine** (Linux)
- **Ollama** avec un modele installe (optionnel — BYOK cloud fonctionne independamment)

```bash
# 1. Installer Ollama et telecharger un modele (recommande)
ollama pull llama3.1:8b

# 2. Cloner et lancer Repora
git clone https://github.com/menoc61/repora-web.git repora-web
cd repora-web
docker compose up
```

```mermaid
graph LR
    A[git clone] --> B[docker compose up]
    B --> C[PostgreSQL :5433]
    B --> D[Backend Express :8001]
    B --> E[Frontend nginx :3000]
    D --> F[Ollama local :11434]
    D --> G[Drizzle migrations + seed]
```

**C'est tout.** Ouvrez [http://localhost:3000](http://localhost:3000). La base de donnees est automatiquement migree et peuplee avec des donnees de demo.

> **Linux** : si `host.docker.internal` ne fonctionne pas, creez un fichier `.env` avec `OLLAMA_HOST=172.17.0.1`.

### Comptes de demo

| Role | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | `admin@repora.dev` | `admin123` |
| Redacteur | `jean@exemple.com` | `test123` |
| Redacteur | `marie@exemple.com` | `test123` |
| Validateur | `client@exemple.com` | `client123` |
| Admin | `sarah@repora.dev` | `test123` |

### Developpement local

```bash
# Backend
cd backend && npm install
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev                          # Express → http://localhost:8000

# Frontend
npm install && npm run dev           # Vite → http://localhost:5173
```

Creer `.env` : `VITE_API_BASE=http://localhost:8000`

---

## Architecture

```mermaid
graph TB
    subgraph Presentation["Presentation — React PWA"]
        PW[Progressive Web App]
        BE[BlockNote Editor]
        SB[Sidebar 280px]
    end

    subgraph Application["Application — Node.js Express"]
        Auth[JWT Auth + RBAC]
        Proj[Project / Document Services]
        Hermes[Hermes Orchestrator]
        Agents[Agent Registry]
        Export[PDF/DOCX/MD Export]
    end

    subgraph AI["AI Layer — Vercel AI SDK v7"]
        P[Planner Agent]
        W[Writer Agent]
        U[UML Agent]
        T[Tables Agent]
        R[Reviewer Agent]
    end

    subgraph Data["Data — PostgreSQL 17"]
        DB[(12 tables)]
    end

    subgraph External["External"]
        Ollama[Ollama llama.cpp]
        BYOK[BYOK Cloud Models]
        PlantUML[PlantUML API]
    end

    PW --> Auth
    Auth --> Proj
    Proj --> Hermes
    Hermes --> Agents
    Agents --> P & W & U & T & R
    P & W & U & T & R --> DB
    Agents --> Ollama
    Agents --> BYOK
    U --> PlantUML
    Export --> DB
```

---

## Workflow Utilisateur

### Flux principal : Creation d'un cahier des charges

```mermaid
flowchart TD
    A[Redacteur: Connexion] --> B[Creer un projet]
    B --> C[Onboarding Wizard]
    
    subgraph Wizard["Onboarding Wizard — 5 etapes"]
        C1[Contexte du projet]
        C2[Exigences fonctionnelles]
        C3[Exigences non-fonctionnelles]
        C4[Acteurs / Parties prenantes]
        C5[Recapitulatif]
        C1 --> C2 --> C3 --> C4 --> C5
    end
    
    C5 --> D{Lancer la generation}
    D --> E[Hermes Pipeline]
    
    subgraph Pipeline["Hermes Multi-Agent Pipeline"]
        E1[Planner: generer le plan]
        E2[Writer: rediger les sections]
        E3[UML: generer les diagrammes]
        E4[Tables: matrices d'exigences]
        E5[Reviewer: controle qualite]
        E1 --> E2 --> E3 --> E4 --> E5
    end
    
    E5 --> F[Previsualisation]
    F --> G{Conforme ?}
    G -- Oui --> H[Export PDF / Word]
    G -- Non --> I[Modifier le contenu]
    I --> F
    
    H --> J[Soumettre a validation]
    J --> K[Validateur: consulter via lien securise]
    K --> L{Decision}
    L -- Valider --> M[Document approuve]
    L -- Rejeter --> N[Motif obligatoire → notification redacteur]
```

### Flux de validation client

```mermaid
sequenceDiagram
    participant R as Redacteur
    participant P as Plateforme
    participant V as Validateur
    participant DB as Base de donnees

    R->>P: Soumettre a validation
    P->>DB: Creer token a usage unique
    P-->>R: Lien securise genere
    R->>V: Envoyer le lien
    
    V->>P: Acceder via /validate/$token
    P->>DB: Verifier le token
    P-->>V: Document (lecture seule)
    
    V->>V: Consulter section par section
    V->>V: Ajouter des commentaires
    
    alt Valider
        V->>P: POST /validate/$token/decision {decision: approved}
        P->>DB: Mettre a jour le statut
        P-->>R: Notification: document approuve
    else Rejeter
        V->>P: POST /validate/$token/decision {decision: rejected, section_reasons: {...}}
        P->>DB: Enregistrer les motifs de rejet
        P-->>R: Notification: corrections demandees
    end
```

---

## Pipeline Agent Hermes

```mermaid
flowchart LR
    subgraph Input
        BRIEF[Project Brief]
        REQS[Requirements Table]
        TM[Template]
    end

    subgraph Orchestrator["Hermes Orchestrator"]
        CTX[GenerationContext]
        DISP[Dispatch Loop]
    end

    subgraph Agents["Specialized Agents"]
        P[Planner<br/>—<br/>Structured Outline]
        W[Writer<br/>—<br/>Section Prose]
        U[UML Agent<br/>—<br/>PlantUML Diagrams]
        TB[Tables Agent<br/>—<br/>Requirement Matrices]
        R[Reviewer<br/>—<br/>Quality Audit]
    end

    subgraph Output["Generated Document"]
        SEC[Sections]
        DIAG[UML Diagrams]
        TBL[Tables]
        CMT[Review Comments]
    end

    BRIEF --> CTX
    REQS --> CTX
    TM --> CTX
    
    CTX --> DISP
    DISP --> P --> W --> U --> TB --> R
    
    P --> SEC
    W --> SEC
    U --> DIAG
    TB --> TBL
    R --> CMT
    
    SEC & DIAG & TBL --> DOC[Assembled Document]
```

Chaque agent est **independant** : modele, temperature, token budget et fournisseur (local ou BYOK) configurables individuellement.

### Outils des agents (Tool Calling)

| Agent | Outils | Operation DB |
|-------|--------|-------------|
| **Planner** | `getProjectContext`, `getRequirements` | Lecture projets + exigences |
| **Writer** | `getProjectContext`, `writeSection` | Lecture projets + ecriture sections |
| **UML** | `getProjectContext`, `getDocumentContent`, `getRequirements`, `saveDiagram` | Lecture contexte + ecriture diagrammes |
| **Tables** | `getProjectContext`, `getDocumentContent`, `getRequirements`, `saveRequirementSection` | Lecture exigences + ecriture tableaux |
| **Reviewer** | `getProjectContext`, `getDocumentContent`, `flagIssue`, `suggestFix`, `approveSection`, `updateDocumentStatus` | Lecture document + ecriture commentaires/statuts |

---

## Modele de donnees

```mermaid
erDiagram
    users ||--o{ projects : "owns"
    users ||--o{ comments : "authors"
    users ||--o{ api_keys : "owns"
    users ||--o{ audit_logs : "generates"
    
    projects ||--o{ requirements : "contains"
    projects ||--o{ documents : "has"
    projects ||--o{ diagrams : "has"
    
    documents ||--o{ sections : "composed_of"
    documents ||--o| validations : "validated_by"
    
    sections ||--o{ comments : "receives"
    
    templates ||--o{ documents : "applies_to"
    
    agent_configs {
        uuid id PK
        string agent_name UK
        string provider
        string model_id
        real temperature
        real top_p
        int max_tokens
        bool enabled
    }

    users {
        uuid id PK
        string name
        string email UK
        string password_hash
        string role
    }

    projects {
        uuid id PK
        uuid owner_id FK
        string name
        text brief
        string status
    }

    documents {
        uuid id PK
        uuid project_id FK
        string status
        jsonb outline
    }

    sections {
        uuid id PK
        uuid document_id FK
        int order
        string title
        text content
        string status
        string generated_by_agent
        string model_used
    }

    diagrams {
        uuid id PK
        uuid project_id FK
        string type
        text plantuml_source
        string rendered_url
    }

    requirements {
        uuid id PK
        uuid project_id FK
        string type
        text text
        string source_actor
    }

    validations {
        uuid id PK
        uuid document_id FK
        string validator_token UK
        string decision
        jsonb section_reasons
    }
```

---

## Pages de l'application

| Route | Page | Description | Acces |
|-------|------|-------------|-------|
| `/workspace` | WorkspaceDashboard | Tableau de bord, creation de projet, activite | Auth |
| `/onboarding/$id` | OnboardingWizard | Assistant 5 etapes de collecte d'exigences | Auth |
| `/editor` | Editor | Editeur BlockNote collaboratif + streaming SSE agent | Auth |
| `/library` | DocumentLibrary | Liste, recherche et filtrage des documents | Auth |
| `/templates` | TemplateGallery | Navigation et selection de modeles | Auth |
| `/agents` | AgentWorkshop | Configuration et test des agents IA | Auth |
| `/analytics` | Analytics | Metriques, performances, monitoring | Auth |
| `/collaboration` | CollaborationHub | Presence en temps reel, equipe | Auth |
| `/export` | ExportPreview | Previsualisation et export PDF/DOCX | Auth |
| `/settings` | Settings | Profil, preferences, cles API | Auth |
| `/infrastructure` | Infrastructure | Sante systeme, GPU, services, logs | Auth |
| `/sharing` | Sharing | Partage de documents et gestion des acces | Auth |
| `/history` | VersionHistory | Historique des versions, comparaison, restauration | Auth |
| `/login` | LoginPage | Authentification | Public |
| `/signup` | SignupPage | Inscription | Public |
| `/validate/$token` | ValidatePortal | Portail de validation client (lien a usage unique) | Public |

---

## Acteurs et Roles

```mermaid
graph TD
    SA[Super Admin] -->|gestion complete| PLAT[Plateforme]
    A[Administrateur Systeme] -->|config agents + LLM| PLAT
    R[Redacteur] -->|creation + edition + generation| PLAT
    V[Validateur] -->|validation via lien securise| PLAT
    
    SA -->|gestion utilisateurs| USERS[Utilisateurs]
    SA -->|cles API| KEYS[API Keys]
    SA -->|logs + metriques| LOGS[Audit Logs]
    
    A -->|temperature, top-p, tokens| CONFIG[Agent Config]
    A -->|system prompts, fournisseurs| CONFIG
    
    R -->|projets, exigences, generation| DOCS[Documents]
    R -->|soumission validation| VALID[Validations]
    
    V -->|lien unique, lecture seule| PORTAL[ValidatePortal]
    V -->|valider/rejeter + motifs| DECISION[Decision]
```

---

## Stack Technique

### Frontend

| Categorie | Technologie |
|-----------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 5 |
| Routing | TanStack Router |
| State | Zustand 5 (persist) + TanStack Query |
| Validation | Zod 4 |
| UI | shadcn v4 (@base-ui/react) + Tailwind CSS 3 |
| Editor | BlockNote + Yjs (WebSocket) |
| Icons | Material Symbols |
| Fonts | Geist (headings), Inter (body), JetBrains Mono (mono) |

### Backend

| Categorie | Technologie |
|-----------|------------|
| Runtime | Node.js 22 + Express 5 |
| ORM | Drizzle ORM + drizzle-kit |
| DB | PostgreSQL 17 |
| AI SDK | Vercel AI SDK v7 (provider-agnostic) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Diagrams | PlantUML (zlib deflate + base64 encoding) |
| Export | pdf-lib + docx |
| Real-time | ws + y-websocket |

### Infrastructure

| Service | Technologie | Port |
|---------|------------|------|
| Frontend | nginx:alpine (SPA) | 3000:80 |
| Backend | Node 22 Alpine (tsx) | 8001:8000 |
| Database | postgres:17 | 5433:5432 |
| LLM Local | Ollama (host) | 11434 |

---

## Export

La plateforme prend en charge l'export aux formats suivants :

| Format | Endpoint | Usage |
|--------|----------|-------|
| **PDF** | `GET /documents/:id/export?format=pdf` | Document final, archivage |
| **DOCX** | `GET /documents/:id/export?format=docx` | Edition collaborative Word |
| **Markdown** | `GET /documents/:id/export?format=md` | Integration Git / CI |
| **PNG** | `GET /projects/diagrams/:id/export?format=png` | Diagrammes pour insertion rapport |
| **SVG** | `GET /projects/diagrams/:id/export?format=svg` | Diagrammes vectoriels |

---

## BYOK Cloud

Repora fonctionne avec Ollama en local **par defaut** (zero cout, confidentialite totale). Les modeles cloud sont disponibles en opt-in :

- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude Sonnet, Claude Haiku)
- Google (Gemini Pro, Gemini Flash)
- Tout endpoint compatible OpenAI (Groq, OpenRouter, etc.)

Les cles API sont chiffrees au repos (AES-256). Configuration par agent depuis la page Infrastructure.

---

## Tests

```bash
# Backend (integration tests require PostgreSQL)
cd backend && npm test

# Frontend (unit + component tests)
npm test

# Build verification
npm run build
```

---

## Structure du projet

```
repora-web/
├── src/                          # Frontend React (15 pages)
│   ├── api/client.ts             # HTTP + SSE client
│   ├── hooks/useQueries.ts       # 40+ TanStack Query hooks
│   ├── stores/index.ts           # Zustand (Auth, Workspace, Settings)
│   ├── schemas/index.ts          # Zod schemas + interfaces
│   ├── router.tsx                # TanStack Router (15 routes)
│   ├── layout/{Sidebar,TopBar}   # Shell layout
│   ├── pages/                    # 15 page components
│   │   ├── OnboardingWizard.tsx  # Requirements elicitation wizard
│   │   ├── ValidatePortal.tsx    # Public validator portal
│   │   └── ...                   # 13 other pages
│   └── components/               # UI primitives + shared components
├── backend/
│   ├── src/
│   │   ├── ai/                   # Hermes orchestrator + agents + tools
│   │   │   ├── hermes.ts         # Agent runner, SSE events, model discovery
│   │   │   ├── agents/           # 5 specialized agent definitions
│   │   │   ├── tools/            # 4 tool modules (document, diagram, review, tables)
│   │   │   ├── pipeline/         # Orchestration pipeline + negotiation
│   │   │   └── providers/        # LlamaCppProvider, BYOKProvider
│   │   ├── routes/               # 15 Express routers
│   │   ├── services/             # 14 business logic services
│   │   ├── db/schema.ts          # 12 table Drizzle definitions
│   │   ├── db/seed.ts            # Demo data seeder (French)
│   │   └── config.ts             # Environment configuration
│   ├── docker-entrypoint.sh      # Auto migration + seed on Docker start
│   └── Dockerfile                # Multi-stage Node 22 Alpine
├── docker-compose.yml            # 3 services (frontend, backend, db)
├── nginx.conf                    # SPA fallback + /api proxy
├── DESIGN.md                     # Visual design system (authoritative)
├── AGENTS.md                     # Build spec for autonomous agents
└── docs/class-diagram.puml       # Full class diagram (6 packages, 70+ classes)
```

---

## Conventions

- **Composants** : shadcn v4 primitives (`Button`, `Card`, `Badge`, `Table`, `Input`, `Select`)
- **Icones** : `<Icon name="..." />` via Material Symbols
- **Status** : `<StatusBadge status={'draft'|'review'|'final'|'active'|'autonomous'}>`
- **Navigation** : `<Link to="/path">` de `@tanstack/react-router`
- **Langue** : Interface et documents generes en francais
- **Design System** : `DESIGN.md` fait autorite pour toutes les decisions visuelles

---

## Contribution

1. Creer une branche depuis `master`
2. Suivre les conventions (stores/schemas/hooks, primitives shadcn, types OOP)
3. `npm run build` avant de push
4. Ouvrir une PR
