/**
 * React hook for decrypting a specific collection.
 */

import { useQuery } from '@tanstack/react-query';
import { useGoudChain } from './useGoudChain';
import type { DecryptCollectionResponse } from '../client';

export function useDecryptCollection(collectionId: string | null) {
  const sdk = useGoudChain();

  return useQuery<DecryptCollectionResponse>({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      if (!collectionId) {
        throw new Error('Collection ID is required');
      }
      return await sdk.data.decrypt(collectionId);
    },
    enabled: !!collectionId, // Only run query if collectionId is provided
    staleTime: 300000, // Collections don't change, cache for 5 minutes
  });
}
