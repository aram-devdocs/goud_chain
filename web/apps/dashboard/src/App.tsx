import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import { ToastProvider } from '@goudchain/hooks'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ErrorBoundary } from '@goudchain/ui'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider>
            <RouterProvider router={router} />
          </WebSocketProvider>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
