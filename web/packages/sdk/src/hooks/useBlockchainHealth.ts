/**
 * React hook for fetching blockchain health status.
 */

import { useQuery } from '@tanstack/react-query';
import { useGoudChain } from './useGoudChain';

export function useBlockchainHealth() {
  const sdk = useGoudChain();

  return useQuery({
    queryKey: ['blockchain', 'health'],
    queryFn: async () => {
      return await sdk.blockchain.getHealth();
    },
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
