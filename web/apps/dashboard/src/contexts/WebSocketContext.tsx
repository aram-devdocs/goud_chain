import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useWebSocket } from '@goudchain/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@goudchain/hooks'

interface WebSocketContextType {
  isConnected: boolean
  send: (message: unknown) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const queryClient = useQueryClient()
  const { success, info } = useToast()

  // Get API key for WebSocket authentication
  const apiKey = localStorage.getItem('api_key')

  // Build WebSocket URL - use relative path in production, absolute in dev
  const wsUrl = apiKey
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${encodeURIComponent(apiKey)}`
    : ''

  const { isConnected, lastMessage, send } = useWebSocket(wsUrl, !!apiKey)

  // Subscribe to events when connected
  useEffect(() => {
    if (isConnected && send) {
      // Subscribe to all event types
      send({ type: 'subscribe', event: 'blockchain_update' })
      send({ type: 'subscribe', event: 'collection_update' })
      send({ type: 'subscribe', event: 'peer_update' })
      send({ type: 'subscribe', event: 'audit_log_update' })
      send({ type: 'subscribe', event: 'metrics_update' })
    }
  }, [isConnected, send])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    const message = lastMessage as unknown as { type: string; event?: string; [key: string]: unknown }

    if (message.type === 'event') {
      switch (message.event) {
        case 'blockchain_update':
          // Invalidate chain and metrics queries
          queryClient.invalidateQueries({ queryKey: ['chain'] })
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
          info('New block added to chain')
          break

        case 'collection_update':
          // Invalidate collections query
          queryClient.invalidateQueries({ queryKey: ['collections'] })
          success('New collection created')
          break

        case 'peer_update':
          // Invalidate peers query
          queryClient.invalidateQueries({ queryKey: ['peers'] })
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
          info('Network topology changed')
          break

        case 'audit_log_update':
          // Invalidate audit logs query
          queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
          break

        case 'metrics_update':
          // Invalidate metrics query
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
          break

        default:
          console.log('Unknown WebSocket event:', message.event)
      }
    }
  }, [lastMessage, queryClient, success, info])

  return (
    <WebSocketContext.Provider value={{ isConnected, send }}>
      {children}
    </WebSocketContext.Provider>
  )
}
