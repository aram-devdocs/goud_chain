use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::config::Config;
use crate::constants::{NONCE_SIZE_BYTES, SESSION_EXPIRY_SECONDS};
use crate::crypto::{
    constant_time_compare_bytes, decode_api_key, derive_session_encryption_key, hash_api_key,
    validate_api_key,
};
use crate::types::{GoudChainError, Result};

/// Encrypt API key with session secret for storage in JWT
fn encrypt_api_key_for_jwt(api_key: &[u8], config: &Config) -> Result<String> {
    let session_secret = &config.session_secret;

    // Derive AES-256 key from session secret using HKDF (domain separation)
    let key_bytes = derive_session_encryption_key(session_secret);

    let cipher = Aes256Gcm::new(&key_bytes.into());

    // Generate random nonce
    let nonce_bytes: [u8; NONCE_SIZE_BYTES] = rand::random();
    let nonce = nonce_bytes.into();

    // Encrypt API key
    let ciphertext = cipher
        .encrypt(&nonce, api_key)
        .map_err(|e| GoudChainError::Internal(format!("Failed to encrypt API key: {}", e)))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(general_purpose::STANDARD.encode(combined))
}

/// Decrypt API key from JWT encrypted_api_key field
pub fn decrypt_api_key_from_jwt(encrypted_api_key: &str, config: &Config) -> Result<Vec<u8>> {
    let session_secret = &config.session_secret;

    // Derive AES-256 key from session secret using HKDF (domain separation)
    let key_bytes = derive_session_encryption_key(session_secret);

    let cipher = Aes256Gcm::new(&key_bytes.into());

    // Decode base64 - use generic error for all failures
    let combined = general_purpose::STANDARD
        .decode(encrypted_api_key)
        .map_err(|_| GoudChainError::AuthenticationFailed)?;

    if combined.len() < NONCE_SIZE_BYTES {
        return Err(GoudChainError::AuthenticationFailed);
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE_BYTES);
    let nonce_array: &[u8; NONCE_SIZE_BYTES] = nonce_bytes
        .try_into()
        .map_err(|_| GoudChainError::AuthenticationFailed)?;
    let nonce = (*nonce_array).into();

    // Decrypt - use generic error
    let plaintext = cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| GoudChainError::AuthenticationFailed)?;

    Ok(plaintext)
}

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,               // Subject (account_id)
    pub api_key_hash: String,      // API key hash for verification
    pub encrypted_api_key: String, // AES-GCM(api_key, SESSION_SECRET) - for server-side decryption
    pub exp: i64,                  // Expiration timestamp
    pub iat: i64,                  // Issued at timestamp
}

/// Generate a JWT session token from API key
pub fn generate_session_token(
    account_id: String,
    api_key: &[u8],
    api_key_hash: String,
    config: &Config,
) -> Result<String> {
    let now = Utc::now().timestamp();

    // Encrypt API key with SESSION_SECRET for inclusion in JWT
    let encrypted_api_key = encrypt_api_key_for_jwt(api_key, config)?;

    let claims = Claims {
        sub: account_id,
        api_key_hash,
        encrypted_api_key,
        exp: now + SESSION_EXPIRY_SECONDS,
        iat: now,
    };

    let jwt_secret = &config.jwt_secret;
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret),
    )
    .map_err(|e| GoudChainError::Internal(format!("JWT encoding failed: {}", e)))
}

/// Verify and decode a JWT session token
pub fn verify_session_token(token: &str, config: &Config) -> Result<Claims> {
    let validation = Validation::default();
    let jwt_secret = &config.jwt_secret;

    decode::<Claims>(token, &DecodingKey::from_secret(jwt_secret), &validation)
        .map(|data| data.claims)
        .map_err(|e| GoudChainError::Unauthorized(format!("Invalid token: {}", e)))
}

/// Extract API key or session token from Authorization header
pub enum AuthMethod {
    ApiKey(Vec<u8>),      // Raw API key bytes
    SessionToken(Claims), // Decoded JWT claims
}

// Deprecated: extract_auth() for tiny_http - no longer used with axum architecture
// Use extract_auth_from_headers() instead

/// Extract authentication from axum HeaderMap
pub fn extract_auth_from_headers(
    headers: &axum::http::HeaderMap,
    config: &Config,
) -> Result<AuthMethod> {
    // Get Authorization header
    let auth_header = headers
        .get("authorization")
        .ok_or_else(|| GoudChainError::Unauthorized("Missing Authorization header".to_string()))?;

    let auth_value = auth_header.to_str().map_err(|_| {
        GoudChainError::Unauthorized("Invalid Authorization header encoding".to_string())
    })?;

    // Check if it's a Bearer token
    if let Some(token) = auth_value.strip_prefix("Bearer ") {
        // Try to decode as JWT first
        if let Ok(claims) = verify_session_token(token, config) {
            return Ok(AuthMethod::SessionToken(claims));
        }

        // Otherwise, treat as base64-encoded API key
        let api_key = decode_api_key(token)
            .map_err(|_| GoudChainError::Unauthorized("Invalid API key format".to_string()))?;

        if !validate_api_key(&api_key) {
            return Err(GoudChainError::Unauthorized(
                "Invalid API key length".to_string(),
            ));
        }

        return Ok(AuthMethod::ApiKey(api_key));
    }

    Err(GoudChainError::Unauthorized(
        "Invalid Authorization header format. Expected: Bearer <token>".to_string(),
    ))
}

