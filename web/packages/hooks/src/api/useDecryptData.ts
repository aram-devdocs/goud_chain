import { useMutation } from '@tanstack/react-query'
import type { DecryptDataResponse } from '@workspace/types'

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
        const error = await response.json()
        throw new Error(error.error || 'Failed to decrypt data')
      }

      return response.json() as Promise<DecryptDataResponse>
    },
  })
}
