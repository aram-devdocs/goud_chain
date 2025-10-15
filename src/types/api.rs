use serde::{Deserialize, Serialize};

// ============ Account Management ============

/// Request to create a new user account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAccountRequest {
    pub metadata: Option<String>, // Optional encrypted metadata (e.g., email, username)
}

/// Response after creating an account
#[derive(Debug, Clone, Serialize)]
pub struct CreateAccountResponse {
    pub account_id: String,
    pub api_key: String, // Base64-encoded, ONLY shown once
    pub warning: String,
}

/// Request to login with API key
#[derive(Debug, Clone, Deserialize)]
pub struct LoginRequest {
    pub api_key: String,
}

/// Response after successful login
#[derive(Debug, Clone, Serialize)]
pub struct LoginResponse {
    pub session_token: String, // JWT
    pub expires_in: i64,       // Seconds
    pub account_id: String,
}

// ============ Data Operations ============

/// Request to submit data (requires API key auth)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitDataRequest {
    pub label: String,
    pub data: String,
}

impl SubmitDataRequest {
    /// Validate request size limits (DoS Protection)
    /// and input format (Injection Prevention)
    /// Checks BEFORE encryption to prevent resource exhaustion
    pub fn validate(&self) -> Result<(), crate::types::GoudChainError> {
        use crate::types::validation::{validate_json_structure, validate_label};
        use crate::types::GoudChainError;

        // Inline constants to avoid circular dependency
        const MAX_COLLECTION_SIZE_BYTES: usize = 10_000_000; // 10MB
        const MAX_LABEL_LENGTH: usize = 100;

        // Validate label format (no control characters)
        validate_label(&self.label)?;

        // Validate label length
        if self.label.len() > MAX_LABEL_LENGTH {
            return Err(GoudChainError::PayloadTooLarge {
                actual_bytes: self.label.len(),
                max_bytes: MAX_LABEL_LENGTH,
            });
        }

        // Validate JSON structure and depth
        validate_json_structure(&self.data)?;

        // Validate data size (before encryption adds overhead)
        let data_size = self.data.len();
        if data_size > MAX_COLLECTION_SIZE_BYTES {
            return Err(GoudChainError::PayloadTooLarge {
                actual_bytes: data_size,
                max_bytes: MAX_COLLECTION_SIZE_BYTES,
            });
        }

        Ok(())
    }
}

/// Response after submitting data
#[derive(Debug, Clone, Serialize)]
pub struct SubmitDataResponse {
    pub message: String,
    pub collection_id: String,
    pub block_number: u64,
}

/// Collection list item (decrypted metadata)
#[derive(Debug, Clone, Serialize)]
pub struct CollectionListItem {
    pub collection_id: String,
    pub label: String, // Decrypted
    pub created_at: i64,
    pub block_number: u64,
}

/// Response for listing collections
#[derive(Debug, Clone, Serialize)]
pub struct CollectionListResponse {
    pub collections: Vec<CollectionListItem>,
}

/// Response for decrypting a collection
#[derive(Debug, Clone, Serialize)]
pub struct DecryptCollectionResponse {
    pub collection_id: String,
    pub label: String,
    pub data: String,
    pub created_at: i64,
}

// ============ Blockchain Explorer ============

/// Peer information response
#[derive(Debug, Clone, Serialize)]
pub struct PeerInfoResponse {
    pub peers: Vec<String>,
    pub count: usize,
    pub reputation: std::collections::HashMap<String, i32>,
}

/// Generic success message response
#[derive(Debug, Clone, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

/// Generic error response
#[derive(Debug, Clone, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

// ============ Analytics & Statistics ============

/// Chain statistics response
#[derive(Debug, Clone, Serialize)]
pub struct ChainStatsResponse {
    pub total_blocks: u64,
    pub total_collections: u64,
    pub total_accounts: u64,
    pub avg_block_time_seconds: f64,
    pub validator_distribution: std::collections::HashMap<String, u64>,
}

/// Node health metrics
#[derive(Debug, Clone, Serialize)]
pub struct NodeMetricsResponse {
    pub node_id: String,
    pub chain_length: u64,
    pub peer_count: usize,
    pub latest_block_index: u64,
    pub latest_block_timestamp: i64,
    pub status: String,
    pub total_operations: u64,
    pub cache_hit_rate: f64,
    pub operations_per_second: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_submit_data_request_validation_valid() {
        let req = SubmitDataRequest {
            label: "Test Label".to_string(),
            data: r#"{"value": 42}"#.to_string(),
        };
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_submit_data_request_label_max_length() {
        // Exactly 100 characters should succeed
        let label_100 = "a".repeat(100);
        let req = SubmitDataRequest {
            label: label_100,
            data: r#"{"value": 42}"#.to_string(),
        };
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_submit_data_request_label_too_long() {
        // 101 characters should fail
        let label_101 = "a".repeat(101);
        let req = SubmitDataRequest {
            label: label_101,
            data: r#"{"value": 42}"#.to_string(),
        };
        let result = req.validate();
        assert!(result.is_err());
        match result {
            Err(crate::types::GoudChainError::PayloadTooLarge {
                actual_bytes,
                max_bytes,
            }) => {
                assert_eq!(actual_bytes, 101);
                assert_eq!(max_bytes, 100);
            }
            _ => panic!("Expected PayloadTooLarge error"),
        }
    }

    #[test]
    fn test_submit_data_request_data_max_size() {
        // 10MB exactly should succeed (using valid JSON)
        // Create a JSON string close to 10MB
        let value_str = "x".repeat(9_999_900); // Leave room for JSON structure
        let data = format!(r#"{{"data":"{}"}}"#, value_str);
        assert!(data.len() <= 10_000_000);
        let req = SubmitDataRequest {
            label: "Test".to_string(),
            data,
        };
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_submit_data_request_data_too_large() {
        // 10MB + 1 byte should fail (using valid JSON)
        let value_str = "x".repeat(10_000_000); // More than 10MB with JSON structure
        let data = format!(r#"{{"data":"{}"}}"#, value_str);
        assert!(data.len() > 10_000_000);
        let req = SubmitDataRequest {
            label: "Test".to_string(),
            data,
        };
        let result = req.validate();
        assert!(result.is_err());
        match result {
            Err(crate::types::GoudChainError::PayloadTooLarge {
                actual_bytes,
                max_bytes,
            }) => {
                assert!(actual_bytes > 10_000_000);
                assert_eq!(max_bytes, 10_000_000);
            }
            _ => panic!("Expected PayloadTooLarge error, got {:?}", result),
        }
    }

    #[test]
    fn test_payload_too_large_error_message() {
        let value_str = "x".repeat(10_000_000);
        let data = format!(r#"{{"data":"{}"}}"#, value_str);
        let req = SubmitDataRequest {
            label: "Test".to_string(),
            data,
        };
        match req.validate() {
            Err(e) => {
                let error_str = e.to_string();
                // Should contain size information
                assert!(error_str.contains("Payload too large") || error_str.contains("bytes"));
            }
            Ok(_) => panic!("Expected validation to fail"),
        }
    }
}
