import { useState, useEffect, useCallback } from 'react'
import type { LoginResponse } from '@workspace/types'

interface AuthState {
  token: string | null
  userId: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('session_token')
    const userId = localStorage.getItem('user_id')
    return {
      token,
      userId,
      isAuthenticated: !!token,
    }
  })

  const login = useCallback((response: LoginResponse) => {
    localStorage.setItem('session_token', response.session_token)
    localStorage.setItem('user_id', response.user_id)
    setAuth({
      token: response.session_token,
      userId: response.user_id,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
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
    const checkAuth = () => {
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
