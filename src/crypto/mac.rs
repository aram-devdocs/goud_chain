use sha2::{Digest, Sha256};

use crate::types::{GoudChainError, Result};

/// HMAC-SHA256 implementation for message authentication
pub fn hmac_sha256(key: &[u8], message: &[u8]) -> Vec<u8> {
    const BLOCK_SIZE: usize = 64; // SHA-256 block size
    const IPAD: u8 = 0x36;
    const OPAD: u8 = 0x5c;

    // If key is longer than block size, hash it first
    let key = if key.len() > BLOCK_SIZE {
        let mut hasher = Sha256::new();
        hasher.update(key);
        hasher.finalize().to_vec()
    } else {
        key.to_vec()
    };

    // Pad key to block size
    let mut padded_key = key.clone();
    padded_key.resize(BLOCK_SIZE, 0);

    // Inner padding
    let mut inner_pad = vec![0u8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        inner_pad[i] = padded_key[i] ^ IPAD;
    }

    // Outer padding
    let mut outer_pad = vec![0u8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        outer_pad[i] = padded_key[i] ^ OPAD;
    }

    // Inner hash: H(K ⊕ ipad || message)
    let mut inner_hasher = Sha256::new();
    inner_hasher.update(&inner_pad);
    inner_hasher.update(message);
    let inner_hash = inner_hasher.finalize();

    // Outer hash: H(K ⊕ opad || inner_hash)
    let mut outer_hasher = Sha256::new();
    outer_hasher.update(&outer_pad);
    outer_hasher.update(inner_hash);

    outer_hasher.finalize().to_vec()
}

/// Compute HMAC for a message and return hex-encoded string
pub fn compute_mac(key: &[u8], message: &[u8]) -> String {
    let mac = hmac_sha256(key, message);
    hex::encode(mac)
}

/// Verify HMAC with constant-time comparison
pub fn verify_mac(key: &[u8], message: &[u8], expected_mac: &str) -> Result<()> {
    let computed_mac = compute_mac(key, message);

    // Use constant-time comparison to prevent timing attacks
    if !crate::crypto::hkdf::constant_time_compare(&computed_mac, expected_mac) {
        return Err(GoudChainError::InvalidSignature);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hmac_deterministic() {
        let key = b"secret_key";
        let message = b"Hello, World!";

        let mac1 = compute_mac(key, message);
        let mac2 = compute_mac(key, message);

        assert_eq!(mac1, mac2, "HMAC should be deterministic");
    }

    #[test]
    fn test_hmac_different_keys() {
        let key1 = b"secret_key_1";
        let key2 = b"secret_key_2";
        let message = b"Hello, World!";

        let mac1 = compute_mac(key1, message);
        let mac2 = compute_mac(key2, message);

        assert_ne!(mac1, mac2, "Different keys should produce different MACs");
    }

    #[test]
    fn test_hmac_different_messages() {
        let key = b"secret_key";
        let message1 = b"Hello, World!";
        let message2 = b"Hello, World?";

        let mac1 = compute_mac(key, message1);
        let mac2 = compute_mac(key, message2);

        assert_ne!(mac1, mac2, "Different messages should produce different MACs");
    }

    #[test]
    fn test_verify_mac_valid() {
        let key = b"secret_key";
        let message = b"Hello, World!";

        let mac = compute_mac(key, message);
        let result = verify_mac(key, message, &mac);

        assert!(result.is_ok(), "Valid MAC should verify successfully");
    }

    #[test]
    fn test_verify_mac_invalid() {
        let key = b"secret_key";
        let message = b"Hello, World!";
        let wrong_mac = "0000000000000000000000000000000000000000000000000000000000000000";

        let result = verify_mac(key, message, wrong_mac);

        assert!(result.is_err(), "Invalid MAC should fail verification");
    }

    #[test]
    fn test_hmac_long_key() {
        // Test with key longer than block size (64 bytes)
        let long_key = b"this_is_a_very_long_key_that_exceeds_the_sha256_block_size_of_64_bytes_for_testing";
        let message = b"Test message";

        let mac = compute_mac(long_key, message);

        assert_eq!(mac.len(), 64, "HMAC should be 64 hex characters (32 bytes)");
    }
}
