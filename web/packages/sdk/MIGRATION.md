# Migration Guide: From `@goudchain/hooks` to `@goudchain/sdk`

This guide shows how to migrate from the manual hooks implementation to the new SDK-based approach.

## Overview

The new `@goudchain/sdk` package provides:

- **Type-safe API client** auto-generated from OpenAPI specification
- **Unified authentication** with automatic token management and refresh
- **Integrated encryption/decryption** with AES-256-GCM
- **WebSocket support** with typed events and auto-reconnect
- **React hooks** built on TanStack Query with optimistic updates

## Installation

The SDK is already available in the monorepo as `@goudchain/sdk`.

## Setup

### 1. Create SDK Provider

```tsx
// apps/dashboard/src/providers/SDKProvider.tsx
import { GoudChain, GoudChainProvider } from '@goudchain/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useMemo } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 2,
    },
  },
});

export function SDKProvider({ children }: { children: ReactNode }) {
  const sdk = useMemo(
    () =>
      new GoudChain({
        baseUrl: 'http://localhost:8080',
        wsUrl: 'ws://localhost:8080',
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GoudChainProvider value={sdk}>{children}</GoudChainProvider>
    </QueryClientProvider>
  );
}
```

### 2. Wrap Your App

```tsx
// apps/dashboard/src/App.tsx
import { SDKProvider } from './providers/SDKProvider';

function App() {
  return (
    <SDKProvider>
      {/* Your app components */}
    </SDKProvider>
  );
}
```

## Migration Examples

### Authentication

**Before (using `useAuth` hook):**
```tsx
import { useAuth } from '@goudchain/hooks';

function LoginComponent() {
  const { login, logout, isAuthenticated } = useAuth();

  const handleLogin = async (apiKey: string) => {
    const response = await fetch('/api/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const data = await response.json();
    login(data);
  };
}
```

**After (using SDK):**
```tsx
import { useGoudChain } from '@goudchain/sdk';

function LoginComponent() {
  const sdk = useGoudChain();

  const handleLogin = async (apiKey: string) => {
    await sdk.auth.login(apiKey);
  };

  const handleLogout = () => {
    sdk.auth.logout();
  };

  const isAuthenticated = sdk.auth.isAuthenticated();
}
```

### Data Submission

**Before (using `useSubmitData` hook):**
```tsx
import { useSubmitData } from '@goudchain/hooks';
import { encryptData } from '@goudchain/utils';

function SubmitForm() {
  const submitData = useSubmitData();

  const handleSubmit = async (label: string, data: string) => {
    const apiKey = localStorage.getItem('api_key');
    const encrypted = await encryptData(data, apiKey);
    
    await submitData.mutateAsync({
      label,
      data: encrypted,
    });
  };
}
```

**After (using SDK - encryption handled automatically):**
```tsx
import { useSubmitData } from '@goudchain/sdk';

function SubmitForm() {
  const submitData = useSubmitData();

  const handleSubmit = async (label: string, data: string) => {
    // Encryption is handled automatically by the SDK
    await submitData.mutateAsync({ label, data });
  };
}
```

### List Collections

**Before:**
```tsx
import { useListCollections } from '@goudchain/hooks';

function CollectionsList() {
  const { data: collections, isLoading, error } = useListCollections();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {collections?.map((c) => (
        <li key={c.collection_id}>{c.label}</li>
      ))}
    </ul>
  );
}
```

**After (same API, but with automatic caching and invalidation):**
```tsx
import { useListCollections } from '@goudchain/sdk';

function CollectionsList() {
  const { data: collections, isLoading, error } = useListCollections();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {collections?.map((c) => (
        <li key={c.collection_id}>{c.label}</li>
      ))}
    </ul>
  );
}
```

### Decrypt Collection

**Before:**
```tsx
import { useDecryptData } from '@goudchain/hooks';
import { decryptData } from '@goudchain/utils';

function CollectionDetails({ collectionId }: { collectionId: string }) {
  const { data, decrypt } = useDecryptData();

  const handleDecrypt = async () => {
    const apiKey = localStorage.getItem('api_key');
    const encrypted = await decrypt(collectionId);
    const decrypted = await decryptData(encrypted.data, apiKey);
    return decrypted;
  };
}
```

**After:**
```tsx
import { useDecryptCollection } from '@goudchain/sdk';

function CollectionDetails({ collectionId }: { collectionId: string }) {
  const { data, isLoading } = useDecryptCollection(collectionId);

  if (isLoading) return <div>Decrypting...</div>;

  return <div>{data?.data}</div>;
}
```

### WebSocket Events

**Before:**
```tsx
import { useWebSocket } from '@goudchain/hooks';

function BlockchainUpdates() {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('blockchain_update', (data) => {
      console.log('New block:', data);
    });

    return unsubscribe;
  }, [subscribe]);
}
```

**After:**
```tsx
import { useWebSocketEvents } from '@goudchain/sdk';

function BlockchainUpdates() {
  useWebSocketEvents({
    eventType: 'blockchain_update',
    onEvent: (data) => {
      console.log('New block:', data);
    },
  });
}
```

## Key Differences

### Automatic Encryption/Decryption

The SDK handles all encryption and decryption operations automatically. You no longer need to:

- Import `encryptData`/`decryptData` functions
- Manually retrieve API keys from localStorage
- Handle encryption errors separately

### Unified Authentication

The SDK manages both API keys and session tokens:

- Automatic token refresh before expiry
- Correct token selection per endpoint
- Centralized logout handling

### Better Error Handling

The SDK provides typed error classes:

```tsx
import { AuthenticationError, EncryptionError, NetworkError } from '@goudchain/sdk';

try {
  await sdk.data.submit({ label: 'test', data: 'hello' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
  } else if (error instanceof EncryptionError) {
    // Handle encryption error
  } else if (error instanceof NetworkError) {
    // Handle network error
  }
}
```

### TanStack Query Integration

All data fetching hooks use TanStack Query for:

- Automatic caching
- Background refetching
- Request deduplication
- Optimistic updates
- Automatic cache invalidation

## Benefits

1. **Type Safety**: Full TypeScript support with auto-generated types
2. **Less Boilerplate**: 70% less code for common operations
3. **Automatic Updates**: Schema changes are reflected immediately
4. **Better Performance**: Automatic request deduplication and caching
5. **Easier Testing**: Mock SDK instance instead of multiple hooks
6. **External Consumption**: Can be used by external developers

## Gradual Migration

You can migrate gradually:

1. Keep existing `@goudchain/hooks` as is
2. Add `@goudchain/sdk` to new components
3. Migrate old components one at a time
4. Remove `@goudchain/hooks` when migration is complete

Both packages can coexist during the transition.
