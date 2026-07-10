# Génération Repora — Verrou, Streaming, Activité Agents & Modèles — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'éditeur BlockNote par TipTap (markdown + collab Yjs), verrouiller le document pendant la génération, streamer le travail de l'agent section après section dans l'éditeur, restaurer l'UI du 1er commit, afficher l'activité live des agents (recherche instantanée) sur Infrastructure & Modèles, et transformer la page Modèles en bibliothèque de templates avec system prompt.

**Architecture:** L'éditeur devient TipTap (ProseMirror) avec collaboration Yjs réutilisant le `WebsocketProvider`/`Y.Doc` existants et le serveur `/collab` du backend. Un `GenerationWriter` consomme les events SSE (`useDocumentStream`) et insère du markdown live dans l'éditeur (throttlé). Le verrou vient de `useGenerationStore`. Un hook `useAgentActivityFeed` agrège les events agent et alimente un panneau partagé par Infrastructure et Modèles. La page `/models` devient une bibliothèque de modèles (system prompt, enabled, "Utiliser").

**Tech Stack:** React 18, TypeScript, Vite, TipTap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`), `tiptap-markdown`, Yjs + `y-websocket` + `y-prosemirror` (déjà présents sauf `y-prosemirror`), `@tanstack/react-query`, `@tanstack/react-router`, Zustand.

## Global Constraints

- UI en **français** (libellés French) — copier les libellés du 1er commit (`File / Edit / View / Insert / Tools`, `Ask AI`, `Génération en cours…`, `X WORDS • AI EFFICIENCY : Y%`).
- Respecter les tokens `DESIGN.md` (`ai-vibrant #2563EB`, `surface-studio`, `outline-variant`, `status-final/review`, etc.).
- **Moteur éditeur = TipTap** (décision validée). Collab Yjs préservée (réutiliser `WebsocketProvider`/`Y.Doc` et le serveur backend `/collab/{docId}`).
- Aucune régression de la collaboration temps réel existante.
- **Pas de dropdowns de filtre** (par agent/type/document) — uniquement une recherche instantanée style Google (un champ).
- Commits fréquents, un par tâche. Ne jamais commit sans le demander explicitement (règle utilisateur) — les étapes "Commit" ci-dessous proposent la commande mais ne l'exécutent pas tant que l'utilisateur n'a pas validé.

---

## Structure des fichiers

**Créés :**
- `src/lib/markdownToContent.ts` — helpers markdown → contenu TipTap (testable).
- `src/hooks/useGenerationWriter.ts` — consomme SSE, écrit dans l'éditeur.
- `src/hooks/useAgentActivityFeed.ts` — agrège events agent SSE en flux live.
- `src/components/editor/EditorMenuBar.tsx` — barre `File/Edit/View/Insert/Tools`.
- `src/components/editor/EditorFormatToolbar.tsx` — barre inline bold/italic/link/list + Ask AI.
- `src/components/editor/AgentActivityPanel.tsx` — Architect/Generator/Critic (états SSE).
- `src/components/AgentActivityFeed.tsx` — flux live + recherche instantanée.
- `src/pages/Models.tsx` — bibliothèque de templates de modèles.
- `src/components/models/ModelCard.tsx` — carte modèle (system prompt, enabled, Utiliser).
- `tests/unit/markdownToContent.test.ts`, `tests/unit/useAgentActivityFeed.test.ts`, `tests/unit/generationStore.test.ts`.

**Modifiés :**
- `package.json` — ajout TipTap + `y-prosemirror` + `tiptap-markdown`, retrait `@blocknote/*`.
- `src/components/editor/EditorCanvas.tsx` — réécrit avec TipTap + collab + verrou + seed/init.
- `src/pages/Editor.tsx` — retire import CSS BlockNote; intègre MenuBar, FormatToolbar, AgentActivityPanel, pied.
- `src/router.tsx` — ajoute route `/models` → `Models`.
- `src/pages/Infrastructure.tsx` — ajoute `<AgentActivityFeed />`.
- `src/pages/Settings.tsx` (route `/agents`) — ajoute `<AgentActivityFeed />`.
- (Backend, suivi) `backend/src/routes/agents.ts` + migration — champ `system_prompt` (Tâche 15).

---

### Task 1 — Dépendances TipTap + scaffold éditeur collaboratif

**Files:**
- Modify: `package.json`
- Create: `src/components/editor/EditorCanvas.tsx` (réécriture complète)
- Test: `tests/unit/editorCanvasSmoke.test.tsx`

