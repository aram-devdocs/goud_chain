import { useQuery } from '@tanstack/react-query'
import type { MetricsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch('/api/stats')
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<MetricsResponse>(response)
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}
