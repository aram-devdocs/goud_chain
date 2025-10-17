import { useQuery } from '@tanstack/react-query'
import type { ChainInfo, Block } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export function useChainInfo() {
  return useQuery({
    queryKey: ['chain'],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      const headers: Record<string, string> = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/chain`, { headers })
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<ChainInfo>(response)
    },
  })
}

export function useBlock(blockNumber: number) {
  return useQuery({
    queryKey: ['block', blockNumber],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/chain/block/${blockNumber}`)
      if (!response.ok) {
        await handleApiError(response)
      }
      return safeJsonParse<Block>(response)
    },
  })
}
