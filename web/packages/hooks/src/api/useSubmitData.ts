import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SubmitDataRequest, SubmitDataResponse } from '@goudchain/types'

export function useSubmitData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubmitDataRequest) => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/data/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit data')
      }

      return response.json() as Promise<SubmitDataResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['chain'] })
    },
  })
}
