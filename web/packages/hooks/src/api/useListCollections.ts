import { useQuery } from '@tanstack/react-query'
import type { ListCollectionsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useListCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const apiKey = localStorage.getItem('api_key')
      if (!apiKey) throw new Error('API key not found. Please log in again.')

      const response = await fetch(`${API_BASE}/api/data/list`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<ListCollectionsResponse>(response)
    },
  })
}
