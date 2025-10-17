import { useQuery } from '@tanstack/react-query'
import type { ChainInfo, Block } from '@goudchain/types'

export function useChainInfo() {
  return useQuery({
    queryKey: ['chain'],
    queryFn: async () => {
      const response = await fetch('/api/chain')
      if (!response.ok) {
        throw new Error('Failed to fetch chain info')
      }
      return response.json() as Promise<ChainInfo>
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
        throw new Error('Failed to fetch block')
      }
      return response.json() as Promise<Block>
    },
    enabled: blockNumber >= 0,
  })
}
