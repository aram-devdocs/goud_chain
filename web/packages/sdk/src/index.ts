/**
 * @goudchain/sdk - Type-safe API client for Goud Chain blockchain
 * 
 * Main exports for SDK usage in applications.
 */

// Main SDK client
export { GoudChain } from './client';
export type {
  GoudChainConfig,
  CreateAccountRequest,
  CreateAccountResponse,
  SubmitDataRequest,
  SubmitDataResponse,
  CollectionListItem,
  DecryptCollectionResponse,
} from './client';

// Authentication
export { AuthManager } from './auth';
export type { AuthState, LoginResponse } from './auth';

// Cryptography
export { encryptData, decryptData, isValidApiKey } from './crypto';
export type { EncryptedPayload } from './crypto';

// WebSocket
export { WebSocketClient } from './websocket';
export type { EventType, EventHandler, WebSocketMessage } from './websocket';

// Error types
export * from './types';

// React hooks
export * from './hooks';
