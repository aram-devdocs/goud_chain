import { createRootRoute, createRoute, createRouter, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { Header, Navigation, Toast } from '@goudchain/ui'
import { useAuth, useToast } from '@goudchain/hooks'
import AuthPage from './pages/auth'
import DashboardPage from './pages/dashboard'
import SubmitPage from './pages/submit'
import CollectionsPage from './pages/collections'
import ExplorerPage from './pages/explorer'
import NetworkPage from './pages/network'
import AnalyticsPage from './pages/analytics'
import AuditPage from './pages/audit'
import MetricsPage from './pages/metrics'
import DebugPage from './pages/debug'

// Helper to check auth status
function isAuthenticated(): boolean {
  return !!localStorage.getItem('session_token')
}

type RouteId =
  | 'dashboard'
  | 'submit'
  | 'collections'
  | 'explorer'
  | 'network'
  | 'analytics'
  | 'audit'
  | 'metrics'
  | 'debug'

const navItems: Array<{ id: RouteId; label: string; path: string }> = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'submit', label: 'Submit Data', path: '/submit' },
  { id: 'collections', label: 'Collections', path: '/collections' },
  { id: 'explorer', label: 'Blockchain', path: '/explorer' },
  { id: 'network', label: 'Network', path: '/network' },
  { id: 'analytics', label: 'Analytics', path: '/analytics' },
  { id: 'audit', label: 'Audit Logs', path: '/audit' },
  { id: 'metrics', label: 'Metrics', path: '/metrics' },
  { id: 'debug', label: 'Debug', path: '/debug' },
]

// Root layout - just renders children with toast notifications
function RootComponent() {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>

      <Outlet />
    </>
  )
}

// Protected layout with header and navigation
function ProtectedLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate({ to: '/auth' })
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header title="Goud Chain" subtitle="Encrypted Blockchain Platform">
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </Header>

      {/* Navigation */}
      <Navigation items={navItems} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

// 404 Not Found Page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-zinc-400 mb-8">Page not found</p>
        <a
          href="/"
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

// Auth route (public) - redirects to / if already authenticated
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
})

// Protected layout route - redirects to /auth if not authenticated
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/auth' })
    }
  },
})

// Protected routes (children of protected layout)
const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
})

const submitRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/submit',
  component: SubmitPage,
})

const collectionsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/collections',
  component: CollectionsPage,
})

const explorerRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/explorer',
  component: ExplorerPage,
})

const networkRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/network',
  component: NetworkPage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

const auditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/audit',
  component: AuditPage,
})

const metricsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/metrics',
  component: MetricsPage,
})

const debugRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/debug',
  component: DebugPage,
})

// Create route tree
const routeTree = rootRoute.addChildren([
  authRoute,
  protectedRoute.addChildren([
    indexRoute,
    submitRoute,
    collectionsRoute,
    explorerRoute,
    networkRoute,
    analyticsRoute,
    auditRoute,
    metricsRoute,
    debugRoute,
  ]),
])

// Create router instance
export const router = createRouter({ routeTree })

// Type declaration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
