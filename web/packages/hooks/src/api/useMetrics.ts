import { useQuery } from '@tanstack/react-query'
import type { MetricsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/stats`)
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<MetricsResponse>(response)
    },
  })
}
