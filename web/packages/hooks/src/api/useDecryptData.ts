import { useMutation } from '@tanstack/react-query'
import type { DecryptDataResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useDecryptData() {
  return useMutation({
    mutationFn: async (dataId: string) => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE}/data/decrypt/${dataId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<DecryptDataResponse>(response)
    },
  })
}
