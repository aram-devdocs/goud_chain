/**
 * Custom error types for SDK operations.
 */

export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SDKError';
  }
}

export class AuthenticationError extends SDKError {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class EncryptionError extends SDKError {
  constructor(message: string = 'Encryption/decryption failed') {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class NetworkError extends SDKError {
  constructor(
    message: string = 'Network request failed',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends SDKError {
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}
