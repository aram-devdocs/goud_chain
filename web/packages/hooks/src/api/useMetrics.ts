import { useQuery } from '@tanstack/react-query'
import type { MetricsResponse } from '@goudchain/types'

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      return response.json() as Promise<MetricsResponse>
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}
