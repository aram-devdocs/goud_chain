export function isValidApiKey(apiKey: string): boolean {
  return /^[a-f0-9]{64}$/i.test(apiKey)
}

export function isValidCollectionId(collectionId: string): boolean {
  return collectionId.length > 0 && collectionId.length <= 255
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
