import { useMutation } from '@tanstack/react-query'
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginRequest,
  LoginResponse,
} from '@workspace/types'

export function useCreateAccount() {
  return useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      const response = await fetch('/api/account/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create account')
      }

      return response.json() as Promise<CreateAccountResponse>
    },
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await fetch('/api/account/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to login')
      }

      return response.json() as Promise<LoginResponse>
    },
  })
}
