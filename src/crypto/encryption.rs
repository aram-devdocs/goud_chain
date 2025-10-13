use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};

use crate::constants::{AES_KEY_SIZE_BYTES, NONCE_SIZE_BYTES};
use crate::types::{GoudChainError, Result};

/// Encrypt data using AES-256-GCM with a derived key from API key
pub fn encrypt_data_with_key(
    data: &str,
    encryption_key: &[u8; AES_KEY_SIZE_BYTES],
) -> Result<(String, String)> {
    // Generate random nonce
    let nonce_bytes: [u8; NONCE_SIZE_BYTES] = rand::random();
    encrypt_data_with_nonce(data, encryption_key, &nonce_bytes)
}

/// Encrypt data using AES-256-GCM with a provided nonce
/// This is used for deterministic genesis block encryption
pub fn encrypt_data_with_nonce(
    data: &str,
    encryption_key: &[u8; AES_KEY_SIZE_BYTES],
    nonce_bytes: &[u8; NONCE_SIZE_BYTES],
) -> Result<(String, String)> {
    let cipher = Aes256Gcm::new(encryption_key.into());
    let nonce = Nonce::from_slice(nonce_bytes);

    // Encrypt
    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| GoudChainError::EncryptionFailed(e.to_string()))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    let encrypted_payload = general_purpose::STANDARD.encode(combined);

    // Return both encrypted payload and nonce separately for storage
    let nonce_hex = hex::encode(nonce_bytes);
    Ok((encrypted_payload, nonce_hex))
}

/// Decrypt data using AES-256-GCM with a derived key from API key
pub fn decrypt_data_with_key(
    encrypted_payload: &str,
    encryption_key: &[u8; AES_KEY_SIZE_BYTES],
) -> Result<String> {
    let cipher = Aes256Gcm::new(encryption_key.into());

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
        let key = [42u8; AES_KEY_SIZE_BYTES];

        let (encrypted, _nonce) = encrypt_data_with_key(data, &key).unwrap();
        let decrypted = decrypt_data_with_key(&encrypted, &key).unwrap();

        assert_eq!(data, decrypted);
    }

    #[test]
    fn test_wrong_key() {
        let data = "Hello, World!";
        let key = [42u8; AES_KEY_SIZE_BYTES];
        let wrong_key = [99u8; AES_KEY_SIZE_BYTES];

        let (encrypted, _nonce) = encrypt_data_with_key(data, &key).unwrap();
        let result = decrypt_data_with_key(&encrypted, &wrong_key);

        assert!(result.is_err());
    }
}
