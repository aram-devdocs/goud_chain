use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::types::Result;

type HmacSha256 = Hmac<Sha256>;

/// Generate a blind index for searchable encryption with per-user and per-block salts
///
/// Blind indexes allow searching for data without exposing the search key.
/// They are deterministic (same input = same output) but cryptographically
/// one-way (cannot reverse to get the original value).
///
/// # Security Properties (Phase 5 P5-001)
/// - Deterministic: Same api_key_hash + context + user_salt + block_salt always produces same index
/// - One-way: Cannot recover api_key_hash from blind index
/// - Unlinkable: Different user_salts prevent cross-block correlation (attacker cannot track their own data)
/// - Searchable: Holder of api_key_hash can generate matching index if they know both salts
///
/// # Phase 5 Privacy Enhancement
/// - **user_salt**: Random per-collection salt (prevents attacker from correlating their data across blocks)
/// - **block_salt**: Random per-block salt (additional entropy layer)
/// - Combined salt = user_salt || block_salt ensures maximum privacy
pub fn generate_blind_index_with_salt(
    api_key_hash: &str,
    context: &str,
    user_salt: &str,
    block_salt: &str,
) -> Result<String> {
    // Phase 5: Combine user_salt and block_salt for maximum privacy
    let combined_salt = format!("{}{}", user_salt, block_salt);

    let mut mac = HmacSha256::new_from_slice(combined_salt.as_bytes())
        .map_err(|e| crate::types::GoudChainError::Internal(format!("HMAC init failed: {}", e)))?;

    // Include both api_key_hash and context for domain separation
    mac.update(api_key_hash.as_bytes());
    mac.update(b"|");
    mac.update(context.as_bytes());

    let result = mac.finalize();
    Ok(hex::encode(result.into_bytes()))
}

/// Generate a blind index for an account lookup with per-block salt
/// Note: Accounts don't have per-user salts (only collections do in Phase 5)
/// Use empty string for user_salt to maintain backward compatibility
pub fn generate_account_blind_index_with_salt(
    api_key_hash: &str,
    block_salt: &str,
) -> Result<String> {
    generate_blind_index_with_salt(api_key_hash, "account_lookup", "", block_salt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blind_index_deterministic_with_salt() {
        let api_key_hash = "test_hash_123";
        let context = "test_context";
        let user_salt = "user_salt";
        let block_salt = "block_salt";

        let index1 =
            generate_blind_index_with_salt(api_key_hash, context, user_salt, block_salt).unwrap();
        let index2 =
            generate_blind_index_with_salt(api_key_hash, context, user_salt, block_salt).unwrap();

        assert_eq!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_salts() {
        let api_key_hash = "test_hash_123";
        let context = "test_context";

        let index1 =
            generate_blind_index_with_salt(api_key_hash, context, "user1", "block1").unwrap();
        let index2 =
            generate_blind_index_with_salt(api_key_hash, context, "user2", "block2").unwrap();

        // Different salts should produce different indexes (prevents correlation)
        assert_ne!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_contexts() {
        let api_key_hash = "test_hash_123";
        let user_salt = "same_user_salt";
        let block_salt = "same_block_salt";

        let index1 =
            generate_blind_index_with_salt(api_key_hash, "context1", user_salt, block_salt)
                .unwrap();
        let index2 =
            generate_blind_index_with_salt(api_key_hash, "context2", user_salt, block_salt)
                .unwrap();

        assert_ne!(index1, index2);
    }

    #[test]
    fn test_blind_index_different_keys() {
        let context = "same_context";
        let user_salt = "same_user_salt";
        let block_salt = "same_block_salt";

        let index1 =
            generate_blind_index_with_salt("key1", context, user_salt, block_salt).unwrap();
        let index2 =
            generate_blind_index_with_salt("key2", context, user_salt, block_salt).unwrap();

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
        let user_salt = "same_user_salt";
        let block_salt = "same_block_salt";
        let index1 =
            generate_blind_index_with_salt("key0001", "context", user_salt, block_salt).unwrap();
        let index2 =
            generate_blind_index_with_salt("key0002", "context", user_salt, block_salt).unwrap();

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

    #[test]
    fn test_phase5_per_user_salt_prevents_correlation() {
        // Phase 5 P5-001: Verify that per-user salts prevent cross-block correlation
        // Even with the same API key and block salt, different user_salts produce different indexes
        let api_key_hash = "attacker_key_hash";
        let context = "collection_lookup";
        let block_salt = "same_block_salt";

        // Same API key, same block, but different collections (different user_salts)
        let index_collection1 = generate_blind_index_with_salt(
            api_key_hash,
            context,
            "user_salt_collection1",
            block_salt,
        )
        .unwrap();
        let index_collection2 = generate_blind_index_with_salt(
            api_key_hash,
            context,
            "user_salt_collection2",
            block_salt,
        )
        .unwrap();

        // Attacker cannot correlate their data across blocks
        assert_ne!(
            index_collection1, index_collection2,
            "Different user salts should produce different blind indexes (prevents correlation)"
        );

        // Same user_salt across different blocks produces different indexes (block salt changes)
        let index_block1 =
            generate_blind_index_with_salt(api_key_hash, context, "same_user_salt", "block1_salt")
                .unwrap();
        let index_block2 =
            generate_blind_index_with_salt(api_key_hash, context, "same_user_salt", "block2_salt")
                .unwrap();

        assert_ne!(
            index_block1, index_block2,
            "Different block salts should produce different blind indexes"
        );
    }
}
