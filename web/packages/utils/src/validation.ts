export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false
  return /^[a-f0-9]{64}$/i.test(apiKey.trim())
}

export function isValidCollectionId(collectionId: string): boolean {
  if (!collectionId || typeof collectionId !== 'string') return false
  const trimmed = collectionId.trim()
  return trimmed.length > 0 && trimmed.length <= 255
}

export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username.trim())
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.trim().replace(/[<>]/g, '')
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' }
  }
  const trimmed = username.trim()
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }
  if (trimmed.length > 32) {
    return { valid: false, error: 'Username must be 32 characters or less' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error:
        'Username can only contain letters, numbers, hyphens, and underscores',
    }
  }
  return { valid: true }
}

export function validateApiKey(apiKey: string): ValidationResult {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' }
  }
  const trimmed = apiKey.trim()
  if (trimmed.length !== 64) {
    return { valid: false, error: 'API key must be exactly 64 characters' }
  }
  if (!/^[a-f0-9]{64}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'API key must be a valid hexadecimal string',
    }
  }
  return { valid: true }
}
