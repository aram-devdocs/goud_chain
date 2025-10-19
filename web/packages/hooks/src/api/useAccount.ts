import { useMutation } from '@tanstack/react-query'
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginRequest,
  LoginResponse,
} from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useCreateAccount() {
  return useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      const response = await fetch(`${API_BASE}/api/account/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<CreateAccountResponse>(response)
    },
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await fetch(`${API_BASE}/api/account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<LoginResponse>(response)
    },
  })
}
