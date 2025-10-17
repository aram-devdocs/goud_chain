import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth, useToast } from '@goudchain/hooks'
import { Header, Navigation, Toast } from '@goudchain/ui'
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'submit', label: 'Submit Data' },
  { id: 'collections', label: 'Collections' },
  { id: 'explorer', label: 'Blockchain' },
  { id: 'network', label: 'Network' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'debug', label: 'Debug' },
]

function AppContent() {
  const { isAuthenticated, logout } = useAuth()
  const { toasts, dismiss } = useToast()
  const [activeView, setActiveView] = useState('dashboard')

  if (!isAuthenticated) {
    return <AuthPage />
  }

  const renderPage = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage />
      case 'submit':
        return <SubmitPage />
      case 'collections':
        return <CollectionsPage />
      case 'explorer':
        return <ExplorerPage />
      case 'network':
        return <NetworkPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'audit':
        return <AuditPage />
      case 'metrics':
        return <MetricsPage />
      case 'debug':
        return <DebugPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-black">
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

      {/* Header */}
      <Header title="Goud Chain" subtitle="Encrypted Blockchain Platform">
        <button
          onClick={logout}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </Header>

      {/* Navigation */}
      <Navigation
        items={navItems}
        activeId={activeView}
        onNavigate={setActiveView}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{renderPage()}</main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
