import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../ToastContext'
import { API_BASE } from '../config'

export function useSync() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/api/sync`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to trigger sync')
      }

      const data = await response.json()
      return data
    },
    onSuccess: () => {
      success('Blockchain sync triggered successfully')
      // Invalidate chain and peers data
      queryClient.invalidateQueries({ queryKey: ['chain'] })
      queryClient.invalidateQueries({ queryKey: ['peers'] })
    },
    onError: (error: Error) => {
      showError(`Sync failed: ${error.message}`)
    },
  })
}
