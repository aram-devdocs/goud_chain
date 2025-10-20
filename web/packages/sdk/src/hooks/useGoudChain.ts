/**
 * React hook for accessing the Goud Chain SDK instance.
 * 
 * This should be used in combination with a context provider
 * to share the SDK instance across the application.
 */

import { createContext, useContext } from 'react';
import type { GoudChain } from '../client';

const GoudChainContext = createContext<GoudChain | null>(null);

export const GoudChainProvider = GoudChainContext.Provider;

/**
 * Hook to access the Goud Chain SDK instance.
 * 
 * @throws Error if used outside of GoudChainProvider
 */
export function useGoudChain(): GoudChain {
  const sdk = useContext(GoudChainContext);
  
  if (!sdk) {
    throw new Error('useGoudChain must be used within GoudChainProvider');
  }
  
  return sdk;
}
