import { useMutation } from '@tanstack/react-query'
import type { DecryptDataResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useDecryptData() {
  return useMutation({
    mutationFn: async (dataId: string) => {
      const apiKey = localStorage.getItem('api_key')
      if (!apiKey) throw new Error('API key not found. Please log in again.')

      const response = await fetch(`${API_BASE}/api/data/decrypt/${dataId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<DecryptDataResponse>(response)
    },
  })
}
