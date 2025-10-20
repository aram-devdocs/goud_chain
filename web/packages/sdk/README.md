# @goudchain/sdk

Type-safe API client for Goud Chain blockchain, auto-generated from OpenAPI specification.

## Features

- **Type-Safe**: Full TypeScript support with auto-generated types from OpenAPI spec
- **Dual Clients**: Fetch API client + TanStack Query hooks for React
- **Authentication**: Automatic token management (API key + JWT session tokens)
- **Encryption**: Client-side AES-256-GCM encryption/decryption with PBKDF2 key derivation
- **WebSocket**: Real-time blockchain events with auto-reconnect
- **Error Handling**: Comprehensive error types and automatic retry logic

## Installation

```bash
pnpm install @goudchain/sdk
```

## Usage

### Basic Setup

```typescript
import { GoudChain } from '@goudchain/sdk'

// Initialize SDK
const sdk = new GoudChain({
  baseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080',
})

// Create account
const account = await sdk.auth.createAccount({
  metadata: { username: 'alice' },
})
console.log('Save this API key:', account.api_key)

// Login with API key
await sdk.auth.login(account.api_key)

// Submit encrypted data
const result = await sdk.data.submit({
  label: 'medical-records',
  data: JSON.stringify({ diagnosis: 'healthy' }),
})

// List collections
const collections = await sdk.data.listCollections()

// Decrypt collection
const decrypted = await sdk.data.decrypt(collections[0].collection_id)
console.log('Decrypted data:', decrypted.data)
```

### React with TanStack Query

```typescript
import { useSubmitData, useListCollections } from '@goudchain/sdk';

function MyComponent() {
  const submitData = useSubmitData();
  const { data: collections } = useListCollections();

  const handleSubmit = async (label: string, data: string) => {
    await submitData.mutateAsync({ label, data });
  };

  return (
    <div>
      {collections?.map(c => (
        <div key={c.collection_id}>{c.label}</div>
      ))}
    </div>
  );
}
```

### WebSocket Real-time Updates

```typescript
// Connect to WebSocket
sdk.ws.connect()

// Subscribe to blockchain updates
sdk.ws.subscribe('blockchain_update', (event) => {
  console.log('New block:', event.data)
})

// Disconnect when done
sdk.ws.disconnect()
```

## Development

### Generate OpenAPI Client

Make sure the backend is running, then:

```bash
pnpm generate
```

This fetches the OpenAPI spec from `http://localhost:8080/api-docs/openapi.json` and generates TypeScript types and client code.

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

## Architecture

```
src/
├── generated/       # Auto-generated from OpenAPI spec (do not edit)
├── crypto/          # AES-256-GCM encryption/decryption utilities
├── auth/            # Authentication manager (dual-token strategy)
├── websocket/       # WebSocket client with typed events
├── client/          # High-level SDK client wrapper
├── types/           # Custom types and error classes
└── index.ts         # Public API exports
```

## Security Notes

- API keys are stored in localStorage (vulnerable to XSS in PoC)
- Production should use HttpOnly cookies for session tokens
- Client-side encryption prevents server from reading plaintext data
- PBKDF2 with 100,000 iterations for key derivation
