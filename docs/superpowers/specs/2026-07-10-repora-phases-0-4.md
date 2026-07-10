# Repora — Phases 0–4 : Stabilisation, Export, Admin, Validation, Assistant

## Phase 0 — Tests & Pipeline Hermes (prioritaire)

### Objectif
Tous les tests passent + le pipeline Hermes produit du contenu réel (pas seulement "Introduction pending").

### Tests backend (8 fichiers échouent)
**Cause :** les tests cherchent PostgreSQL sur `localhost:5432` mais le Docker DB est sur `5433`.

**Fix :** créer `backend/.env.test` avec `DATABASE_URL=postgres://repora:repora@localhost:5433/repora`. Configurer Vitest (`vitest.config.ts`) pour charger ce fichier.

**Fichiers concernés :** `auth.test.ts`, `projects.test.ts`, `documents.test.ts`, `public.test.ts`, `hermes-context.test.ts`, `hermes-tools.test.ts`, `negotiate.test.ts`, `template-generation.test.ts`

**Vérification :** `cd backend && npm test` → 0 failed, 0 skipped.

### Pipeline Hermes — production de contenu
**Problème :** la génération crée une section "Introduction" status `pending` mais le contenu réel vient du pipeline asynchrone. Si Ollama n'est pas disponible, les sections restent vides.

**Fix :** Dans `POST /projects/:id/generate`, après avoir créé la section placeholder, lancer la génération synchrone (ou avec un timeout d'attente raisonnable). Ajouter un fallback : si Ollama n'est pas joignable, générer un contenu par défaut structuré à partir des exigences (template côté backend).

**Validation :** `POST /projects/:id/generate` → `GET /documents/:id` → sections avec contenu non-vide et status `done`.

### Tests frontend
Les 2 tests qui échouaient (WorkspaceDashboard) sont déjà corrigés dans le build actuel. Vérifier que `npm test` à la racine donne 0 failed.

---

## Phase 1 — Export DOCX fonctionnel

### Objectif
`GET /documents/:id/export?format=docx` et `?format=md` produisent des fichiers avec le contenu réel des sections.

### État actuel
Le routeur existe dans `routes/export.ts` et `services/export.service.ts`. L'export PDF fonctionne (1564 bytes). DOCX et MD sont implémentés mais avec un contenu minimal.

### Changements
1. `export.service.ts` — lire toutes les sections du document, les assembler dans l'ordre, générer DOCX avec `docx` npm package (titres, paragraphes, tableaux d'exigences)
2. Markdown — générer un fichier `.md` avec titres `##`, contenu, tableaux
3. Vérifier que le Content-Type et Content-Disposition sont corrects pour chaque format

### Tests
- Test unitaire : `export.service.test.ts` avec des sections mockées
- Test d'intégration : `GET /documents/:id/export?format=docx` → status 200, Content-Type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Phase 2 — Panneau d'administration

### Objectif
Interface utilisateur pour configurer les agents IA et gérer les clés BYOK.

### État actuel
Les routes API existent : `GET/PATCH /admin/agents`, `GET/POST/DELETE /admin/api-keys`. L'UI dans Infrastructure est basique (affiche des infos système). Les pages AgentWorkshop et Analytics ont été retirées.

### Nouvelles fonctionnalités

#### Configuration des agents (page `/admin/agents` ou onglet dans Infrastructure)
Actuellement, chaque agent a un `agent_configs` en DB avec : provider, model_id, temperature, top_p, max_tokens, enabled.

**UI :** tableau listant les 5 agents (Planner, Writer, UML, Tables, Reviewer) avec :
- Nom + description
- Provider (local / byok) — select
- Modèle — text input
- Temperature — range slider (0–2)
- Top P — range slider (0–1)
- Max tokens — number input
- Enable/disable — toggle

Chaque changement → `PATCH /admin/agents/:name` → mise à jour DB. Pas de redémarrage serveur nécessaire (les configs sont lues à chaque génération).

#### Gestion des clés BYOK
La page `/settings` a déjà une section "API Keys". Vérifier qu'elle fonctionne avec les endpoints existants.

**UX :**
- Afficher les clés existantes (provider, date de création, masquées)
- Ajouter une clé (select provider + input clé)
- Supprimer une clé
- Stockage chiffré (déjà fait côté backend)

### Tests
- Test UI : rendering du tableau agents + formulaire clés
- Test intégration : création de clé → `GET /admin/api-keys` → clé listée

---

## Phase 3 — Portail de validation

### Objectif
Le flux complet validation fonctionne : soumission → lien unique → consultation → décision → notification.

### État actuel
- Route `POST /documents/:id/validation-token` → crée un token
- Route `GET /validate/:token` → affiche le document en lecture seule
- Route `POST /validate/:token/decision` → enregistre la décision
- Page `ValidatePortal.tsx` → UI de validation

**Problèmes potentiels :**
1. Le token unique doit expirer ou être marqué "used" après la première décision
2. La notification au rédacteur doit fonctionner (WebSocket + éventuellement email)
3. Les "section_reasons" (motifs de rejet par section) doivent être correctement stockés et affichés

### Changements
1. Backend : après `decision`, marquer le token comme utilisé (`used_at`), notifier via WebSocket
2. Frontend : après soumission, afficher un message de confirmation + notifier le rédacteur (toast)
3. Page ValidatePortal : section par section avec boutons Valider/Rejeter + modal de motif

### Tests
- Test intégration : création token → GET validate → POST decision → token marqué utilisé

---

## Phase 4 — Assistant conversationnel

### Objectif
Mode dialogue pour recueillir les besoins de manière interactive, au lieu du formulaire 5 étapes actuel.

### Concept
Au lieu du wizard à étapes, un chat où l'assistant IA pose des questions une par une et construit le contexte du projet progressivement. À la fin, il résume et propose de lancer la génération.

### Flux
1. Rédacteur arrive sur `/onboarding/new` (ou `/chat`)
2. L'assistant demande : "Parlez-moi de votre projet..." en langage naturel
3. Dialogue → l'assistant extrait : contexte, objectifs, fonctionnalités, contraintes, acteurs
4. À chaque étape, il confirme : "J'ai noté : X. Autre chose ?"
5. Bouton "Générer le cahier des charges" → lance Hermes avec tout le contexte

### Implémentation
- Nouveau composant `ConversationalAssistant.tsx` (ou extension de OnboardingWizard)
- Utilise l'API `/agents/planner/chat` ou un nouvel endpoint `/onboarding/chat` avec streaming SSE
- Stocke temporairement le contexte dans un store Zustand ou en DB
- À la fin, crée le projet + exigences + lance la génération

### Tests
- Test unitaire du composant Chat (messages, état)
- Test intégration du endpoint `/onboarding/chat`
