import { useMutation } from '@tanstack/react-query'
import type { DecryptDataResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'

export function useDecryptData() {
  return useMutation({
    mutationFn: async (dataId: string) => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`/api/data/decrypt/${dataId}`, {
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
