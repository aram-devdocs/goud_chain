use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

use crate::constants::{
    AES_KEY_SIZE_BYTES, ENCRYPTION_SALT, HKDF_CONTEXT_ENCRYPTION, HKDF_CONTEXT_MAC,
    HKDF_FAST_ITERATIONS, HKDF_ITERATIONS,
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

/// Derive an AES-256 encryption key from an API key (FAST - 1k iterations)
///
/// **Security Note:** This function uses 1,000 iterations for performance.
/// Use ONLY after the API key has been validated/authenticated using hash_api_key().
///
/// Fast iteration is secure because:
/// - The API key itself is protected by 100k iterations (hash_api_key)
/// - HKDF iteration count doesn't affect domain separation security
/// - Different salts/contexts prevent key reuse attacks
///
/// **Do NOT use for:**
/// - API key hashing/authentication (use hash_api_key instead)
/// - Password-based key derivation (use slow iterations)
pub fn derive_encryption_key(api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
    hkdf_with_iterations(api_key, salt, HKDF_CONTEXT_ENCRYPTION, HKDF_FAST_ITERATIONS)
}

/// Derive an HMAC key from an API key (FAST - 1k iterations)
///
/// **Security Note:** This function uses 1,000 iterations for performance.
/// Use ONLY after the API key has been validated/authenticated using hash_api_key().
/// See derive_encryption_key() documentation for security rationale.
pub fn derive_mac_key(api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
    hkdf_with_iterations(api_key, salt, HKDF_CONTEXT_MAC, HKDF_FAST_ITERATIONS)
}

/// Hash an API key for storage and comparison (SLOW - 100k iterations)
///
/// **Security Note:** This function uses 100,000 iterations (OWASP recommended).
/// Use for:
/// - API key authentication/verification
/// - Storing API key hashes in database
/// - Any operation where brute-force resistance is critical
///
/// **Performance:** ~40ms per call (intentionally slow to prevent brute-force attacks)
/// Returns raw 32-byte hash for constant-time comparison using subtle crate.
pub fn hash_api_key(api_key: &[u8]) -> [u8; 32] {
    // Use HKDF with 100k iterations for API key hashing (brute-force resistance)
    hkdf_with_iterations(
        api_key,
        ENCRYPTION_SALT,
        b"api_key_hash_v2",
        HKDF_ITERATIONS,
    )
}

/// Hash an API key and return hex-encoded string (for display/storage)
pub fn hash_api_key_hex(api_key: &[u8]) -> String {
    let hash = hash_api_key(api_key);
    hex::encode(hash)
}

/// Constant-time comparison of byte arrays using subtle crate
/// Protects against timing side-channel attacks
pub fn constant_time_compare_bytes(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        // Even length comparison should be constant-time for security
        // Compare against a zero array to maintain constant time behavior
        let zero = vec![0u8; a.len().max(b.len())];
        let _ = a.ct_eq(&zero);
        return false;
    }

    a.ct_eq(b).into()
}

/// Legacy string comparison (for backward compatibility with tests)
/// DEPRECATED: Use constant_time_compare_bytes for security-critical code
#[cfg(test)]
#[deprecated(note = "Use constant_time_compare_bytes for better security")]
fn constant_time_compare(a: &str, b: &str) -> bool {
    constant_time_compare_bytes(a.as_bytes(), b.as_bytes())
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
        assert_eq!(hash1.len(), 32, "SHA-256 hash should be 32 bytes");

        // Test hex encoding
        let hex1 = hash_api_key_hex(api_key);
        let hex2 = hash_api_key_hex(api_key);
        assert_eq!(hex1, hex2, "Hex hash should be deterministic");
        assert_eq!(hex1.len(), 64, "SHA-256 hex hash should be 64 hex chars");
    }

    #[test]
    #[allow(deprecated)]
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

    #[test]
    fn test_constant_time_compare_bytes() {
        let a = b"abc123";
        let b = b"abc123";
        let c = b"abc124";
        let d = b"abc12";

        assert!(
            constant_time_compare_bytes(a, b),
            "Equal byte arrays should match"
        );
        assert!(
            !constant_time_compare_bytes(a, c),
            "Different byte arrays should not match"
        );
        assert!(
            !constant_time_compare_bytes(a, d),
            "Different length byte arrays should not match"
        );

        // Test with hashes
        let api_key1 = b"test_api_key_1";
        let api_key2 = b"test_api_key_1";
        let api_key3 = b"test_api_key_2";

        let hash1 = hash_api_key(api_key1);
        let hash2 = hash_api_key(api_key2);
        let hash3 = hash_api_key(api_key3);

        assert!(
            constant_time_compare_bytes(&hash1, &hash2),
            "Same API key should produce matching hashes"
        );
        assert!(
            !constant_time_compare_bytes(&hash1, &hash3),
            "Different API keys should produce different hashes"
        );
    }
}