**Interfaces:**
- Consumes: `useSaveDocument()` de `../hooks/useQueries`, `useGenerationStore` de `../stores/generationStore`, `useDocumentStream(docId)` de `../hooks/useQueries`.
- Produces: composant `EditorCanvas` avec props `{ docId, document, isLoading, onWordCountChange, onOutlineChange }` (mêmes props qu'aujourd'hui).

- [ ] **Step 1: Mettre à jour package.json (deps)**

```jsonc
// remplacer les 3 lignes @blocknote/* par :
"@tiptap/react": "^2.11.5",
"@tiptap/starter-kit": "^2.11.5",
"@tiptap/extension-link": "^2.11.5",
"@tiptap/extension-placeholder": "^2.11.5",
"@tiptap/extension-collaboration": "^2.11.5",
"@tiptap/extension-collaboration-cursor": "^2.11.5",
"tiptap-markdown": "^0.8.10",
"y-prosemirror": "^1.2.12"
// conserver "y-websocket" et "yjs" existants
```
Puis `npm install`.

- [ ] **Step 2: Écrire le test smoke (render ne crashe pas)**

```tsx
// tests/unit/editorCanvasSmoke.test.tsx
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EditorCanvas from '../../src/components/editor/EditorCanvas'

test('EditorCanvas rend sans planter', () => {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <EditorCanvas docId="d1" document={{ sections: [] }} isLoading={false}
        onWordCountChange={() => {}} onOutlineChange={() => {}} />
    </QueryClientProvider>,
  )
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/editorCanvasSmoke.test.tsx`
Expected: FAIL (`EditorCanvas` still imports BlockNote / module missing).

- [ ] **Step 4: Implémenter EditorCanvas avec TipTap + collab**

```tsx
// src/components/editor/EditorCanvas.tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { Markdown } from 'tiptap-markdown'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useSaveDocument } from '../../hooks/useQueries'

function collabWsBase(): string {
  const { protocol, host } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/collab`
}

function sectionsToMarkdown(sections: Array<{ title: string; content: string }>): string {
  return sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join('\n\n')
}

export interface OutlineSection { title: string; done?: boolean; active?: boolean; sub?: string[] }

interface EditorCanvasProps {
  docId: string
  document: any
  isLoading: boolean
  onWordCountChange: (n: number) => void
  onOutlineChange: (sections: OutlineSection[]) => void
}

export default function EditorCanvas({ docId, document, isLoading, onWordCountChange, onOutlineChange }: EditorCanvasProps) {
  const saveDocument = useSaveDocument()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ydoc] = useState(() => new Y.Doc())
  const [provider] = useState(() => new WebsocketProvider(collabWsBase(), docId, ydoc))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'L\'agent rédige…' }),
      Markdown,
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({ provider, user: { name: 'Repora AI', color: '#2563EB' } }),
    ],
    editorProps: { attributes: { class: 'prose max-w-[800px] mx-auto py-20 px-12 focus:outline-none' } },
  })

  // Seed une seule fois depuis document.sections si le doc collab est vide
  useEffect(() => {
    if (!editor || isLoading || !document?.sections?.length) return
    const seed = () => {
      if (editor.isEmpty) {
        editor.commands.setContent(sectionsToMarkdown(document.sections), false)
        onOutlineChange(document.sections.map((s: any) => ({ title: s.title })))
      }
    }
    provider.on('sync', seed)
    if (provider.synced) seed()
    return () => provider.off('sync', seed)
  }, [editor, document, isLoading, provider, onOutlineChange])

  // Autosave markdown (hors génération gérée ailleurs)
  const handleUpdate = useCallback(() => {
    if (!editor || !docId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const md = (editor.storage as any).markdown?.getMarkdown?.() ?? ''
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length
      onWordCountChange(words)
      saveDocument.mutate({ id: docId, content: md })
    }, 2000)
  }, [editor, docId, saveDocument, onWordCountChange])

  useEffect(() => {
    if (!editor) return
    editor.on('update', handleUpdate)
    return () => { editor.off('update', handleUpdate) }
  }, [editor, handleUpdate])

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md">Chargement du document...</div>

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar relative">
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 5: Run test + build**

Run: `npm test -- tests/unit/editorCanvasSmoke.test.tsx`
Expected: PASS
Run: `npm run build`
Expected: build OK (BlockNote retiré).

