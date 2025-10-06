use aes_gcm::aead::generic_array::GenericArray;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use sha2::{Digest, Sha256};

use crate::constants::{AES_KEY_SIZE_BYTES, ENCRYPTION_SALT, NONCE_SIZE_BYTES};
use crate::types::{GoudChainError, Result};

/// Derive a 32-byte AES key from a PIN using SHA-256 with salt
pub fn derive_key_from_pin(pin: &str) -> [u8; AES_KEY_SIZE_BYTES] {
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    hasher.update(ENCRYPTION_SALT);
    let result = hasher.finalize();

    let mut key = [0u8; AES_KEY_SIZE_BYTES];
    key.copy_from_slice(&result);
    key
}

/// Hash a PIN for verification without decrypting
pub fn hash_pin(pin: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Encrypt data using AES-256-GCM with a PIN-derived key
pub fn encrypt_data(data: &str, pin: &str) -> Result<String> {
    let key_bytes = derive_key_from_pin(pin);
    let key = GenericArray::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Generate random nonce
    let nonce_bytes: [u8; NONCE_SIZE_BYTES] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt
    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| GoudChainError::EncryptionFailed(e.to_string()))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(general_purpose::STANDARD.encode(combined))
}

/// Decrypt data using AES-256-GCM with a PIN-derived key
/// Returns None if PIN is incorrect or data is corrupted
pub fn decrypt_data(encrypted_payload: &str, pin: &str, encryption_hint: &str) -> Result<String> {
    // Verify PIN hash first
    if hash_pin(pin) != encryption_hint {
        return Err(GoudChainError::DecryptionFailed);
    }

    let key_bytes = derive_key_from_pin(pin);
    let key = GenericArray::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Decode base64
    let combined = general_purpose::STANDARD
        .decode(encrypted_payload)
        .map_err(GoudChainError::Base64DecodingError)?;

    if combined.len() < NONCE_SIZE_BYTES {
        return Err(GoudChainError::DecryptionFailed);
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE_BYTES);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| GoudChainError::DecryptionFailed)?;

    String::from_utf8(plaintext).map_err(GoudChainError::Utf8Error)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let data = "Hello, World!";
        let pin = "1234";

        let encrypted = encrypt_data(data, pin).unwrap();
        let hint = hash_pin(pin);
        let decrypted = decrypt_data(&encrypted, pin, &hint).unwrap();

        assert_eq!(data, decrypted);
    }

    #[test]
    fn test_wrong_pin() {
        let data = "Hello, World!";
        let pin = "1234";
        let wrong_pin = "5678";

        let encrypted = encrypt_data(data, pin).unwrap();
        let hint = hash_pin(pin);
        let result = decrypt_data(&encrypted, wrong_pin, &hint);

        assert!(result.is_err());
    }
}
