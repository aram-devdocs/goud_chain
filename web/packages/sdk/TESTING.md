# Testing Guide for @goudchain/sdk

This document provides testing instructions and examples for the Goud Chain SDK.

## Prerequisites

1. Backend must be running:
   ```bash
   ./run start
   ```

2. Install dependencies:
   ```bash
   cd web
   pnpm install
   ```

## Manual Testing

### 1. Account Creation and Login

```typescript
import { GoudChain } from '@goudchain/sdk';

const sdk = new GoudChain({
  baseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080',
});

// Create account
const account = await sdk.auth.createAccount({
  metadata: { username: 'test-user' },
});

console.log('Account ID:', account.account_id);
console.log('API Key:', account.api_key);
console.log('Warning:', account.warning);

// Login with API key
const loginResult = await sdk.auth.login(account.api_key);
console.log('Session Token:', loginResult.session_token);
console.log('Expires In:', loginResult.expires_in);

// Check authentication status
console.log('Is Authenticated:', sdk.auth.isAuthenticated());
```

### 2. Data Submission and Retrieval

```typescript
// Submit encrypted data
const submitResult = await sdk.data.submit({
  label: 'test-collection',
  data: JSON.stringify({ message: 'Hello, blockchain!' }),
});

console.log('Collection ID:', submitResult.collection_id);
console.log('Block Number:', submitResult.block_number);

// List all collections
const collections = await sdk.data.listCollections();
console.log('Collections:', collections);

// Decrypt specific collection
const decrypted = await sdk.data.decrypt(submitResult.collection_id);
console.log('Decrypted Data:', decrypted.data);
```

### 3. Blockchain Operations

```typescript
// Get blockchain health
const health = await sdk.blockchain.getHealth();
console.log('Health Status:', health);

// Get chain statistics
const chain = await sdk.blockchain.getChain();
console.log('Chain Stats:', chain);

// Get peer information
const peers = await sdk.blockchain.getPeers();
console.log('Peers:', peers);

// Get metrics
const metrics = await sdk.blockchain.getMetrics();
console.log('Metrics:', metrics);
```

### 4. WebSocket Events

```typescript
// Connect to WebSocket
sdk.ws.connect();

// Subscribe to blockchain updates
sdk.ws.subscribe('blockchain_update', (event) => {
  console.log('New block created:', event);
});

// Subscribe to collection updates
sdk.ws.subscribe('collection_update', (event) => {
  console.log('New collection created:', event);
});

// Subscribe to peer updates
sdk.ws.subscribe('peer_update', (event) => {
  console.log('Peer network changed:', event);
});

// Check connection status
console.log('WebSocket Connected:', sdk.ws.isConnected());

// Disconnect when done
sdk.ws.disconnect();
```

### 5. Error Handling

```typescript
import {
  AuthenticationError,
  EncryptionError,
  NetworkError,
  ValidationError,
} from '@goudchain/sdk';

try {
  await sdk.data.submit({
    label: 'test',
    data: 'invalid json',
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof EncryptionError) {
    console.error('Encryption failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message, 'Status:', error.statusCode);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

## React Hook Testing

### 1. Setup Provider

```tsx
import { GoudChain, GoudChainProvider } from '@goudchain/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const sdk = new GoudChain({
  baseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080',
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoudChainProvider value={sdk}>
        <YourComponents />
      </GoudChainProvider>
    </QueryClientProvider>
  );
}
```

### 2. Test Submit Data Hook

```tsx
import { useSubmitData } from '@goudchain/sdk';

