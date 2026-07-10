# Design — Expérience de génération, verrouillage document, activité agents & bibliothèque de modèles

**Date** : 2026-07-10
**Statut** : Proposition (en revue)

## Context

Aujourd'hui l'éditeur utilise **BlockNote + Yjs**. Le générateur AI (`useDocumentStream`) reçoit les events SSE mais **n'écrit pas dans l'éditeur** — le contenu n'est chargé qu'une fois depuis `document.sections`. Il n'y a pas de verrou pendant la génération, pas de sentiment « l'agent écrit en direct », et les pages Infrastructure/Modèles affichent des données statiques sans lien avec l'activité réelle des agents.

**Moteur choisi : TipTap** (éditeur rich-text ProseMirror). Décision validée par l'utilisateur : TipTap donne un support **markdown** natif et un pattern de barre de menu/formatage (File/Edit/View/Insert/Tools, format_bold/italic/link/list) qui colle au mockup du 1er commit. La collaboration est préservée via Yjs (`@tiptap/extension-collaboration` + `y-prosemirror`, en réutilisant le `WebsocketProvider`/`Y.Doc` déjà présents).

Objectif (issu du 1er commit `81658cc`, mockup `Editor.tsx`) :
- pendant la génération, le document est **verrouillé** pour l'utilisateur et l'agent **stream son travail directement sur la page principale, section après section**, en formaté (gras/italique/markdown) ;
- restaurer l'UI d'origine (barre de menu, barre de formatage, panneau Agent Activity, pied WORDS / AI EFFICIENCY) ;
- afficher l'**activité live des agents** avec recherche instantanée sur Infrastructure **et** Modèles ;
- transformer la page **Modèles** en une **bibliothèque de templates de modèles**, chacun avec un **system prompt** utilisable.

## 1. Verrouillage du document pendant la génération

Source de vérité : `useGenerationStore` (`sessions[].status === 'generating'` pour le `documentId` courant).

- `EditorCanvas` (TipTap) s'abonne aux sessions du doc courant. Quand une session est `generating` :
  - `editor.setEditable(false)` (TipTap) ;
  - undo/redo désactivés ;
  - overlay « Génération en cours… » + curseur utilisateur désactivé ;
  - la barre de formatage est désactivée.
- À `completed` / `failed` : `editor.setEditable(true)`.
- La collaboration Yjs (extension Collaboration) reste active : l'agent continue d'écrire dans le même document partagé.

## 2. Streaming live de la génération (section après section)

- Nouveau `src/lib/markdownToContent.ts` : prépare des fragments markdown/HTML insérables dans TipTap (titres `#`, paragraphes, **gras** `**x**`, *italique* `*x*`, listes `-`). TipTap (extension Markdown) parse le markdown directement.
- Nouveau `GenerationWriter` (logique dans `EditorCanvas` ou hook dédié) consomme `useDocumentStream` :
  - `section_complete` / `agent_status` (début de section) → insère un heading pour la section ;
  - `token` events → ajoute le texte au bloc de section courant via `editor.commands.insertContent(...)` (throttle ~200 ms), gras/italique appliqués nativement par l'extension Markdown ;
  - `done` → finalise et marque la session `completed`.
- Résultat : le travail de l'agent apparaît en direct sur le document, section après section, avec un formatage réel — le feel « GENERATOR WRITING… » du 1er commit.

## 3. Restauration de l'UI d'origine dans l'éditeur

- **Barre de menu** (`File / Edit / View / Insert / Tools`) au-dessus de l'éditeur (pattern TipTap MenuBar).
- **Barre de formatage inline** (bas centré) : `Ask AI` + boutons `format_bold / format_italic / link / list` qui pilotent TipTap (`editor.chain().focus().toggleBold().run()` etc.) ; désactivés pendant la génération.
- **Panneau Agent Activity** (inspector droit) : Architect / Generator / Critic avec états `idle / writing / review` alimentés par les vrais events SSE `agent_status`.
- **Pied** : « X WORDS • AI EFFICIENCY : Y% » (déjà calculé dans `Editor.tsx` via `wordCount` et `aiEfficiency`).

## 4. Activité agents live + recherche instantanée (Infrastructure & Modèles)

- Nouveau hook `useAgentActivityFeed` : agrège les events SSE agent (`agent_status`, `tool_call`, `section_complete`, `done`) en un flux temps réel partagé.
- Les pages **Infrastructure** et **Modèles** reçoivent un panneau « Activité des agents » :
  - flux live (agent X → écrit section Y / appelle outil Z) ;
  - **un seul champ de recherche instantanée style Google** qui filtre le flux en direct pendant la frappe (**pas** de dropdowns de filtre par agent / type / document) ;
  - chaque agent montre son état courant + dernière action en temps réel.
- Cela rend les pages « logiques » : on voit l'activité réelle derrière l'infra / les modèles au lieu de chiffres statiques.

## 5. Page Modèles = bibliothèque de templates de modèles

- Nouvelle route `/models` (ou reprise de `/agents`) : affiche un ensemble de **templates de modèles**, chaque carte avec :
  - nom, provider, model id ;
  - **system prompt** éditable ;
  - toggle « activé » ;
  - action « Utiliser » (assigner à un agent / définir comme modèle de génération actif).
- Backend : probablement besoin d'un champ `system_prompt` sur la config modèle (noté comme exigence ; hors périmètre strict frontend mais nécessaire pour la persistance).

## Tests / Critères d'acceptation

- Pendant la génération : éditeur en lecture seule pour l'utilisateur ; le contenu de l'agent stream en direct, formaté.
- Menu / barre de formatage / panneau Agent Activity / pied présents et cohérents avec le look du 1er commit.
- Infrastructure & Modèles affichent l'activité live des agents ; la recherche instantanée filtre le flux.
- La page Modèles liste les templates avec system prompts, éditables et utilisables.

## Hors périmètre (YAGNI)

- Filtres multi-dropdown (par agent / type / document).
- Refonte RBAC complète.
- Changements Hermes backend hors ajout éventuel du stockage `system_prompt`.
