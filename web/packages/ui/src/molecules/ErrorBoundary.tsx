import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '../atoms/Button'
import { ButtonVariant } from '@goudchain/types'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, resetError: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-lg p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-700 mb-4">
                <span className="text-2xl text-red-400 font-mono font-bold">
                  ERR
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-zinc-500 mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-zinc-600 mb-2">Error Details</p>
              <p className="text-sm font-mono text-red-400 break-all">
                {this.state.error.message}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant={ButtonVariant.Primary}
                onClick={this.resetError}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-zinc-600 mt-4">
              If this issue persists, contact support
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
