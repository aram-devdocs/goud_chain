import { useQuery } from '@tanstack/react-query'
import type { ListCollectionsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useListCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE}/data/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<ListCollectionsResponse>(response)
    },
  })
}
