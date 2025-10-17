export async function encryptData(
  data: string,
  apiKey: string
): Promise<string> {
  const encoder = new TextEncoder()
  
  // Generate random salt per encryption (32 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(32))
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

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
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  // Format: salt (32 bytes) + iv (12 bytes) + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptData(
  encryptedData: string,
  apiKey: string
): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
  
  // Extract salt (32 bytes), iv (12 bytes), and ciphertext
  const salt = combined.slice(0, 32)
  const iv = combined.slice(32, 44)
  const encrypted = combined.slice(44)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

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
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )

  return decoder.decode(decrypted)
}
