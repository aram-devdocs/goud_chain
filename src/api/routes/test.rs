//! Test endpoint to demonstrate replay protection functionality.
//! Layer 5: Presentation - Test API endpoint with replay protection

use axum::{extract::Extension, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::request_signature::SignedRequest;
use crate::storage::NonceStore;
use crate::types::Result;

pub const TEST_TAG: &str = "Test";

/// Test routes (for demonstration/testing only)
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(test_signed_request))
}

/// Test request payload
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct TestRequest {
    /// Test message
    #[schema(example = "Hello, World!")]
    pub message: String,
}

/// Test response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct TestResponse {
    /// Success message
    pub message: String,
    /// Echo of the original message
    pub echo: String,
}

/// Test endpoint with replay protection
///
/// Demonstrates the SignedRequest replay protection mechanism.
/// This endpoint validates nonce uniqueness and timestamp freshness.
#[utoipa::path(
    post,
    path = "/test/signed",
    tag = TEST_TAG,
    request_body = SignedRequest<TestRequest>,
    responses(
        (status = 200, description = "Request validated successfully", body = TestResponse),
        (status = 401, description = "Authentication failed (replay detected or invalid signature)")
    )
)]
async fn test_signed_request(
    Extension(nonce_store): Extension<Arc<NonceStore>>,
    Json(signed_request): Json<SignedRequest<TestRequest>>,
) -> Result<impl IntoResponse> {
    // Validate the signed request (checks nonce, timestamp, and signature)
    signed_request.validate(&nonce_store)?;

    // Process the validated request
    let response = TestResponse {
        message: "Request validated successfully - replay protection active".to_string(),
        echo: signed_request.payload.message.clone(),
    };

    Ok((StatusCode::OK, Json(response)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{generate_signing_key, get_public_key_hex, sign_message};
    use chrono::Utc;
    use rocksdb::{Options, DB};

    fn create_test_nonce_store() -> Arc<NonceStore> {
        let path = format!("/tmp/goud_test_endpoint_{}", rand::random::<u64>());
        let mut opts = Options::default();
        opts.create_if_missing(true);
        let db = Arc::new(DB::open(&opts, path).unwrap());
        Arc::new(NonceStore::new(db))
    }

    #[tokio::test]
    async fn test_endpoint_validates_signed_request() {
        let nonce_store = create_test_nonce_store();
        let payload = TestRequest {
            message: "test message".to_string(),
        };

        let nonce = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();
        let signing_key = generate_signing_key();
        let public_key = get_public_key_hex(&signing_key);

        // Create canonical message
        let payload_json = serde_json::to_string(&payload).unwrap();
        let canonical_message = format!("{}{}{}", payload_json, nonce, timestamp);
        let signature = sign_message(canonical_message.as_bytes(), &signing_key);

        let signed_request = SignedRequest {
            payload,
            nonce,
            timestamp,
            signature,
            public_key,
        };

        // Should validate successfully
        assert!(signed_request.validate(&nonce_store).is_ok());

        // Replay should fail
        assert!(signed_request.validate(&nonce_store).is_err());
    }
}
