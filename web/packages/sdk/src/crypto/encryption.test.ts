/**
 * Encryption module unit tests
 */

import { describe, expect, test } from 'vitest'
import { encryptData, decryptData, isValidApiKey } from './encryption'

describe('encryptData and decryptData', () => {
  const apiKey = 'dGVzdF9hcGlfa2V5X2Jhc2U2NA==' // test_api_key_base64
  const plaintext = 'Hello, World!'

  test('encrypt and decrypt roundtrip', async () => {
    const encrypted = await encryptData(plaintext, apiKey)
    const decrypted = await decryptData(encrypted, apiKey)

    expect(decrypted).toBe(plaintext)
  })

  test('encrypted output is different each time (random IV/salt)', async () => {
    const encrypted1 = await encryptData(plaintext, apiKey)
    const encrypted2 = await encryptData(plaintext, apiKey)

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
  })

  test('decryption with wrong key fails', async () => {
    const encrypted = await encryptData(plaintext, apiKey)
    const wrongKey = 'ZGlmZmVyZW50X2tleQ==' // different_key

    await expect(decryptData(encrypted, wrongKey)).rejects.toThrow(
      'Decryption failed'
    )
  })

  test('tampered ciphertext is rejected', async () => {
    const encrypted = await encryptData(plaintext, apiKey)

    // Tamper with last character
    const tampered = {
      ciphertext: encrypted.ciphertext.slice(0, -1) + 'X',
    }

    await expect(decryptData(tampered, apiKey)).rejects.toThrow()
  })

  test('can decrypt from string directly', async () => {
    const encrypted = await encryptData(plaintext, apiKey)
    const decrypted = await decryptData(encrypted.ciphertext, apiKey)

    expect(decrypted).toBe(plaintext)
  })

  test('handles empty string', async () => {
    const encrypted = await encryptData('', apiKey)
    const decrypted = await decryptData(encrypted, apiKey)

    expect(decrypted).toBe('')
  })

  test('handles large data', async () => {
    const largeData = 'x'.repeat(10000)
    const encrypted = await encryptData(largeData, apiKey)
    const decrypted = await decryptData(encrypted, apiKey)

    expect(decrypted).toBe(largeData)
  })

  test('handles unicode characters', async () => {
    const unicode = '🔒 Encrypted Data 中文 العربية'
    const encrypted = await encryptData(unicode, apiKey)
    const decrypted = await decryptData(encrypted, apiKey)

    expect(decrypted).toBe(unicode)
  })
})

describe('isValidApiKey', () => {
  test('accepts valid base64 string', () => {
    expect(isValidApiKey('dGVzdA==')).toBe(true)
    expect(isValidApiKey('YWJjZDEyMzQ=')).toBe(true)
  })

  test('rejects invalid base64 string', () => {
    expect(isValidApiKey('not-base64!')).toBe(false)
    expect(isValidApiKey('invalid@#$')).toBe(false)
  })

  test('rejects empty string', () => {
    expect(isValidApiKey('')).toBe(false)
  })

  test('rejects null and undefined', () => {
    expect(isValidApiKey(null as any)).toBe(false)
    expect(isValidApiKey(undefined as any)).toBe(false)
  })

  test('rejects non-string types', () => {
    expect(isValidApiKey(123 as any)).toBe(false)
    expect(isValidApiKey({} as any)).toBe(false)
    expect(isValidApiKey([] as any)).toBe(false)
  })
})