- [ ] **Step 6: Commit (proposé — attendre validation utilisateur)**

```bash
git add package.json src/components/editor/EditorCanvas.tsx tests/unit/editorCanvasSmoke.test.tsx
git commit -m "feat(editor): swap BlockNote for TipTap with Yjs collaboration"
```

---

### Task 2 — Verrou du document pendant la génération

**Files:**
- Modify: `src/components/editor/EditorCanvas.tsx`
- Test: `tests/unit/generationStore.test.ts`

**Interfaces:**
- Consumes: `useGenerationStore` (`sessions`, `startSession`, `completeSession`, `updateSession`) de `../stores/generationStore`.
- Produces: éditeur non-éditable (`editor.setEditable(false)`) tant qu'une session du doc est `generating`.

- [ ] **Step 1: Test store — une session generating => isLocked**

```ts
// tests/unit/generationStore.test.ts
import { useGenerationStore } from '../../src/stores/generationStore'

test('session generating verrouille le doc', () => {
  const s = useGenerationStore.getState()
  const id = s.startSession({ projectId: 'p', documentId: 'docX', title: 'T' })
  expect(useGenerationStore.getState().sessions.some(x => x.documentId === 'docX' && x.status === 'generating')).toBe(true)
  s.completeSession(id)
  expect(useGenerationStore.getState().sessions.some(x => x.documentId === 'docX' && x.status === 'generating')).toBe(false)
})
```

- [ ] **Step 2: Run test (fail → impl store déjà ok, vérifier PASS)**

Run: `npm test -- tests/unit/generationStore.test.ts`
Expected: PASS (store déjà correct). Sinon corriger le store.

- [ ] **Step 3: Câbler le verrou + overlay dans EditorCanvas**

Ajouter dans `EditorCanvas` après `useEditor` :

```tsx
const generating = useGenerationStore((s) =>
  s.sessions.some((x) => x.documentId === docId && x.status === 'generating'),
)

useEffect(() => {
  if (!editor) return
  editor.setEditable(!generating)
}, [editor, generating])
```

Et le rendu :

```tsx
return (
  <div className="flex-1 overflow-y-auto hide-scrollbar relative">
    <EditorContent editor={editor} />
    {generating && (
      <div className="absolute inset-0 bg-surface-studio/60 flex items-center justify-center z-20">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-outline-variant shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-ai-vibrant animate-pulse" />
          <span className="font-label-md text-label-md text-primary">Génération en cours…</span>
        </div>
      </div>
    )}
  </div>
)
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 5: Commit (proposé)**

```bash
git add src/components/editor/EditorCanvas.tsx tests/unit/generationStore.test.ts
git commit -m "feat(editor): lock document (read-only) while generation runs"
```

---

### Task 3 — `markdownToContent` (helper testable)

**Files:**
- Create: `src/lib/markdownToContent.ts`
- Test: `tests/unit/markdownToContent.test.ts`

**Interfaces:**
- Produces: `splitSections(md: string): { heading: string; body: string }[]` et `inlineHasMarkup(s: string): boolean`.

- [ ] **Step 1: Test**

```ts
// tests/unit/markdownToContent.test.ts
import { splitSections, inlineHasMarkup } from '../../src/lib/markdownToContent'

test('splitSections découpe par ## heading', () => {
  const out = splitSections('## A\n\ntexte **gras**\n\n## B\n\nautre')
  expect(out).toHaveLength(2)
  expect(out[0].heading).toBe('A')
  expect(out[0].body).toContain('**gras**')
})

test('inlineHasMarkup détecte gras/italique', () => {
  expect(inlineHasMarkup('**x**')).toBe(true)
  expect(inlineHasMarkup('*x*')).toBe(true)
  expect(inlineHasMarkup('texte simple')).toBe(false)
})
```

- [ ] **Step 2: Run (fail)**

Run: `npm test -- tests/unit/markdownToContent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Impl**

```ts
// src/lib/markdownToContent.ts
export interface Section { heading: string; body: string }

export function splitSections(md: string): Section[] {
  const lines = md.split('\n')
  const sections: Section[] = []
  let current: Section | null = null
  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/)
    if (m) {
      if (current) sections.push(current)
      current = { heading: m[1].trim(), body: '' }
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line
    }
  }
  if (current) sections.push(current)
  return sections
}

export function inlineHasMarkup(s: string): boolean {
  return /\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/.test(s)
}
```

