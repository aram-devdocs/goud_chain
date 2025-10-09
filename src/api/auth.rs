use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use tiny_http::Request;

use crate::constants::{JWT_SECRET_DEFAULT, SESSION_EXPIRY_SECONDS};
use crate::crypto::{constant_time_compare, decode_api_key, hash_api_key, validate_api_key};
use crate::types::{GoudChainError, Result};

/// Get JWT secret from environment variable or use default for development
fn get_jwt_secret() -> Vec<u8> {
    std::env::var("JWT_SECRET")
        .map(|s| s.into_bytes())
        .unwrap_or_else(|_| JWT_SECRET_DEFAULT.to_vec())
}

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,          // Subject (account_id)
    pub api_key_hash: String, // API key hash for verification
    pub exp: i64,             // Expiration timestamp
    pub iat: i64,             // Issued at timestamp
}

/// Generate a JWT session token from API key
pub fn generate_session_token(account_id: String, api_key_hash: String) -> Result<String> {
    let now = Utc::now().timestamp();
    let claims = Claims {
        sub: account_id,
        api_key_hash,
        exp: now + SESSION_EXPIRY_SECONDS,
        iat: now,
    };

    let jwt_secret = get_jwt_secret();
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&jwt_secret),
    )
    .map_err(|e| GoudChainError::Internal(format!("JWT encoding failed: {}", e)))
}

/// Verify and decode a JWT session token
pub fn verify_session_token(token: &str) -> Result<Claims> {
    let validation = Validation::default();
    let jwt_secret = get_jwt_secret();

    decode::<Claims>(token, &DecodingKey::from_secret(&jwt_secret), &validation)
        .map(|data| data.claims)
        .map_err(|e| GoudChainError::Unauthorized(format!("Invalid token: {}", e)))
}

/// Extract API key or session token from Authorization header
pub enum AuthMethod {
    ApiKey(Vec<u8>),      // Raw API key bytes
    SessionToken(Claims), // Decoded JWT claims
}

/// Extract authentication from HTTP request
pub fn extract_auth(request: &Request) -> Result<AuthMethod> {
    // Get Authorization header
    let auth_header = request
        .headers()
        .iter()
        .find(|h| {
            h.field
                .as_str()
                .as_str()
                .eq_ignore_ascii_case("authorization")
        })
        .ok_or_else(|| GoudChainError::Unauthorized("Missing Authorization header".to_string()))?;

    let auth_value = auth_header.value.as_str();

    // Check if it's a Bearer token
    if let Some(token) = auth_value.strip_prefix("Bearer ") {
        // Try to decode as JWT first
        if let Ok(claims) = verify_session_token(token) {
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

/// Verify that the API key matches the expected hash (constant-time comparison)
pub fn verify_api_key_hash(api_key: &[u8], expected_hash: &str) -> Result<()> {
    let computed_hash = hash_api_key(api_key);

    if !constant_time_compare(&computed_hash, expected_hash) {
        return Err(GoudChainError::Unauthorized(
            "API key does not match".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_verify_token() {
        let account_id = "test-account".to_string();
        let api_key_hash = "test-hash".to_string();

        let token = generate_session_token(account_id.clone(), api_key_hash.clone()).unwrap();

        let claims = verify_session_token(&token).unwrap();
        assert_eq!(claims.sub, account_id);
        assert_eq!(claims.api_key_hash, api_key_hash);
    }

    #[test]
    fn test_expired_token() {
        let account_id = "test-account".to_string();
        let api_key_hash = "test-hash".to_string();

        // Create token that's already expired
        let claims = Claims {
            sub: account_id,
            api_key_hash,
            exp: Utc::now().timestamp() - 3600, // Expired 1 hour ago
            iat: Utc::now().timestamp() - 7200,
        };

        let jwt_secret = get_jwt_secret();
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(&jwt_secret),
        )
        .unwrap();

        let result = verify_session_token(&token);
        assert!(result.is_err());
    }

    #[test]
    fn test_verify_api_key_hash() {
        let api_key = b"test_api_key_12345678901234567890";
        let correct_hash = hash_api_key(api_key);

        assert!(verify_api_key_hash(api_key, &correct_hash).is_ok());
        assert!(verify_api_key_hash(api_key, "wrong_hash").is_err());
    }
}
