import { useQuery } from '@tanstack/react-query'
import type { ChainInfo, Block } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'

export function useChainInfo() {
  return useQuery({
    queryKey: ['chain'],
    queryFn: async () => {
      const response = await fetch('/api/chain')
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<ChainInfo>(response)
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

export function useBlockByNumber(blockNumber: number) {
  return useQuery({
    queryKey: ['block', blockNumber],
    queryFn: async () => {
      const response = await fetch(`/api/chain/block/${blockNumber}`)
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<Block>(response)
    },
    enabled: blockNumber >= 0,
  })
}