function SubmitDataTest() {
  const submitData = useSubmitData();

  const handleSubmit = async () => {
    try {
      const result = await submitData.mutateAsync({
        label: 'test-hook',
        data: JSON.stringify({ test: true }),
      });
      console.log('Submitted:', result);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={submitData.isPending}>
        {submitData.isPending ? 'Submitting...' : 'Submit Data'}
      </button>
      {submitData.isError && (
        <div>Error: {submitData.error.message}</div>
      )}
      {submitData.isSuccess && (
        <div>Success: {submitData.data.collection_id}</div>
      )}
    </div>
  );
}
```

### 3. Test List Collections Hook

```tsx
import { useListCollections } from '@goudchain/sdk';

function CollectionsListTest() {
  const { data, isLoading, error, refetch } = useListCollections();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data?.map((collection) => (
          <li key={collection.collection_id}>
            {collection.label} - Block #{collection.block_number}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Test Decrypt Collection Hook

```tsx
import { useDecryptCollection } from '@goudchain/sdk';
import { useState } from 'react';

function DecryptCollectionTest() {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const { data, isLoading, error } = useDecryptCollection(collectionId);

  return (
    <div>
      <input
        placeholder="Collection ID"
        onChange={(e) => setCollectionId(e.target.value || null)}
      />
      {isLoading && <div>Decrypting...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <div>
          <h3>{data.label}</h3>
          <pre>{data.data}</pre>
        </div>
      )}
    </div>
  );
}
```

### 5. Test WebSocket Hook

```tsx
import { useWebSocketEvents } from '@goudchain/sdk';
import { useState } from 'react';

function WebSocketTest() {
  const [events, setEvents] = useState<any[]>([]);

  useWebSocketEvents({
    eventType: 'blockchain_update',
    onEvent: (event) => {
      setEvents((prev) => [...prev, event]);
    },
  });

  return (
    <div>
      <h3>Blockchain Updates</h3>
      <ul>
        {events.map((event, i) => (
          <li key={i}>{JSON.stringify(event)}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Automated Testing

### Unit Tests (Crypto Layer)

```typescript
import { encryptData, decryptData } from '@goudchain/sdk';

describe('Encryption', () => {
  const apiKey = 'dGVzdF9hcGlfa2V5X2Jhc2U2NA=='; // test_api_key_base64
  const plaintext = 'Hello, World!';

  test('encrypt and decrypt roundtrip', async () => {
    const encrypted = await encryptData(plaintext, apiKey);
    const decrypted = await decryptData(encrypted, apiKey);
    expect(decrypted).toBe(plaintext);
  });

  test('decryption with wrong key fails', async () => {
    const encrypted = await encryptData(plaintext, apiKey);
    const wrongKey = 'ZGlmZmVyZW50X2tleQ=='; // different_key
    
    await expect(decryptData(encrypted, wrongKey)).rejects.toThrow();
  });

  test('tampered ciphertext detection', async () => {
    const encrypted = await encryptData(plaintext, apiKey);
    
    // Tamper with ciphertext
    const tampered = {
      ciphertext: encrypted.ciphertext.slice(0, -1) + 'X',
    };
    
    await expect(decryptData(tampered, apiKey)).rejects.toThrow();
  });
});
```

### Integration Tests (with MSW)

```typescript
import { GoudChain } from '@goudchain/sdk';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('http://localhost:8080/api/account/create', () => {
    return HttpResponse.json({
      account_id: 'test-account-id',
      api_key: 'test-api-key',
      warning: 'Test warning',
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SDK Integration', () => {
  test('create account', async () => {
    const sdk = new GoudChain({ baseUrl: 'http://localhost:8080' });
    const result = await sdk.auth.createAccount();
    
    expect(result.account_id).toBe('test-account-id');
    expect(result.api_key).toBe('test-api-key');
  });
});
```

## Performance Testing

### Encryption Benchmarks

```typescript
import { encryptData, decryptData } from '@goudchain/sdk';

async function benchmarkEncryption() {
  const apiKey = 'dGVzdF9hcGlfa2V5X2Jhc2U2NA==';
  const data = JSON.stringify({ test: 'data' });
  
  const iterations = 1000;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const encrypted = await encryptData(data, apiKey);
    await decryptData(encrypted, apiKey);
  }
  
  const end = performance.now();
  const avgTime = (end - start) / iterations;
  
  console.log(`Average encrypt+decrypt time: ${avgTime.toFixed(2)}ms`);
  console.log(`Target: < 10ms per operation`);
}
```

### TanStack Query Cache Performance

```typescript
// Monitor cache hit rates
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated') {
    console.log('Query updated:', event.query.queryKey);
    console.log('Cache hit:', !event.query.state.isFetching);
  }
});
```

## Security Testing

### Tampered Data Detection

```typescript
test('rejects tampered ciphertext', async () => {
  const encrypted = await encryptData('test', apiKey);
  
  // Modify IV
  const tamperedIV = {
    ciphertext: 'X' + encrypted.ciphertext.slice(1),
  };
  
  await expect(decryptData(tamperedIV, apiKey)).rejects.toThrow();
});
```

### Invalid API Key Handling

```typescript
test('rejects invalid API key format', () => {
  expect(isValidApiKey('')).toBe(false);
  expect(isValidApiKey('not-base64!')).toBe(false);
  expect(isValidApiKey(null as any)).toBe(false);
  expect(isValidApiKey('dGVzdA==')).toBe(true);
});
```

## Troubleshooting

### Backend Not Available

If you see "Backend not available" during generation:

```bash
# Start the backend
./run start

# Verify it's running
curl http://localhost:8080/api/health

# Regenerate SDK
cd web/packages/sdk
pnpm generate
```

### Type Errors

If you see TypeScript errors after regeneration:

```bash
# Clean and rebuild
pnpm clean
pnpm build
```

### WebSocket Connection Failures

Check WebSocket connection:

```typescript
const sdk = new GoudChain({
  wsUrl: 'ws://localhost:8080', // Correct protocol
});

sdk.ws.connect();

// Check connection status
setTimeout(() => {
  console.log('Connected:', sdk.ws.isConnected());
}, 2000);
```
