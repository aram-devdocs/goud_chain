/**
 * Client-side encryption/decryption using AES-256-GCM with PBKDF2 key derivation.
 * 
 * Security features:
 * - AES-256-GCM authenticated encryption (confidentiality + integrity)
 * - PBKDF2 key derivation with 100,000 iterations
 * - Random salt per encryption (32 bytes)
 * - Random IV per encryption (12 bytes for GCM)
 * - Format: base64(salt + iv + ciphertext + auth_tag)
 */

export interface EncryptedPayload {
  /** Base64-encoded encrypted data (salt + iv + ciphertext) */
  ciphertext: string;
}

/**
 * Encrypts plaintext data using AES-256-GCM with the provided API key.
 * 
 * @param data - Plaintext string to encrypt
 * @param apiKey - Base64-encoded API key for encryption
 * @returns Encrypted payload with base64-encoded ciphertext
 * @throws Error if encryption fails or API key is invalid
 */
export async function encryptData(
  data: string,
  apiKey: string
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();

  // Generate random salt per encryption (32 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(32));

  // Derive encryption key from API key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt data with AES-GCM (includes authentication tag)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine salt + iv + ciphertext into single payload
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength
  );
  combined.set(salt);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return base64-encoded payload
  return {
    ciphertext: btoa(String.fromCharCode(...combined)),
  };
}

/**
 * Decrypts encrypted data using AES-256-GCM with the provided API key.
 * 
 * @param encryptedPayload - Encrypted payload from encryptData()
 * @param apiKey - Base64-encoded API key for decryption
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export async function decryptData(
  encryptedPayload: EncryptedPayload | string,
  apiKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Handle both EncryptedPayload object and raw string
  const encryptedData = 
    typeof encryptedPayload === 'string' 
      ? encryptedPayload 
      : encryptedPayload.ciphertext;

  // Decode base64 payload
  const combined = Uint8Array.from(atob(encryptedData), (c) =>
    c.charCodeAt(0)
  );

  // Extract salt (32 bytes), iv (12 bytes), and ciphertext
  const salt = combined.slice(0, 32);
  const iv = combined.slice(32, 44);
  const encrypted = combined.slice(44);

  // Derive decryption key from API key using same parameters as encryption
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  try {
    // Decrypt data with AES-GCM (verifies authentication tag)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error(
      'Decryption failed: Invalid API key or tampered ciphertext'
    );
  }
}

/**
 * Validates that an API key is properly formatted (base64-encoded).
 * 
 * @param apiKey - API key to validate
 * @returns true if valid, false otherwise
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Check base64 format
  try {
    const decoded = atob(apiKey);
    return decoded.length > 0;
  } catch {
    return false;
  }
}
