import { useQuery } from '@tanstack/react-query'
import type { PeersResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function usePeers() {
  return useQuery({
    queryKey: ['peers'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/peers`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<PeersResponse>(response)
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}