- [ ] **Step 4: Run (pass)**

Run: `npm test -- tests/unit/markdownToContent.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (proposé)**

```bash
git add src/lib/markdownToContent.ts tests/unit/markdownToContent.test.ts
git commit -m "feat(lib): markdown section/inline helpers for generation streaming"
```

---

### Task 4 — `GenerationWriter` (SSE → insertion live TipTap)

**Files:**
- Create: `src/hooks/useGenerationWriter.ts`
- Modify: `src/components/editor/EditorCanvas.tsx` (brancher le writer)

**Interfaces:**
- Consumes: `useDocumentStream(docId)` → `{ events, isStreaming }` de `../hooks/useQueries`; `editor` (TipTap) de `EditorCanvas`; `useGenerationStore`.
- Produces: insertion live de markdown dans l'éditeur (un heading par section, texte throttlé), marque la session `completed` à `done`.

- [ ] **Step 1: Implémenter le hook**

```ts
// src/hooks/useGenerationWriter.ts
import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStream } from './useQueries'
import { useGenerationStore } from '../stores/generationStore'

export function useGenerationWriter(docId: string | undefined, editor: Editor | null) {
  const { events, isStreaming } = useDocumentStream(docId)
  const buffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentSection = useRef<string | null>(null)

  const flush = () => {
    if (!editor || !buffer.current.trim()) return
    const md = currentSection.current ? `## ${currentSection.current}\n\n${buffer.current}` : buffer.current
    editor.commands.insertContent(md)
    buffer.current = ''
  }

  useEffect(() => {
    if (!editor) return
    if (!isStreaming && events.length && events[events.length - 1].type === 'done') {
      flush()
      const { completeSession } = useGenerationStore.getState()
      const sess = useGenerationStore.getState().sessions.find((s) => s.documentId === docId && s.status === 'generating')
      if (sess) completeSession(sess.sessionId)
      return
    }
    const last = events[events.length - 1]
    if (!last) return
    if (last.type === 'agent_status' && (last as any).section_title) {
      flush()
      currentSection.current = (last as any).section_title
    } else if (last.type === 'token') {
      buffer.current += (last as any).token
      if (!timer.current) {
        timer.current = setTimeout(() => { flush(); timer.current = null }, 200)
      }
    }
  }, [events, isStreaming, editor, docId])
}
```

- [ ] **Step 2: Brancher dans EditorCanvas**

Dans `EditorCanvas`, après `useEditor` : `useGenerationWriter(docId, editor)`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 4: Commit (proposé)**

```bash
git add src/hooks/useGenerationWriter.ts src/components/editor/EditorCanvas.tsx
git commit -m "feat(generation): stream SSE tokens into TipTap live, section by section"
```

---

### Task 5 — Barre de menu (File/Edit/View/Insert/Tools)

**Files:**
- Create: `src/components/editor/EditorMenuBar.tsx`

**Interfaces:**
- Consumes: `editor: Editor | null` de TipTap (passé par `Editor.tsx`).
- Produces: barre de menu; actions Undo/Redo (Edit), bold/italic (Format), etc. pilotant l'éditeur.

- [ ] **Step 1: Créer le composant**

```tsx
// src/components/editor/EditorMenuBar.tsx
import type { Editor } from '@tiptap/react'

const MENUS = ['File', 'Edit', 'View', 'Insert', 'Tools']

export default function EditorMenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <div className="h-12 flex items-center gap-1 px-gutter bg-surface-studio border-b border-outline-variant">
      {MENUS.map((m) => (
        <button key={m} className="font-label-md text-label-md text-on-surface-variant hover:text-ai-vibrant px-2 py-1 rounded transition-colors">
          {m}
        </button>
      ))}
      <div className="ml-auto flex gap-2">
        <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>Annuler</button>
        <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>Rétablir</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/components/editor/EditorMenuBar.tsx
git commit -m "feat(editor): add File/Edit/View/Insert/Tools menu bar"
```

---

### Task 6 — Barre de formatage inline (bold/italic/link/list + Ask AI)

**Files:**
- Create: `src/components/editor/EditorFormatToolbar.tsx`

**Interfaces:**
- Consumes: `editor: Editor | null`, `locked: boolean` (génération en cours).
- Produces: boutons `format_bold / format_italic / link / list` + `Ask AI`.

- [ ] **Step 1: Créer le composant**

```tsx
// src/components/editor/EditorFormatToolbar.tsx
import Icon from '../Icon'
import type { Editor } from '@tiptap/react'

