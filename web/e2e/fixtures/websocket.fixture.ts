import { test as base, Page } from '@playwright/test'

/**
 * WebSocket Fixture
 *
 * Provides utilities for testing WebSocket real-time updates.
 * Includes helpers for waiting for specific events and validating event data.
 */

export interface WebSocketFixtures {
  websocket: {
    waitForEvent: (eventType: string, timeout?: number) => Promise<any>
    waitForBlockEvent: (timeout?: number) => Promise<any>
    waitForCollectionEvent: (timeout?: number) => Promise<any>
    isConnected: () => Promise<boolean>
  }
}

export const test = base.extend<WebSocketFixtures>({
  websocket: async ({ page }, use) => {
    const websocket = {
      /**
       * Wait for a specific WebSocket event type
       */
      async waitForEvent(eventType: string, timeout = 10000): Promise<any> {
        return await page.evaluate(
          ({ eventType, timeout }) => {
            return new Promise((resolve, reject) => {
              const timer = setTimeout(() => {
                reject(
                  new Error(
                    `WebSocket event '${eventType}' not received within ${timeout}ms`
                  )
                )
              }, timeout)

              // Listen for WebSocket messages
              const handleMessage = (event: MessageEvent) => {
                try {
                  const data = JSON.parse(event.data)

                  if (data.type === eventType) {
                    clearTimeout(timer)
                    window.removeEventListener('message', handleMessage)
                    resolve(data)
                  }
                } catch (error) {
                  // Ignore parse errors
                }
              }

              window.addEventListener('message', handleMessage)
            })
          },
          { eventType, timeout }
        )
      },

      /**
       * Wait for a blockchain update event
       */
      async waitForBlockEvent(timeout = 10000): Promise<any> {
        return await this.waitForEvent('blockchain_update', timeout)
      },

      /**
       * Wait for a collection created event
       */
      async waitForCollectionEvent(timeout = 10000): Promise<any> {
        return await this.waitForEvent('collection_created', timeout)
      },

      /**
       * Check if WebSocket is connected
       */
      async isConnected(): Promise<boolean> {
        return await page.evaluate(() => {
          // Check if WebSocketContext has an active connection
          // This assumes the WebSocket status is reflected in the UI
          const statusElement = document.querySelector(
            '[data-testid="ws-status"]'
          )
          return statusElement?.textContent?.includes('Connected') || false
        })
      },
    }

    await use(websocket)
  },
})

export { expect } from '@playwright/test'
