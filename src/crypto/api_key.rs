use base64::{engine::general_purpose, Engine as _};

use crate::constants::API_KEY_SIZE_BYTES;

/// Generate a cryptographically secure random API key (256-bit)
pub fn generate_api_key() -> Vec<u8> {
    let key_bytes: [u8; API_KEY_SIZE_BYTES] = rand::random();
    key_bytes.to_vec()
}

/// Encode API key as base64 for display to users
pub fn encode_api_key(api_key: &[u8]) -> String {
    general_purpose::STANDARD.encode(api_key)
}

/// Decode base64-encoded API key
pub fn decode_api_key(api_key_str: &str) -> Result<Vec<u8>, base64::DecodeError> {
    general_purpose::STANDARD.decode(api_key_str)
}

/// Validate API key format (must be 256-bit / 32 bytes)
pub fn validate_api_key(api_key: &[u8]) -> bool {
    api_key.len() == API_KEY_SIZE_BYTES
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_api_key() {
        let key1 = generate_api_key();
        let key2 = generate_api_key();

        assert_eq!(key1.len(), API_KEY_SIZE_BYTES);
        assert_eq!(key2.len(), API_KEY_SIZE_BYTES);
        assert_ne!(key1, key2, "Generated keys should be unique");
    }

    #[test]
    fn test_encode_decode_api_key() {
        let key = generate_api_key();
        let encoded = encode_api_key(&key);
        let decoded = decode_api_key(&encoded).unwrap();

        assert_eq!(key, decoded, "Encode/decode should be bijective");
    }

    #[test]
    fn test_validate_api_key() {
        let valid_key = generate_api_key();
        assert!(validate_api_key(&valid_key));

        let invalid_key = vec![0u8; 16]; // Only 128 bits
        assert!(!validate_api_key(&invalid_key));

        let invalid_key_too_long = vec![0u8; 64]; // 512 bits
        assert!(!validate_api_key(&invalid_key_too_long));
    }

    #[test]
    fn test_base64_encoding_length() {
        let key = generate_api_key();
        let encoded = encode_api_key(&key);

        // Base64 encoding of 32 bytes should be 44 characters (with padding)
        assert_eq!(encoded.len(), 44);
    }
}
