/**
 * React hook for listing all collections.
 */

import { useQuery } from '@tanstack/react-query'
import { useGoudChain } from './useGoudChain'
import type { CollectionListItem } from '../client'

export function useListCollections() {
  const sdk = useGoudChain()

  return useQuery<CollectionListItem[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      return await sdk.data.listCollections()
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchInterval: 60000, // Refetch every minute in background
  })
}
