import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './layout/Sidebar'
import { useAuthStore } from './stores'
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
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const PUBLIC_PATHS = new Set(['/login', '/signup'])

function requireAuth() {
  if (!useAuthStore.getState().isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublic = PUBLIC_PATHS.has(pathname)
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface-studio text-on-surface">
        {isPublic ? null : <Sidebar />}
        <div className={isPublic ? '' : 'ml-sidebar-width min-h-screen flex flex-col'}>
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

// Public routes — no auth guard, no sidebar (handled via layout check in component)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
})

// Protected routes — require auth
const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor',
  component: Editor,
  beforeLoad: () => requireAuth(),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
})

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: ExportPreview,
  beforeLoad: () => requireAuth(),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
})

const protectedRoutes = [
  { path: '/', component: WorkspaceDashboard },
  { path: '/workspace', component: WorkspaceDashboard },
  { path: '/library', component: DocumentLibrary },
  { path: '/templates', component: TemplateGallery },
  { path: '/agents', component: AgentWorkshop },
  { path: '/analytics', component: Analytics },
  { path: '/collaboration', component: CollaborationHub },
  { path: '/settings', component: Settings },
  { path: '/infrastructure', component: Infrastructure },
  { path: '/sharing', component: Sharing },
  { path: '/history', component: VersionHistory },
]

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  editorRoute,
  exportRoute,
  ...protectedRoutes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: r.component,
      beforeLoad: () => requireAuth(),
    }),
  ),
])

export const router = createRouter({ routeTree })
export type Router = typeof router

export { RouterProvider }