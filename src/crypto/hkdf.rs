use sha2::{Digest, Sha256};

use crate::constants::{
    AES_KEY_SIZE_BYTES, HKDF_CONTEXT_ENCRYPTION, HKDF_CONTEXT_MAC, HKDF_ITERATIONS,
};

/// HKDF-Extract: Extract a pseudorandom key from input keying material
fn hkdf_extract(salt: &[u8], ikm: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(salt);
    hasher.update(ikm);
    let result = hasher.finalize();

    let mut output = [0u8; 32];
    output.copy_from_slice(&result);
    output
}

/// HKDF-Expand: Expand a pseudorandom key to desired length with context
fn hkdf_expand(prk: &[u8; 32], info: &[u8], length: usize) -> Vec<u8> {
    let mut output = Vec::new();
    let mut t = Vec::new();
    let mut counter: u8 = 1;

    while output.len() < length {
        let mut hasher = Sha256::new();
        hasher.update(&t);
        hasher.update(prk);
        hasher.update(info);
        hasher.update([counter]);

        let result = hasher.finalize();
        t = result.to_vec();
        output.extend_from_slice(&t);
        counter += 1;
    }

    output.truncate(length);
    output
}

/// HKDF key derivation with iterations for key stretching
/// This provides resistance against brute-force attacks
fn hkdf_with_iterations(ikm: &[u8], salt: &[u8], info: &[u8], iterations: u32) -> [u8; 32] {
    let mut key = ikm.to_vec();

    // Apply HKDF iterations for key stretching
    for _ in 0..iterations {
        let prk = hkdf_extract(salt, &key);
        key = hkdf_expand(&prk, info, 32);
    }

    let mut output = [0u8; 32];
    output.copy_from_slice(&key);
    output
}

/// Derive an AES-256 encryption key from an API key
pub fn derive_encryption_key(api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
    hkdf_with_iterations(api_key, salt, HKDF_CONTEXT_ENCRYPTION, HKDF_ITERATIONS)
}

/// Derive an HMAC key from an API key
pub fn derive_mac_key(api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
    hkdf_with_iterations(api_key, salt, HKDF_CONTEXT_MAC, HKDF_ITERATIONS)
}

/// Hash an API key for storage and comparison (SHA-256)
pub fn hash_api_key(api_key: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(api_key);
    format!("{:x}", hasher.finalize())
}

/// Constant-time comparison to prevent timing attacks
pub fn constant_time_compare(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }

    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();

    let mut result: u8 = 0;
    for i in 0..a_bytes.len() {
        result |= a_bytes[i] ^ b_bytes[i];
    }

    result == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hkdf_deterministic() {
        let api_key = b"test_api_key_12345678901234567890";
        let salt = b"test_salt";

        let key1 = derive_encryption_key(api_key, salt);
        let key2 = derive_encryption_key(api_key, salt);

        assert_eq!(key1, key2, "HKDF should be deterministic");
    }

    #[test]
    fn test_different_contexts_different_keys() {
        let api_key = b"test_api_key_12345678901234567890";
        let salt = b"test_salt";

        let enc_key = derive_encryption_key(api_key, salt);
        let mac_key = derive_mac_key(api_key, salt);

        assert_ne!(enc_key, mac_key, "Encryption and MAC keys should differ");
    }

    #[test]
    fn test_api_key_hash() {
        let api_key = b"test_api_key_12345678901234567890";
        let hash1 = hash_api_key(api_key);
        let hash2 = hash_api_key(api_key);

        assert_eq!(hash1, hash2, "API key hash should be deterministic");
        assert_eq!(hash1.len(), 64, "SHA-256 hash should be 64 hex chars");
    }

    #[test]
    fn test_constant_time_compare() {
        let a = "abc123";
        let b = "abc123";
        let c = "abc124";
        let d = "abc12";

        assert!(constant_time_compare(a, b), "Equal strings should match");
        assert!(
            !constant_time_compare(a, c),
            "Different strings should not match"
        );
        assert!(
            !constant_time_compare(a, d),
            "Different length strings should not match"
        );
    }
}
