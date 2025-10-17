import { useQuery } from '@tanstack/react-query'
import type { ListCollectionsResponse } from '@workspace/types'

export function useListCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/data/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch collections')
      }

      return response.json() as Promise<ListCollectionsResponse>
    },
    staleTime: 30000, // 30 seconds
  })
}
