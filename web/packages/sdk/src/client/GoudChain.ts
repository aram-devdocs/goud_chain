/**
 * Main SDK client for Goud Chain blockchain.
 * 
 * Usage:
 * ```typescript
 * const sdk = new GoudChain({
 *   baseUrl: 'http://localhost:8080',
 *   wsUrl: 'ws://localhost:8080',
 * });
 * 
 * // Create account
 * const account = await sdk.auth.createAccount();
 * 
 * // Login
 * await sdk.auth.login(account.api_key);
 * 
 * // Submit data
 * await sdk.data.submit({ label: 'test', data: 'hello' });
 * ```
 */

import { AuthManager, type LoginResponse } from '../auth';
import { WebSocketClient, type EventType, type EventHandler } from '../websocket';
import { encryptData, decryptData } from '../crypto';
import type { EncryptedPayload } from '../crypto';
import { AuthenticationError, EncryptionError, NetworkError } from '../types';

export interface GoudChainConfig {
  /** Base URL for HTTP API (default: http://localhost:8080) */
  baseUrl?: string;
  /** WebSocket URL (default: ws://localhost:8080) */
  wsUrl?: string;
  /** API key for authentication */
  apiKey?: string;
}

export interface CreateAccountRequest {
  metadata?: Record<string, any>;
}

export interface CreateAccountResponse {
  account_id: string;
  api_key: string;
  warning: string;
}

export interface SubmitDataRequest {
  label: string;
  data: string;
}

export interface SubmitDataResponse {
  message: string;
  collection_id: string;
  block_number: number;
}

export interface CollectionListItem {
  collection_id: string;
  label: string;
  created_at: number;
  block_number: number;
}

export interface DecryptCollectionResponse {
  collection_id: string;
  label: string;
  data: string;
  created_at: number;
}

/**
 * Main Goud Chain SDK client.
 */
export class GoudChain {
  private config: Required<GoudChainConfig>;
  private authManager: AuthManager;
  private wsClient: WebSocketClient;

  constructor(config: GoudChainConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:8080',
      wsUrl: config.wsUrl || 'ws://localhost:8080',
      apiKey: config.apiKey || '',
    };

    this.authManager = new AuthManager(this.config.baseUrl);
    this.wsClient = new WebSocketClient(this.config.wsUrl);

