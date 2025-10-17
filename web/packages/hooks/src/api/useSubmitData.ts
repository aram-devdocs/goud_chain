import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SubmitDataRequest, SubmitDataResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useSubmitData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubmitDataRequest) => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE}/data/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
