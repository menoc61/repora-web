# Repora Page Conversion — Shared Context

## Stack
- Vite + React 18 + TypeScript
- shadcn v4 components in `src/components/ui/` (button, card, input, badge, tabs, table, dialog, dropdown-menu, sheet, separator, avatar, tooltip, select)
- Tailwind CSS 3 with custom design tokens (see tailwind.config.js / index.css)
- Zustand stores: `src/stores/index.ts` → `useWorkspaceStore`, `useAuthStore`, `useSettingsStore`
- TanStack Query hooks: `src/hooks/useQueries.ts` → `useDocuments()`, `useAnalytics()`, `useTemplates()`, `useCollaborators()`, `useUpsertDocument()`
- Zod schemas/types: `src/schemas/index.ts` → `Document`, `Collaborator`, `User`, `Settings`, `Template`, `Metrics`, `ViewType`
- `@tanstack/react-router` for `<Link to="...">`

## Design system tokens (use these Tailwind classes)
- Colors: `primary`, `primary-container`, `surface`, `surface-studio`, `surface-container-low/lowest/high/highest`, `secondary`, `ai-vibrant`, `ai-glow`, `status-final` (emerald), `status-review` (amber), `status-draft` (gray), `outline-variant`, `on-surface`, `on-surface-variant`, `on-primary`, `on-primary-container`, `on-secondary-container`, `secondary-container`, `primary-fixed`, `inverse-surface`, `error`
- Fonts: `font-headline-lg/md`, `font-body-lg/md/sm`, `font-label-md/sm`, `font-display-lg`
- Spacing: `p-gutter`, `px-gutter`, `gap-gutter`, `px-margin-desktop`, `w-sidebar-width` (280px), `w-inspector-width` (320px)
- Material Symbols icons via `<Icon name="..." />` from `../components/Icon` (NOT lucide-react)
- Status badges: `<StatusBadge status={...}>{label}</StatusBadge>` — status accepts: 'draft' | 'review' | 'final' | 'active' | 'autonomous' | 'archived'
- Agent status chip: `<AgentStatus name="..." state="idle|thinking|writing|review">{children}</AgentStatus>` from `../components/AgentStatus`

## shadcn components available
- `import { Button } from '@/components/ui/button'` → props: `variant` ('default'|'outline'|'ghost'|'secondary'|'destructive'), `size` ('default'|'sm'|'lg'|'icon')
- `import { Card } from '@/components/ui/card'` → `<Card className="...">`
- `import { Input } from '@/components/ui/input'` → `<Input className="..." placeholder="..." />`
- `import { Badge } from '@/components/ui/badge'` → `<Badge variant="...">`
- `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'`
- `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'`
- `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'`
- `import { Avatar } from '@/components/ui/avatar'`
- `import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'`
- `import { Separator } from '@/components/ui/separator'`

NOTE: shadcn v4 components in this repo are the `@base-ui/react` variant. Check actual export names by reading the file before using.

## Conversion rules
1. Rename file `.jsx` → `.tsx`. Delete the old `.jsx` file.
2. Add TypeScript types for all props, local data arrays, and event handlers.
3. Replace inline `useState` arrays of literals with typed `interface` or use `z.infer` types from `@/schemas` where applicable.
4. Connect to data layer: use `useDocuments()`, `useAnalytics()`, `useTemplates()`, `useCollaborators()` from `@/hooks/useQueries` instead of inline mock arrays where the data is document/collaborator/template/analytics-shaped. KEEP purely visual/UI demo data (charts, log feeds, SVG) as local consts — those are presentation-only.
5. Use shadcn components (`Button`, `Card`, `Input`, `Badge`, `Table`, `Tabs`, `Select`) for interactive/structural elements instead of raw `<button>`, `<div>`-styled-as-card, or native `<select>`/`<input>` where reasonable. Keep custom Tailwind design tokens for layout/color (do NOT replace `bg-surface`, `text-ai-vibrant`, etc. with shadcn's default colors — preserve the Repora Sovereign look).
6. Keep all existing layout, content, and visual design exactly as-is. Only change: file extension, TS types, data source (mock → hooks where applicable), and swapped-in shadcn primitives. Do NOT restyle or redesign.
7. Preserve `<Icon name="..." />` usage (Material Symbols) — do not switch to lucide.
8. Preserve `<Link to="/...">` and `<StatusBadge>` usage.
9. Keep helper sub-components (e.g. `OutlineItem`, `Toggle`, `CheckLine`) but add TS types to their props.
10. Ensure the file compiles — no `any` casts unless necessary; prefer proper types.

## Example pattern (from WorkspaceDashboard.tsx)
```tsx
import { Link } from '@tanstack/react-router'
import TopBar from '../layout/TopBar'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useDocuments, useAnalytics } from '../hooks/useQueries'
import { useWorkspaceStore } from '../stores'

export default function WorkspaceDashboard() {
  const { data: documents = [] } = useDocuments()
  const { data: analytics } = useAnalytics()
  const setActiveView = useWorkspaceStore((s) => s.setActiveView)
  ...
}
```
