import { useState, useEffect, useCallback } from 'react'
import type { LoginResponse } from '@goudchain/types'

/**
 * SECURITY WARNING: localStorage Storage
 *
 * Session tokens and API keys are stored in localStorage for simplicity.
 * This is vulnerable to XSS attacks - if malicious JavaScript is injected,
 * attackers can exfiltrate tokens and gain permanent account access.
 *
 * Production recommendations:
 * 1. Use HttpOnly, Secure, SameSite=Strict cookies for session tokens
 * 2. Implement Content-Security-Policy headers
 * 3. Consider using a token refresh mechanism
 * 4. Never store API keys client-side (use backend-managed sessions)
 *
 * Current risk: HIGH - permanent account compromise via XSS
 */

interface AuthState {
  token: string | null
  userId: string | null
  isAuthenticated: boolean
}

export function useAuth(): {
  token: string | null
  userId: string | null
  isAuthenticated: boolean
  login: (response: LoginResponse) => void
  logout: () => void
} {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('session_token')
    const userId = localStorage.getItem('user_id')
    return {
      token,
      userId,
      isAuthenticated: !!token,
    }
  })

  const login = useCallback((response: LoginResponse): void => {
    console.log('[useAuth] login called with:', response)
    localStorage.setItem('session_token', response.session_token)
    localStorage.setItem('user_id', response.user_id)
    console.log('[useAuth] stored in localStorage:', {
      session_token: localStorage.getItem('session_token'),
      user_id: localStorage.getItem('user_id'),
    })
    setAuth({
      token: response.session_token,
      userId: response.user_id,
      isAuthenticated: true,
    })
    console.log('[useAuth] auth state updated to authenticated')
  }, [])

  const logout = useCallback((): void => {
    localStorage.removeItem('session_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('api_key')
    setAuth({
      token: null,
      userId: null,
      isAuthenticated: false,
    })
  }, [])

  useEffect(() => {
    const checkAuth = (): void => {
      const token = localStorage.getItem('session_token')
      if (!token) {
        logout()
      }
    }

    const interval = setInterval(checkAuth, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [logout])

  return {
    ...auth,
    login,
    logout,
  }
}
