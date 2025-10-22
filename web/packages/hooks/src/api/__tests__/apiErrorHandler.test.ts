/**
 * Unit tests for apiErrorHandler
 * Tests error handling logic for 401 Unauthorized and 5xx Server Errors
 *
 * NOTE: Requires test infrastructure setup (vitest/jest) to run
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleApiError } from '../apiErrorHandler'
import { ERROR_MESSAGES, ROUTES } from '@goudchain/utils'

describe('handleApiError', () => {
  // Mock window.location
  const mockLocation = {
    pathname: '',
    href: '',
  }

  beforeEach(() => {
    // Setup localStorage mock
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }

    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('401 Unauthorized errors', () => {
    it('should clear all auth tokens on 401', async () => {
      const response = new Response(null, { status: 401 })
      mockLocation.pathname = '/some-page'

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      expect(localStorage.removeItem).toHaveBeenCalledWith('session_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('api_key')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_id')
    })

    it('should redirect to auth page on 401', async () => {
      const response = new Response(null, { status: 401 })
      mockLocation.pathname = '/dashboard'

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      expect(mockLocation.href).toBe(ROUTES.AUTH)
    })

    it('should not redirect if already on auth page', async () => {
      const response = new Response(null, { status: 401 })
      mockLocation.pathname = ROUTES.AUTH
      mockLocation.href = ROUTES.AUTH

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      // href should not change
      expect(mockLocation.href).toBe(ROUTES.AUTH)
    })

    it('should throw error with session expired message', async () => {
      const response = new Response(null, { status: 401 })
      mockLocation.pathname = '/dashboard'

      await expect(handleApiError(response)).rejects.toThrow(ERROR_MESSAGES.SESSION_EXPIRED)
    })
  })

  describe('5xx Server errors', () => {
    it('should redirect to service unavailable page on 500 error', async () => {
      const response = new Response(null, { status: 500 })
      mockLocation.pathname = '/dashboard'

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      expect(mockLocation.href).toBe(ROUTES.SERVICE_UNAVAILABLE)
    })

    it('should redirect to service unavailable page on 503 error', async () => {
      const response = new Response(null, { status: 503 })
      mockLocation.pathname = '/dashboard'

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      expect(mockLocation.href).toBe(ROUTES.SERVICE_UNAVAILABLE)
    })

    it('should not redirect if already on service unavailable page', async () => {
      const response = new Response(null, { status: 500 })
      mockLocation.pathname = ROUTES.SERVICE_UNAVAILABLE
      mockLocation.href = ROUTES.SERVICE_UNAVAILABLE

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      // href should not change
      expect(mockLocation.href).toBe(ROUTES.SERVICE_UNAVAILABLE)
    })

    it('should throw error with service unavailable message', async () => {
      const response = new Response(null, { status: 503 })
      mockLocation.pathname = '/dashboard'

      await expect(handleApiError(response)).rejects.toThrow(
        ERROR_MESSAGES.SERVICE_UNAVAILABLE
      )
    })

    it('should handle all 5xx status codes', async () => {
      const statuses = [500, 501, 502, 503, 504, 599]

      for (const status of statuses) {
        mockLocation.pathname = '/dashboard'
        const response = new Response(null, { status })

        try {
          await handleApiError(response)
        } catch (error) {
          // Expected to throw
        }

        expect(mockLocation.href).toBe(ROUTES.SERVICE_UNAVAILABLE)
      }
    })
  })

  describe('Error message extraction', () => {
    it('should extract error message from JSON response', async () => {
      const errorBody = { error: 'Custom error message' }
      const response = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })

      await expect(handleApiError(response)).rejects.toThrow('Custom error message')
    })

    it('should use default message when JSON parsing fails', async () => {
      const response = new Response('Invalid JSON', {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })

      await expect(handleApiError(response)).rejects.toThrow('Request failed with status 400')
    })

    it('should handle non-JSON responses', async () => {
      const response = new Response('Plain text error', {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      })

      await expect(handleApiError(response)).rejects.toThrow('Plain text error')
    })

    it('should use default message for long non-JSON responses', async () => {
      const longText = 'x'.repeat(300)
      const response = new Response(longText, {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      })

      await expect(handleApiError(response)).rejects.toThrow('Request failed with status 400')
    })
  })

  describe('Redirect loop prevention', () => {
    it('should prevent infinite redirect loop on 401 when on auth page', async () => {
      const response = new Response(null, { status: 401 })
      mockLocation.pathname = '/auth/login'
      const originalHref = '/auth/login'
      mockLocation.href = originalHref

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      // Should not change href when already on auth page
      expect(mockLocation.href).toBe(originalHref)
    })

    it('should prevent infinite redirect loop on 5xx when on service unavailable page', async () => {
      const response = new Response(null, { status: 503 })
      mockLocation.pathname = '/service-unavailable'
      const originalHref = '/service-unavailable'
      mockLocation.href = originalHref

      try {
        await handleApiError(response)
      } catch (error) {
        // Expected to throw
      }

      // Should not change href when already on service unavailable page
      expect(mockLocation.href).toBe(originalHref)
    })
  })
})
