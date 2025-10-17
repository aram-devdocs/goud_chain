import { useQuery } from '@tanstack/react-query'
import type { MetricsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      const headers: Record<string, string> = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/stats`, { headers })
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<MetricsResponse>(response)
    },
  })
}
