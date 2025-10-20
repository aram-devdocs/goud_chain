/**
 * React hook for subscribing to WebSocket events.
 */

import { useEffect } from 'react'
import { useGoudChain } from './useGoudChain'
import type { EventType, EventHandler } from '../websocket'

export interface UseWebSocketEventsOptions<T = any> {
  /** Event type to subscribe to */
  eventType: EventType
  /** Event handler callback */
  onEvent: EventHandler<T>
  /** Whether to automatically connect (default: true) */
  autoConnect?: boolean
  /** Whether the subscription is enabled (default: true) */
  enabled?: boolean
}

/**
 * Hook for subscribing to WebSocket events with automatic cleanup.
 *
 * @example
 * ```typescript
 * useWebSocketEvents({
 *   eventType: 'blockchain_update',
 *   onEvent: (data) => console.log('New block:', data),
 * });
 * ```
 */
export function useWebSocketEvents<T = any>({
  eventType,
  onEvent,
  autoConnect = true,
  enabled = true,
}: UseWebSocketEventsOptions<T>): void {
  const sdk = useGoudChain()

  useEffect(() => {
    if (!enabled) return

    // Connect to WebSocket if not already connected
    if (autoConnect && !sdk.ws.isConnected()) {
      sdk.ws.connect()
    }

    // Subscribe to event
    sdk.ws.subscribe(eventType, onEvent)

    // Cleanup: unsubscribe on unmount
    return () => {
      sdk.ws.unsubscribe(eventType, onEvent)
    }
  }, [sdk, eventType, onEvent, autoConnect, enabled])
}
