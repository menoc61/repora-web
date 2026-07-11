import { lazy, Suspense } from 'react'
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
import { useNotificationSocket } from './hooks/useNotificationSocket'
import ToastContainer from './components/Toast'
import NotificationCenter from './components/NotificationCenter'
import WorkspaceDashboard from './pages/WorkspaceDashboard'
import DocumentLibrary from './pages/DocumentLibrary'
import TemplateGallery from './pages/TemplateGallery'
import Settings from './pages/Settings'
import Infrastructure from './pages/Infrastructure'
import Sharing from './pages/Sharing'
import VersionHistory from './pages/VersionHistory'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ValidatePortal from './pages/ValidatePortal'

const Editor = lazy(() => import('./pages/Editor'))
const ExportPreview = lazy(() => import('./pages/ExportPreview'))
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'))
const AssistantPage = lazy(() => import('./pages/Assistant'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center text-on-surface-variant"><span className="w-5 h-5 border-2 border-ai-vibrant/30 border-t-ai-vibrant rounded-full animate-spin" /></div>}>{children}</Suspense>
}

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
const PUBLIC_PREFIXES = ['/validate/']

function requireAuth() {
  if (!useAuthStore.getState().isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isPublic = isPublicPath(pathname)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  useNotificationSocket()
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface-studio text-on-surface">
        {isPublic ? null : <Sidebar />}
        <div className={isPublic ? '' : 'ml-sidebar-width min-h-screen flex flex-col'}>
          <Outlet />
        </div>
        <ToastContainer />
        <NotificationCenter />
      </div>
    </QueryClientProvider>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

// Public routes — no auth guard, no sidebar
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

const validatePortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/validate/$token',
  component: ValidatePortal,
})

// Protected routes — require auth
const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor',
  component: () => <LazyPage><Editor /></LazyPage>,
  beforeLoad: () => requireAuth(),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
})

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: () => <LazyPage><ExportPreview /></LazyPage>,
  beforeLoad: () => requireAuth(),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
})

const searchParamsValidator = (search: Record<string, unknown>) => ({
  id: typeof search.id === 'string' ? search.id : undefined,
  department: typeof search.department === 'string' ? search.department : undefined,
  search: typeof search.search === 'string' ? search.search : undefined,
  agent: typeof search.agent === 'string' ? search.agent : undefined,
  status: typeof search.status === 'string' ? search.status : undefined,
  owner: typeof search.owner === 'string' ? search.owner : undefined,
})

const protectedRoutes = [
  { path: '/', component: WorkspaceDashboard },
  { path: '/workspace', component: WorkspaceDashboard },
  { path: '/library', component: DocumentLibrary },
  { path: '/templates', component: TemplateGallery },
  { path: '/settings', component: Settings },
  { path: '/infrastructure', component: Infrastructure },
  { path: '/sharing', component: Sharing },
  { path: '/agents', component: Settings },
  { path: '/analytics', component: WorkspaceDashboard },
];

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: VersionHistory,
  beforeLoad: () => requireAuth(),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding/$id',
  component: () => <LazyPage><OnboardingWizard /></LazyPage>,
  beforeLoad: () => requireAuth(),
})

const assistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assistant/$id',
  component: () => <LazyPage><AssistantPage /></LazyPage>,
  beforeLoad: () => requireAuth(),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  validatePortalRoute,
  editorRoute,
  exportRoute,
  historyRoute,
  onboardingRoute,
  assistantRoute,
  ...protectedRoutes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: r.component,
      beforeLoad: () => requireAuth(),
      validateSearch: searchParamsValidator,
    }),
  ),
])

export const router = createRouter({ routeTree })
export type Router = typeof router

export { RouterProvider }