/// Verify API key hash with optional pre-computed hash (optimization)
pub fn verify_api_key_hash_precomputed(
    computed_hash_hex: Option<&str>,
    api_key: &[u8],
    expected_hash_hex: &str,
) -> Result<()> {
    // Use provided hash or compute it
    let computed_hash_hex = match computed_hash_hex {
        Some(hash) => hash.to_string(),
        None => {
            // Compute hash of provided API key (expensive: 100k iterations)
            let hash_bytes = hash_api_key(api_key);
            hex::encode(hash_bytes)
        }
    };

    // Decode both hashes to bytes
    let computed_hash = hex::decode(&computed_hash_hex)
        .map_err(|_| GoudChainError::Internal("Invalid computed hash format".to_string()))?;
    let expected_hash = hex::decode(expected_hash_hex)
        .map_err(|_| GoudChainError::Unauthorized("Invalid hash format".to_string()))?;

    // Constant-time comparison of raw bytes (prevents timing attacks)
    if !constant_time_compare_bytes(&computed_hash, &expected_hash) {
        return Err(GoudChainError::Unauthorized(
            "API key does not match".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn test_config() -> Config {
        let mut node_to_validator = HashMap::new();
        node_to_validator.insert("test-node".to_string(), "Validator_1".to_string());

        let mut validator_to_address = HashMap::new();
        validator_to_address.insert("Validator_1".to_string(), "localhost:8080".to_string());

        Config {
            node_id: "test-node".to_string(),
            http_port: "8080".to_string(),
            p2p_port: 9000,
            peers: vec![],
            jwt_secret: b"test_jwt_secret_min_32_bytes_long_123456".to_vec(),
            session_secret: b"test_session_secret_min_32_bytes_long".to_vec(),
            validator_config: crate::config::ValidatorConfig {
                validators: vec!["Validator_1".to_string()],
                node_to_validator,
                validator_to_address,
            },
        }
    }

    #[test]
    fn test_generate_verify_token() {
        let config = test_config();
        let account_id = "test-account".to_string();
        let api_key = b"test_api_key_12345678901234567890";
        let api_key_hash = "test-hash".to_string();

        let token =
            generate_session_token(account_id.clone(), api_key, api_key_hash.clone(), &config)
                .unwrap();

        let claims = verify_session_token(&token, &config).unwrap();
        assert_eq!(claims.sub, account_id);
        assert_eq!(claims.api_key_hash, api_key_hash);

        // Verify we can decrypt the API key from the token
        let decrypted_api_key =
            decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config).unwrap();
        assert_eq!(decrypted_api_key, api_key);
    }

    #[test]
    fn test_expired_token() {
        let config = test_config();
        let account_id = "test-account".to_string();
        let api_key = b"test_api_key_12345678901234567890";
        let api_key_hash = "test-hash".to_string();
        let encrypted_api_key = encrypt_api_key_for_jwt(api_key, &config).unwrap();

        // Create token that's already expired
        let claims = Claims {
            sub: account_id,
            api_key_hash,
            encrypted_api_key,
            exp: Utc::now().timestamp() - 3600, // Expired 1 hour ago
            iat: Utc::now().timestamp() - 7200,
        };

        let jwt_secret = &config.jwt_secret;
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(jwt_secret),
        )
        .unwrap();

        let result = verify_session_token(&token, &config);
        assert!(result.is_err());
    }

    #[test]
    fn test_verify_api_key_hash() {
        use crate::crypto::hash_api_key_hex;

        let api_key = b"test_api_key_12345678901234567890";
        let correct_hash = hash_api_key_hex(api_key);

        assert!(verify_api_key_hash_precomputed(None, api_key, &correct_hash).is_ok());
        assert!(verify_api_key_hash_precomputed(None, api_key, "wrong_hash").is_err());
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip_with_hkdf() {
        let config = test_config();
        let api_key = b"test_api_key_32_bytes_exactly_ok";

        let encrypted = encrypt_api_key_for_jwt(api_key, &config).unwrap();
        let decrypted = decrypt_api_key_from_jwt(&encrypted, &config).unwrap();

        assert_eq!(
            decrypted, api_key,
            "Roundtrip encryption/decryption must preserve API key"
        );
    }

    #[test]
    fn test_different_session_secrets_produce_different_ciphertexts() {
        let api_key = b"test_api_key_32_bytes_exactly_ok";

        let config1 = test_config();
        let mut config2 = config1.clone();
        config2.session_secret = b"different_session_secret_32bytes".to_vec();

        let encrypted1 = encrypt_api_key_for_jwt(api_key, &config1).unwrap();
        let encrypted2 = encrypt_api_key_for_jwt(api_key, &config2).unwrap();

        assert_ne!(
            encrypted1, encrypted2,
            "Different session secrets must produce different ciphertexts"
        );

        assert!(decrypt_api_key_from_jwt(&encrypted1, &config1).is_ok());
        assert!(decrypt_api_key_from_jwt(&encrypted2, &config2).is_ok());
        assert!(decrypt_api_key_from_jwt(&encrypted1, &config2).is_err());
        assert!(decrypt_api_key_from_jwt(&encrypted2, &config1).is_err());
    }

    #[test]
    fn test_session_secret_rotation_invalidates_tokens() {
        let config_old = test_config();
        let api_key = b"test_api_key_32_bytes_exactly_ok";

        let encrypted = encrypt_api_key_for_jwt(api_key, &config_old).unwrap();

        let mut config_new = config_old.clone();
        config_new.session_secret = b"rotated_session_secret_32bytes!".to_vec();

        let result = decrypt_api_key_from_jwt(&encrypted, &config_new);
        assert!(
            result.is_err(),
            "Token encrypted with old secret must fail after rotation"
        );
    }
}
