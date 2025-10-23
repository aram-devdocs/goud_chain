import { useState, useEffect, useCallback, useRef } from 'react'

export interface WebSocketMessage {
  type: string
  data: unknown
}

export function useWebSocket(url: string, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const connect = useCallback(() => {
    if (!enabled || !url || wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onerror = () => {
        // Suppress console errors - error will trigger onclose for reconnection
      }

      ws.onclose = () => {
        setIsConnected(false)

        // Reconnect with exponential backoff (5s, 10s, 20s, max 30s)
        if (enabled) {
          const retryCount = (wsRef.current as any)?._retryCount ?? 0
          const delay = Math.min(5000 * Math.pow(2, retryCount), 30000)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay) as any

          // Track retry count for backoff
          if (ws as any) {
            ;(ws as any)._retryCount = retryCount + 1
          }
        }
      }

      wsRef.current = ws
    } catch {
      // WebSocket creation failed - will retry via reconnect logic
    }
  }, [url, enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    lastMessage,
    send,
    connect,
    disconnect,
  }
}
