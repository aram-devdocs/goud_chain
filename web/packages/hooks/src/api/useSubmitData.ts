import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SubmitDataRequest, SubmitDataResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useSubmitData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubmitDataRequest) => {
      // Data submission requires the actual API key, not session token
      const apiKey = localStorage.getItem('api_key')
      if (!apiKey) throw new Error('API key not found. Please save your API key.')

      const response = await fetch(`${API_BASE}/api/data/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<SubmitDataResponse>(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}
