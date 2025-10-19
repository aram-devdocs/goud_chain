import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../config'

interface ValidatorInfo {
  next_block_number: number
  expected_validator: string
  validator_address: string
  is_this_node_validator: boolean
  current_node_id: string
}

export function useValidator() {
  return useQuery<ValidatorInfo>({
    queryKey: ['validator'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/validator/current`)

      if (!response.ok) {
        throw new Error('Failed to fetch validator info')
      }

      return response.json()
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}
