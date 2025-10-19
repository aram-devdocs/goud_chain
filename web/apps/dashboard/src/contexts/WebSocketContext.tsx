import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useWebSocket } from '@goudchain/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@goudchain/hooks'

export interface ActivityEvent {
  id: string
  type: 'blockchain' | 'collection' | 'peer' | 'audit' | 'metrics'
  message: string
  timestamp: number
}

interface WebSocketContextType {
  isConnected: boolean
  send: (message: unknown) => void
  activityFeed: ActivityEvent[]
  clearActivityFeed: () => void
  lastMessage: unknown
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
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([])

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

  // Helper to add activity
  const addActivity = (type: ActivityEvent['type'], message: string) => {
    const event: ActivityEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
    }
    setActivityFeed((prev) => [event, ...prev].slice(0, 50)) // Keep last 50 items
  }

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
          addActivity('blockchain', 'New block added to chain')
          info('New block added to chain')
          break

        case 'collection_update':
          // Invalidate collections query
          queryClient.invalidateQueries({ queryKey: ['collections'] })
          addActivity('collection', 'New collection created')
          success('New collection created')
          break

        case 'peer_update':
          // Invalidate peers query
          queryClient.invalidateQueries({ queryKey: ['peers'] })
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
          addActivity('peer', 'Network topology changed')
          info('Network topology changed')
          break

        case 'audit_log_update':
          // Don't invalidate audit logs query - let the audit page handle real-time events
          addActivity('audit', 'New audit log entry')
          break

        case 'metrics_update':
          // Invalidate metrics query
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
          addActivity('metrics', 'System metrics updated')
          break

        default:
          console.log('Unknown WebSocket event:', message.event)
      }
    }
  }, [lastMessage, queryClient, success, info])

  const clearActivityFeed = () => {
    setActivityFeed([])
  }

  return (
    <WebSocketContext.Provider value={{ isConnected, send, activityFeed, clearActivityFeed, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}
