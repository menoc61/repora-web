import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './layout/Sidebar'
import WorkspaceDashboard from './pages/WorkspaceDashboard'
import DocumentLibrary from './pages/DocumentLibrary'
import TemplateGallery from './pages/TemplateGallery'
import AgentWorkshop from './pages/AgentWorkshop'
import Editor from './pages/Editor'
import Analytics from './pages/Analytics'
import CollaborationHub from './pages/CollaborationHub'
import ExportPreview from './pages/ExportPreview'
import Settings from './pages/Settings'
import Infrastructure from './pages/Infrastructure'
import Sharing from './pages/Sharing'
import VersionHistory from './pages/VersionHistory'

export const queryClient = new QueryClient()

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface-studio text-on-surface">
        <Sidebar />
        <div className="ml-sidebar-width min-h-screen flex flex-col">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  ),
})

const routes = [
  { path: '/', component: WorkspaceDashboard },
  { path: '/workspace', component: WorkspaceDashboard },
  { path: '/library', component: DocumentLibrary },
  { path: '/templates', component: TemplateGallery },
  { path: '/agents', component: AgentWorkshop },
  { path: '/editor', component: Editor },
  { path: '/analytics', component: Analytics },
  { path: '/collaboration', component: CollaborationHub },
  { path: '/export', component: ExportPreview },
  { path: '/settings', component: Settings },
  { path: '/infrastructure', component: Infrastructure },
  { path: '/sharing', component: Sharing },
  { path: '/history', component: VersionHistory },
]

const routeTree = rootRoute.addChildren(
  routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: r.component,
    }),
  ),
)

export const router = createRouter({ routeTree })
export type Router = typeof router

export { RouterProvider }
