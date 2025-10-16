//! Request signature validation with replay protection.
//! Layer 5: Presentation - API request validation with replay protection.
//!
//! **Security Features:**
//! - Ed25519 signature verification
//! - Nonce-based replay protection (5-minute expiration)
//! - Timestamp validation for request freshness
//! - Generic error messages to prevent information leakage

use chrono::Utc;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::constants::REQUEST_TIMESTAMP_TOLERANCE_SECONDS;
use crate::crypto::verify_signature;
use crate::storage::NonceStore;
use crate::types::{GoudChainError, Result};

/// Signed request wrapper for replay-protected operations
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SignedRequest<T> {
    /// Request payload (serialized as canonical JSON)
    pub payload: T,

    /// Unique nonce for replay protection (UUID v4 recommended)
    #[schema(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub nonce: String,

    /// Request timestamp (Unix timestamp in seconds)
    #[schema(example = 1705318200)]
    pub timestamp: i64,

    /// Ed25519 signature of the canonical message
    /// Signature computed over: payload_json + nonce + timestamp
    #[schema(example = "a1b2c3d4e5f6...")]
    pub signature: String,

    /// Public key for signature verification (hex-encoded Ed25519 public key)
    #[schema(example = "a1b2c3d4e5f6...")]
    pub public_key: String,
}

impl<T: Serialize> SignedRequest<T> {
    /// Construct the canonical message for signature verification
    /// Format: {payload_json}{nonce}{timestamp}
    #[allow(dead_code)] // Used internally by validate() method
    fn canonical_message(&self) -> Result<String> {
        // Serialize payload to canonical JSON (deterministic)
        let payload_json = serde_json::to_string(&self.payload).map_err(|e| {
            GoudChainError::InvalidJson(format!("Payload serialization failed: {}", e))
        })?;

        // Construct canonical message
        Ok(format!("{}{}{}", payload_json, self.nonce, self.timestamp))
    }

    /// Validate request signature with nonce and timestamp checks
    #[allow(dead_code)] // Public API for endpoint integration (not yet used)
    pub fn validate(&self, nonce_store: &NonceStore) -> Result<()> {
        // 1. Validate timestamp (request freshness)
        validate_request_timestamp(self.timestamp)?;

        // 2. Check nonce (replay protection)
        if nonce_store.is_nonce_used(&self.nonce)? {
            // Generic error to prevent information leakage
            return Err(GoudChainError::AuthenticationFailed);
        }

        // 3. Verify signature
        let canonical_message = self.canonical_message()?;
        verify_signature(
            canonical_message.as_bytes(),
            &self.signature,
            &self.public_key,
        )
        .map_err(|_| GoudChainError::AuthenticationFailed)?; // Generic error

        // 4. Record nonce (prevent replay)
        nonce_store.record_nonce(&self.nonce)?;

        Ok(())
    }
}