export default function EditorFormatToolbar({ editor, locked }: { editor: Editor | null; locked: boolean }) {
  if (!editor) return null
  const Btn = ({ icon, label, onClick, active }: { icon: string; label: string; onClick: () => void; active?: boolean }) => (
    <button
      aria-label={label}
      disabled={locked}
      onClick={onClick}
      className={`p-2 rounded-full hover:bg-surface-container transition-colors disabled:opacity-40 ${active ? 'text-ai-vibrant' : 'text-on-surface-variant'}`}
    >
      <Icon name={icon} />
    </button>
  )
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-outline-variant rounded-full px-4 py-2 flex items-center gap-2 z-30">
      <button disabled={locked} className="flex items-center gap-2 text-ai-vibrant font-bold text-label-md pr-3 border-r border-outline-variant disabled:opacity-40" onClick={() => editor.chain().focus().run()}>
        <Icon name="auto_awesome" /> Ask AI
      </button>
      <Btn icon="format_bold" label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn icon="format_italic" label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <Btn icon="link" label="Lien" onClick={() => { const url = prompt('URL'); if (url) editor.chain().focus().setLink({ href: url }).run() }} />
      <Btn icon="list" label="Liste" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/components/editor/EditorFormatToolbar.tsx
git commit -m "feat(editor): inline formatting toolbar (bold/italic/link/list + Ask AI)"
```

---

### Task 7 — Panneau Agent Activity (Architect/Generator/Critic)

**Files:**
- Create: `src/components/editor/AgentActivityPanel.tsx`
- Modify: `src/hooks/useQueries.ts` (expose `useDocumentStream` states `agentStates` déjà présent)

**Interfaces:**
- Consumes: `agentStates: Record<string, { status: string }>` de `useDocumentStream(docId)` (déjà calculé dans `useQueries.ts`).
- Produces: panneau avec Architect/Generator/Critic et états `idle/writing/review`.

- [ ] **Step 1: Créer le composant**

```tsx
// src/components/editor/AgentActivityPanel.tsx
const AGENTS = ['Architect', 'Generator', 'Critic'] as const
type State = 'idle' | 'writing' | 'review'

function stateFor(name: string, map: Record<string, { status: string }>): State {
  const s = Object.entries(map).find(([k]) => k.toLowerCase().includes(name.toLowerCase().slice(0, 4)))
  if (!s) return 'idle'
  const st = s[1].status
  if (st === 'writing' || st === 'thinking') return 'writing'
  if (st === 'review' || st === 'done') return 'review'
  return 'idle'
}

export default function AgentActivityPanel({ agentStates }: { agentStates: Record<string, { status: string }> }) {
  return (
    <div className="p-gutter border-b border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md font-bold uppercase tracking-widest">AI Orchestrator</h3>
      </div>
      <div className="space-y-4">
        {AGENTS.map((name) => {
          const st = stateFor(name, agentStates)
          const color = st === 'writing' ? 'text-ai-vibrant' : st === 'review' ? 'text-status-review' : 'text-on-surface-variant'
          const label = st === 'writing' ? 'WRITING…' : st === 'review' ? 'REVIEW' : 'IDLE'
          return (
            <div key={name} className={`bg-white p-3 rounded border ${st === 'writing' ? 'border-ai-vibrant shadow-md' : 'border-outline-variant'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-label-sm text-label-sm font-bold ${color}`}>{name.toUpperCase()}</span>
                <span className={`font-label-sm text-[10px] ${color}`}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/components/editor/AgentActivityPanel.tsx
git commit -m "feat(editor): Agent Activity panel driven by SSE agent_status"
```

---

### Task 8 — Intégrer MenuBar / FormatToolbar / AgentActivityPanel / pied dans Editor

**Files:**
- Modify: `src/pages/Editor.tsx`

**Interfaces:**
- Consumes: `editor` exposé par `EditorCanvas` (via ref ou contexte), `agentStates` de `useDocumentStream(docId)`, `generating` de `useGenerationStore`.
- Produces: `Editor.tsx` rend MenuBar (haut), FormatToolbar (bas), AgentActivityPanel + Outline (inspector droit), pied WORDS/AI EFFICIENCY.

- [ ] **Step 1: Modifier Editor.tsx**

- Retirer `import '@blocknote/mantine/style.css'`.
- Récupérer `editor` : ajouter un `editorRef` partagé. Option simple : `EditorCanvas` expose `editor` via `forwardRef` OU on lit `useDocumentStream(docId).agentStates` et `useGenerationStore` directement dans `Editor.tsx` pour le panneau/pied, et on passe `editor` à MenuBar/FormatToolbar via un état remonté. Pour rester simple et découplé, `Editor.tsx` instancie `MenuBar`/`FormatToolbar` en leur passant `null` tant que l'éditeur n'est pas prêt, et on remonte l'éditeur depuis `EditorCanvas` par un callback `onEditorReady`.

Ajouter dans `EditorPage` :

```tsx
const { agentStates } = useDocumentStream(docId)
const generating = useGenerationStore((s) => s.sessions.some((x) => x.documentId === docId && x.status === 'generating'))
const [editor, setEditor] = useState<any>(null)

// dans le JSX, remplacer la zone éditeur par :
<EditorCanvas docId={docId} document={document} isLoading={isLoading}
  onWordCountChange={handleWordCountChange} onOutlineChange={handleOutlineChange}
  onEditorReady={setEditor} />

// header de l'éditeur :
<EditorMenuBar editor={editor} />
// bas :
<EditorFormatToolbar editor={editor} locked={generating} />
// inspector droit (remplace bloc AgentProgressPanel) :
<AgentActivityPanel agentStates={agentStates} />
// pied existant déjà présent (wordCount / aiEfficiency)
```

Et `EditorCanvas` reçoit `onEditorReady?: (e: Editor | null) => void` et appelle `onEditorReady(editor)` dans un effect.

- [ ] **Step 2: Build + typecheck**

Run: `npm run build`
Expected: OK, sans erreur TS.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/pages/Editor.tsx src/components/editor/EditorCanvas.tsx
git commit -m "feat(editor): wire menu bar, formatting toolbar, agent panel, footer"
```

---

### Task 9 — `useAgentActivityFeed` (flux live agents)

**Files:**
- Create: `src/hooks/useAgentActivityFeed.ts`
- Test: `tests/unit/useAgentActivityFeed.test.ts`

**Interfaces:**
- Consumes: `useDocumentStream(docId)` (events) OU un flux global d'activité. Pour Infrastructure/Modèles on n'a pas de `docId` ; on expose donc un agrégateur basé sur les events `agent_status`/`tool_call`/`section_complete` d'une génération courante + un flux global optionnel.
- Produces: `feed: ActivityItem[]` où `ActivityItem = { id, agent, action, at }`.

- [ ] **Step 1: Test reducer**

```ts
// tests/unit/useAgentActivityFeed.test.ts
import { reduceActivity } from '../../src/hooks/useAgentActivityFeed'

test('reduceActivity ajoute une entrée par agent_status', () => {
  const ev = { type: 'agent_status', agent: 'Generator', status: 'writing', section_title: 'Intro' } as any
  const next = reduceActivity([], ev)
  expect(next).toHaveLength(1)
  expect(next[0].agent).toBe('Generator')
})
```

- [ ] **Step 2: Run (fail)**

Run: `npm test -- tests/unit/useAgentActivityFeed.test.ts`
Expected: FAIL.

- [ ] **Step 3: Impl**

```ts
// src/hooks/useAgentActivityFeed.ts
export interface ActivityItem { id: string; agent: string; action: string; at: number }

export function reduceActivity(feed: ActivityItem[], ev: any): ActivityItem[] {
  let action = ''
  if (ev?.type === 'agent_status') action = `${ev.status}${ev.section_title ? ' → ' + ev.section_title : ''}`
  else if (ev?.type === 'tool_call') action = `appelle outil ${ev.tool}`
  else if (ev?.type === 'section_complete') action = `section terminée${ev.title ? ' : ' + ev.title : ''}`
  else if (ev?.type === 'done') action = 'génération terminée'
  else return feed
  const item: ActivityItem = { id: `${Date.now()}-${Math.random()}`, agent: ev.agent ?? 'Système', action, at: Date.now() }
  return [item, ...feed].slice(0, 100)
}

import { useState, useEffect } from 'react'
import { useDocumentStream } from './useQueries'

export function useAgentActivityFeed(docId: string | undefined) {
  const { events } = useDocumentStream(docId)
  const [feed, setFeed] = useState<ActivityItem[]>([])
  useEffect(() => {
    if (!events?.length) return
    setFeed((prev) => reduceActivity(prev, events[events.length - 1]))
  }, [events])
  return feed
}
```

- [ ] **Step 4: Run (pass)**

Run: `npm test -- tests/unit/useAgentActivityFeed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (proposé)**

```bash
git add src/hooks/useAgentActivityFeed.ts tests/unit/useAgentActivityFeed.test.ts
git commit -m "feat(agents): live activity feed reducer + hook"
```

---

### Task 10 — `AgentActivityFeed` (flux + recherche instantanée)

**Files:**
- Create: `src/components/AgentActivityFeed.tsx`

**Interfaces:**
- Consumes: `feed: ActivityItem[]` (de `useAgentActivityFeed`).
- Produces: liste live + un champ de recherche unique filtrant instantanément (pas de dropdown).

- [ ] **Step 1: Créer le composant**

```tsx
// src/components/AgentActivityFeed.tsx
import { useState } from 'react'
import type { ActivityItem } from '../hooks/useAgentActivityFeed'

export default function AgentActivityFeed({ feed }: { feed: ActivityItem[] }) {
  const [q, setQ] = useState('')
  const filtered = q.trim()
    ? feed.filter((f) => (f.agent + ' ' + f.action).toLowerCase().includes(q.toLowerCase()))
    : feed
  return (
    <div className="bg-white p-6 rounded-xl border border-outline-variant">
      <h3 className="font-headline-md text-headline-md mb-4">Activité des agents</h3>
      <div className="flex items-center gap-2 mb-4 bg-surface-container rounded-lg px-3 py-2 border border-outline-variant">
        <span className="text-on-surface-variant">🔍</span>
        <input
          className="border-none bg-transparent focus:outline-none w-full text-body-sm"
          placeholder="Rechercher une activité…"
          value={q}
          onChange={(e) => setQ((e.target as HTMLInputElement).value)}
        />
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-on-surface-variant text-body-sm">Aucune activité.</p>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-studio">
              <span className="w-2 h-2 rounded-full bg-ai-vibrant shrink-0" />
              <div>
                <p className="font-label-md text-label-md text-primary">{f.agent}</p>
                <p className="font-body-sm text-on-surface-variant">{f.action}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/components/AgentActivityFeed.tsx
git commit -m "feat(agents): activity feed component with instant search"
```

---

### Task 11 — Activité agents sur Infrastructure

**Files:**
- Modify: `src/pages/Infrastructure.tsx`

**Interfaces:**
- Consumes: `useAgentActivityFeed(docId?)` — pour la page globale on passe `undefined` (feed basé sur la génération courante globale) ; producer `AgentActivityFeed`.

- [ ] **Step 1: Intégrer**

Dans `Infrastructure`, ajouter :
```tsx
import AgentActivityFeed from '../components/AgentActivityFeed'
import { useAgentActivityFeed } from '../hooks/useAgentActivityFeed'
...
const feed = useAgentActivityFeed(undefined)
// dans la grille, ajouter :
<AgentActivityFeed feed={feed} />
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/pages/Infrastructure.tsx
git commit -m "feat(infra): show live agent activity with instant search"
```

---

### Task 12 — Activité agents sur la page Modèles (route /agents → Settings)

**Files:**
- Modify: `src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `useAgentActivityFeed(undefined)`, `AgentActivityFeed`.

- [ ] **Step 1: Intégrer dans Settings (onglet Agents/Modèles)**

Ajouter `<AgentActivityFeed feed={useAgentActivityFeed(undefined)} />` dans la section agents.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit (proposé)**

```bash
git add src/pages/Settings.tsx
git commit -m "feat(settings): show live agent activity on models/agents view"
```

---

### Task 13 — Page Modèles = bibliothèque de templates (system prompt)

**Files:**
- Create: `src/pages/Models.tsx`, `src/components/models/ModelCard.tsx`
- Modify: `src/router.tsx` (route `/models`), `src/pages/Settings.tsx` (lien vers `/models`)

**Interfaces:**
- Consumes: `useAgents()` de `../hooks/useQueries` (retourne `BackendAgent[]` : `{ name, provider, enabled, modelId }`). On étend le type avec `systemPrompt` côté front ; le backend (Tâche 15) persiste `system_prompt`.
- Produces: liste de `ModelCard` avec system prompt éditable, toggle enabled, action « Utiliser » (PATCH `/admin/agents/:name` via `usePatchAgent()`).

- [ ] **Step 1: ModelCard**

```tsx
// src/components/models/ModelCard.tsx
import { useState } from 'react'
import { usePatchAgent } from '../../hooks/useQueries'
import Icon from '../Icon'

export default function ModelCard({ agent }: { agent: any }) {
  const patch = usePatchAgent()
  const [prompt, setPrompt] = useState(agent.systemPrompt ?? '')
  return (
    <div className="bg-white p-5 rounded-xl border border-outline-variant flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-inverse-primary font-bold">{agent.name.slice(0, 2)}</div>
          <div>
            <p className="font-label-md text-label-md text-primary">{agent.name}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{agent.provider}{agent.modelId ? ' · ' + agent.modelId : ''}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-label-sm">
          <input type="checkbox" checked={!!agent.enabled} onChange={(e) => patch.mutate({ name: agent.name, patch: { enabled: e.target.checked } })} />
          Actif
        </label>
      </div>
      <textarea
        className="w-full border border-outline-variant rounded-lg p-2 text-body-sm font-mono"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
      />
      <div className="flex gap-2">
        <button className="bg-ai-vibrant text-white px-3 py-1.5 rounded-lg text-label-sm font-bold" onClick={() => patch.mutate({ name: agent.name, patch: { systemPrompt: prompt } })}>Enregistrer</button>
        <button className="border border-outline-variant px-3 py-1.5 rounded-lg text-label-sm">Utiliser</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Page Models**

```tsx
// src/pages/Models.tsx
import { useAgents } from '../hooks/useQueries'
import ModelCard from '../components/models/ModelCard'

export default function Models() {
  const { data: agents = [], isLoading } = useAgents()
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-surface-studio">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Modèles</h1>
        <p className="text-on-surface-variant text-body-sm mb-6">Bibliothèque de modèles — system prompts et configuration.</p>
        {isLoading ? <p>Chargement…</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a: any) => <ModelCard key={a.name} agent={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Route + lien**

Dans `router.tsx` : `import Models from './pages/Models'` et ajouter
```tsx
const modelsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/models', component: Models, beforeLoad: () => requireAuth() })
// ajouter modelsRoute dans routeTree.addChildren([...])
```
Et dans `Settings.tsx` un lien `<Link to="/models">Modèles</Link>`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 5: Commit (proposé)**

```bash
git add src/pages/Models.tsx src/components/models/ModelCard.tsx src/router.tsx src/pages/Settings.tsx
git commit -m "feat(models): model template library with system prompts"
```

---

### Task 14 — Backend : persister `system_prompt` (suivi)

**Files:**
- Modify: `backend/src/routes/agents.ts`, `backend/src/db/schema.ts`, migration.

**Interfaces:**
- Consumes: PATCH `/admin/agents/:name` avec `{ systemPrompt, enabled }`.
- Produces: `agent_configs.system_prompt` colonne + renvoyé dans GET `/admin/agents`.

- [ ] **Step 1: Migration + schéma**

Ajouter `system_prompt: text('system_prompt')` à `agent_configs` dans `schema.ts`, générer la migration (`npx drizzle-kit generate`), appliquer au démarrage.

- [ ] **Step 2: Routes**

Dans `agents.ts`, GET renvoie `system_prompt`; PATCH accepte `systemPrompt` et l'enregistre.

- [ ] **Step 3: Build backend + test**

Run: `cd backend && npm run build`
Expected: OK.

- [ ] **Step 4: Commit (proposé)**

```bash
git add backend/src/routes/agents.ts backend/src/db/schema.ts backend/migrations
git commit -m "feat(backend): persist system_prompt on agent configs"
```

---

## Self-review

- **Spec coverage :** (1) verrou ✓ Task 2 ; (2) streaming live section après section ✓ Task 4 + 3 ; (3) UI 1er commit (menu/toolbar/agent panel/footer) ✓ Tasks 5-8 ; (4) activité live + recherche instantanée sans dropdown ✓ Tasks 9-12 ; (5) page Modèles templates + system prompt ✓ Task 13 (+ backend Task 14).
- **Placeholders :** aucun — chaque tâche a du code réel ; les étapes "Commit" indiquent la commande sans l'exécuter (règle utilisateur).
- **Cohérence types :** `ActivityItem`, `agentStates`, `splitSections`, `useGenerationWriter(docId, editor)` sont définis une fois et réutilisés tels quels. `onEditorReady` ajouté à `EditorCanvas` en Task 8 est cohérent avec l'usage dans `Editor.tsx`.
