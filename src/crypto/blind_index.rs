use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::types::Result;

type HmacSha256 = Hmac<Sha256>;

/// Generate a blind index for searchable encryption with per-block salt
///
/// Blind indexes allow searching for data without exposing the search key.
/// They are deterministic (same input = same output) but cryptographically
/// one-way (cannot reverse to get the original value).
///
/// # Security Properties
/// - Deterministic: Same api_key_hash + context + salt always produces same index
/// - One-way: Cannot recover api_key_hash from blind index
/// - Unlinkable: Different salts produce uncorrelated indexes (prevents cross-block correlation)
/// - Searchable: Holder of api_key_hash can generate matching index if they know the salt
pub fn generate_blind_index_with_salt(
    api_key_hash: &str,
    context: &str,
    block_salt: &str,
) -> Result<String> {
    let mut mac = HmacSha256::new_from_slice(block_salt.as_bytes())
        .map_err(|e| crate::types::GoudChainError::Internal(format!("HMAC init failed: {}", e)))?;

    // Include both api_key_hash and context for domain separation
    mac.update(api_key_hash.as_bytes());
    mac.update(b"|");
    mac.update(context.as_bytes());

    let result = mac.finalize();
    Ok(hex::encode(result.into_bytes()))
}

/// Generate a blind index for an account lookup with per-block salt
pub fn generate_account_blind_index_with_salt(
    api_key_hash: &str,
    block_salt: &str,
) -> Result<String> {
    generate_blind_index_with_salt(api_key_hash, "account_lookup", block_salt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blind_index_deterministic_with_salt() {
        let api_key_hash = "test_hash_123";
        let context = "test_context";
        let salt = "block_salt";

        let index1 = generate_blind_index_with_salt(api_key_hash, context, salt).unwrap();
        let index2 = generate_blind_index_with_salt(api_key_hash, context, salt).unwrap();

        assert_eq!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_salts() {
        let api_key_hash = "test_hash_123";
        let context = "test_context";

        let index1 = generate_blind_index_with_salt(api_key_hash, context, "salt1").unwrap();
        let index2 = generate_blind_index_with_salt(api_key_hash, context, "salt2").unwrap();

        // Different salts should produce different indexes (prevents correlation)
        assert_ne!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_contexts() {
        let api_key_hash = "test_hash_123";
        let salt = "same_salt";

        let index1 = generate_blind_index_with_salt(api_key_hash, "context1", salt).unwrap();
        let index2 = generate_blind_index_with_salt(api_key_hash, "context2", salt).unwrap();

        assert_ne!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_keys() {
        let context = "same_context";
        let salt = "same_salt";

        let index1 = generate_blind_index_with_salt("key1", context, salt).unwrap();
        let index2 = generate_blind_index_with_salt("key2", context, salt).unwrap();

        assert_ne!(index1, index2);
    }

    #[test]
    fn test_account_blind_index_with_salt() {
        let api_key_hash = "9d7f01431adda48703609d5fca11eb3b121a8325dfd056d94e43e2577ec57c3a";
        let block_salt = "random_block_salt";
        let index = generate_account_blind_index_with_salt(api_key_hash, block_salt).unwrap();

        assert!(!index.is_empty());
        assert_eq!(index.len(), 64); // SHA256 output in hex
    }

    #[test]
    fn test_blind_index_looks_random() {
        // Verify that sequential inputs don't produce sequential outputs
        let salt = "same_salt";
        let index1 = generate_blind_index_with_salt("key0001", "context", salt).unwrap();
        let index2 = generate_blind_index_with_salt("key0002", "context", salt).unwrap();

        // Convert hex to bytes for comparison
        let bytes1 = hex::decode(&index1).unwrap();
        let bytes2 = hex::decode(&index2).unwrap();

        // Hamming distance should be roughly 50% for a good hash
        let mut diff_bits = 0;
        for (b1, b2) in bytes1.iter().zip(bytes2.iter()) {
            diff_bits += (b1 ^ b2).count_ones();
        }

        // With 256 bits, expect ~128 bits to differ (avalanche effect)
        assert!(
            diff_bits > 64 && diff_bits < 192,
            "Expected ~128 bit difference, got {}",
            diff_bits
        );
    }
}