/// Validate request timestamp is within acceptable window
#[allow(dead_code)] // Public API for endpoint integration (not yet used)
pub fn validate_request_timestamp(timestamp: i64) -> Result<()> {
    let now = Utc::now().timestamp();
    let age = now - timestamp;

    // Check if request is too old (older than 5 minutes)
    if age > REQUEST_TIMESTAMP_TOLERANCE_SECONDS {
        return Err(GoudChainError::AuthenticationFailed); // Generic error
    }

    // Check if request is from the future (clock skew protection)
    if age < -REQUEST_TIMESTAMP_TOLERANCE_SECONDS {
        return Err(GoudChainError::AuthenticationFailed); // Generic error
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{generate_signing_key, get_public_key_hex, sign_message};
    use rocksdb::{Options, DB};
    use std::sync::Arc;

    fn create_test_nonce_store() -> NonceStore {
        let path = format!("/tmp/goud_request_sig_test_{}", rand::random::<u64>());
        let mut opts = Options::default();
        opts.create_if_missing(true);
        let db = Arc::new(DB::open(&opts, path).unwrap());
        NonceStore::new(db)
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    struct TestPayload {
        data: String,
    }

    fn create_signed_request(
        payload: TestPayload,
        nonce: String,
        timestamp: i64,
    ) -> SignedRequest<TestPayload> {
        let signing_key = generate_signing_key();
        let public_key = get_public_key_hex(&signing_key);

        // Create canonical message
        let payload_json = serde_json::to_string(&payload).unwrap();
        let canonical_message = format!("{}{}{}", payload_json, nonce, timestamp);

        // Sign message
        let signature = sign_message(canonical_message.as_bytes(), &signing_key);

        SignedRequest {
            payload,
            nonce,
            timestamp,
            signature,
            public_key,
        }
    }

    #[test]
    fn test_valid_signed_request() {
        let nonce_store = create_test_nonce_store();
        let payload = TestPayload {
            data: "test data".to_string(),
        };
        let nonce = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();

        let request = create_signed_request(payload, nonce, timestamp);

        // Should validate successfully
        assert!(request.validate(&nonce_store).is_ok());
    }

    #[test]
    fn test_replay_attack_detection() {
        let nonce_store = create_test_nonce_store();
        let payload = TestPayload {
            data: "test data".to_string(),
        };
        let nonce = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();

        let request = create_signed_request(payload, nonce, timestamp);

        // First request should succeed
        assert!(request.validate(&nonce_store).is_ok());

        // Replay should fail (same nonce)
        let result = request.validate(&nonce_store);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            GoudChainError::AuthenticationFailed
        ));
    }

    #[test]
    fn test_expired_timestamp() {
        let nonce_store = create_test_nonce_store();
        let payload = TestPayload {
            data: "test data".to_string(),
        };
        let nonce = uuid::Uuid::new_v4().to_string();
        let old_timestamp = Utc::now().timestamp() - 600; // 10 minutes ago

        let request = create_signed_request(payload, nonce, old_timestamp);

        // Should fail due to expired timestamp
        let result = request.validate(&nonce_store);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            GoudChainError::AuthenticationFailed
        ));
    }

    #[test]
    fn test_future_timestamp() {
        let nonce_store = create_test_nonce_store();
        let payload = TestPayload {
            data: "test data".to_string(),
        };
        let nonce = uuid::Uuid::new_v4().to_string();
        let future_timestamp = Utc::now().timestamp() + 600; // 10 minutes in future

        let request = create_signed_request(payload, nonce, future_timestamp);

        // Should fail due to future timestamp
        let result = request.validate(&nonce_store);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            GoudChainError::AuthenticationFailed
        ));
    }

    #[test]
    fn test_invalid_signature() {
        let nonce_store = create_test_nonce_store();
        let payload = TestPayload {
            data: "test data".to_string(),
        };
        let nonce = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();

        let mut request = create_signed_request(payload, nonce, timestamp);

        // Tamper with signature
        request.signature = "invalid_signature_hex".to_string();

        // Should fail due to invalid signature
        let result = request.validate(&nonce_store);
        assert!(result.is_err());
    }

    #[test]
    fn test_multiple_unique_requests() {
        let nonce_store = create_test_nonce_store();

        for i in 0..5 {
            let payload = TestPayload {
                data: format!("test data {}", i),
            };
            let nonce = uuid::Uuid::new_v4().to_string();
            let timestamp = Utc::now().timestamp();

            let request = create_signed_request(payload, nonce, timestamp);

            // Each request should validate successfully
            assert!(request.validate(&nonce_store).is_ok());
        }
    }

    #[test]
    fn test_canonical_message_format() {
        let payload = TestPayload {
            data: "test".to_string(),
        };
        let nonce = "test-nonce".to_string();
        let timestamp = 1705318200i64;

        let signing_key = generate_signing_key();
        let public_key = get_public_key_hex(&signing_key);

        let request = SignedRequest {
            payload,
            nonce,
            timestamp,
            signature: "placeholder".to_string(),
            public_key,
        };

        let canonical = request.canonical_message().unwrap();

        // Verify format: {payload_json}{nonce}{timestamp}
        assert!(canonical.contains("test-nonce"));
        assert!(canonical.contains("1705318200"));
        assert!(canonical.starts_with("{"));
    }
}