    if (this.config.apiKey) {
      this.authManager.setApiKey(this.config.apiKey);
      this.wsClient.setApiKey(this.config.apiKey);
    }
  }

  /**
   * Authentication operations.
   */
  public auth = {
    /**
     * Creates a new account.
     */
    createAccount: async (
      request: CreateAccountRequest = {}
    ): Promise<CreateAccountResponse> => {
      const response = await fetch(`${this.config.baseUrl}/api/account/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new NetworkError(error.error || 'Account creation failed', response.status);
      }

      const data: CreateAccountResponse = await response.json();
      
      // Store API key for future use
      this.authManager.setApiKey(data.api_key);
      this.wsClient.setApiKey(data.api_key);

      return data;
    },

    /**
     * Logs in with API key.
     */
    login: async (apiKey: string): Promise<LoginResponse> => {
      this.authManager.setApiKey(apiKey);
      this.wsClient.setApiKey(apiKey);
      
      try {
        return await this.authManager.login(apiKey);
      } catch (error) {
        throw new AuthenticationError(
          error instanceof Error ? error.message : 'Login failed'
        );
      }
    },

    /**
     * Logs out and clears authentication state.
     */
    logout: (): void => {
      this.authManager.logout();
      this.wsClient.disconnect();
      this.wsClient.setApiKey(null);
    },

    /**
     * Checks if user is authenticated.
     */
    isAuthenticated: (): boolean => {
      return this.authManager.isAuthenticated();
    },

    /**
     * Gets the current API key.
     */
    getApiKey: (): string | null => {
      return this.authManager.getApiKey();
    },

    /**
     * Gets the current user ID.
     */
    getUserId: (): string | null => {
      return this.authManager.getUserId();
    },
  };

  /**
   * Data operations (submit, list, decrypt).
   */
  public data = {
    /**
     * Submits encrypted data to the blockchain.
     */
    submit: async (request: SubmitDataRequest): Promise<SubmitDataResponse> => {
      const apiKey = this.authManager.getApiKey();
      if (!apiKey) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      try {
        // Encrypt data on client side
        const encrypted = await encryptData(request.data, apiKey);

        const response = await fetch(`${this.config.baseUrl}/api/data/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            label: request.label,
            data: encrypted.ciphertext,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new NetworkError(
            error.error || 'Data submission failed',
            response.status
          );
        }

        return await response.json();
      } catch (error) {
        if (error instanceof NetworkError || error instanceof AuthenticationError) {
          throw error;
        }
        throw new EncryptionError('Failed to encrypt data');
      }
    },

    /**
     * Lists all collections for the authenticated user.
     */
    listCollections: async (): Promise<CollectionListItem[]> => {
      const authHeader = this.authManager.getAuthHeader('/api/data/list');
      if (!authHeader) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(`${this.config.baseUrl}/api/data/list`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new NetworkError(
          error.error || 'Failed to list collections',
          response.status
        );
      }

      const data = await response.json();
      return data.collections || [];
    },

    /**
     * Decrypts a collection by ID.
     */
    decrypt: async (collectionId: string): Promise<DecryptCollectionResponse> => {
      const apiKey = this.authManager.getApiKey();
      const authHeader = this.authManager.getAuthHeader(`/api/data/decrypt/${collectionId}`);
      
      if (!apiKey || !authHeader) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(
        `${this.config.baseUrl}/api/data/decrypt/${collectionId}`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new NetworkError(
          error.error || 'Failed to decrypt collection',
          response.status
        );
      }

      const data = await response.json();

      try {
        // Decrypt data on client side
        const decryptedData = await decryptData(data.data, apiKey);

        return {
          ...data,
          data: decryptedData,
        };
      } catch (error) {
        throw new EncryptionError('Failed to decrypt data');
      }
    },
  };

  /**
   * Blockchain operations (health, metrics, peers).
   */
  public blockchain = {
    /**
     * Gets blockchain health status.
     */
    getHealth: async (): Promise<any> => {
      const response = await fetch(`${this.config.baseUrl}/api/health`);
      if (!response.ok) {
        throw new NetworkError('Failed to get health status', response.status);
      }
      return await response.json();
    },

    /**
     * Gets blockchain chain statistics.
     */
    getChain: async (): Promise<any> => {
      const response = await fetch(`${this.config.baseUrl}/api/chain`);
      if (!response.ok) {
        throw new NetworkError('Failed to get chain stats', response.status);
      }
      return await response.json();
    },

    /**
     * Gets connected peers.
     */
    getPeers: async (): Promise<any> => {
      const response = await fetch(`${this.config.baseUrl}/api/peers`);
      if (!response.ok) {
        throw new NetworkError('Failed to get peers', response.status);
      }
      return await response.json();
    },

    /**
     * Gets system metrics.
     */
    getMetrics: async (): Promise<any> => {
      const authHeader = this.authManager.getAuthHeader('/api/metrics');
      const headers: Record<string, string> = {};
      
      if (authHeader) {
        headers.Authorization = authHeader;
      }

      const response = await fetch(`${this.config.baseUrl}/api/metrics`, {
        headers,
      });

      if (!response.ok) {
        throw new NetworkError('Failed to get metrics', response.status);
      }
      return await response.json();
    },
  };

  /**
   * WebSocket operations (connect, subscribe, disconnect).
   */
  public ws = {
    /**
     * Connects to WebSocket server.
     */
    connect: (): void => {
      this.wsClient.connect();
    },

    /**
     * Disconnects from WebSocket server.
     */
    disconnect: (): void => {
      this.wsClient.disconnect();
    },

    /**
     * Subscribes to an event type.
     */
    subscribe: <T = any>(eventType: EventType, handler: EventHandler<T>): void => {
      this.wsClient.subscribe(eventType, handler);
    },

    /**
     * Unsubscribes from an event type.
     */
    unsubscribe: <T = any>(eventType: EventType, handler: EventHandler<T>): void => {
      this.wsClient.unsubscribe(eventType, handler);
    },

    /**
     * Checks if WebSocket is connected.
     */
    isConnected: (): boolean => {
      return this.wsClient.isConnected();
    },
  };
}
