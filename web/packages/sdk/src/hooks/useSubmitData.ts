/**
 * React hook for submitting encrypted data to the blockchain.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGoudChain } from './useGoudChain'
import type { SubmitDataRequest, SubmitDataResponse } from '../client'

export function useSubmitData() {
  const sdk = useGoudChain()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      request: SubmitDataRequest
    ): Promise<SubmitDataResponse> => {
      return await sdk.data.submit(request)
    },
    onSuccess: () => {
      // Invalidate collections query to refetch after submission
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}
