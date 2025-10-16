use crate::crypto::{constant_time_compare_bytes, hash_api_key};

/// Perform dummy API key hash computation to maintain constant timing
///
/// Used when account doesn't exist to prevent timing attacks that distinguish
/// "account not found" from "wrong API key" by measuring hash computation time.
pub fn dummy_hash_for_timing(api_key: &[u8]) -> [u8; 32] {
    hash_api_key(api_key)
}

/// Perform dummy constant-time comparison to maintain timing consistency
///
/// Used when account doesn't exist to ensure same timing as real comparison.
/// Always returns false but takes same time as real constant_time_compare.
pub fn dummy_constant_time_compare() -> bool {
    // Compare two fixed values (always returns false, but takes constant time)
    let dummy1 = [0u8; 32];
    let dummy2 = [1u8; 32];
    constant_time_compare_bytes(&dummy1, &dummy2)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_dummy_hash_produces_valid_output() {
        let api_key = b"test_api_key_32_bytes_exactly_ok";
        let hash = dummy_hash_for_timing(api_key);
        assert_eq!(hash.len(), 32);
    }

    #[test]
    fn test_dummy_compare_always_false() {
        assert!(!dummy_constant_time_compare());
    }

    #[test]
    fn test_dummy_operations_take_time() {
        let api_key = b"test_api_key_32_bytes_exactly_ok";

        // Dummy hash should take ~same time as real hash (100k iterations)
        let start = Instant::now();
        let _hash = dummy_hash_for_timing(api_key);
        let duration = start.elapsed();

        // Should take at least 50ms (100k HKDF iterations)
        assert!(
            duration.as_millis() > 50,
            "Dummy hash too fast: {:?}",
            duration
        );
    }
}
