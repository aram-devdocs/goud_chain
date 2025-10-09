use serde::{Deserialize, Serialize};

// ============ Account Management ============

/// Request to create a new user account
#[derive(Debug, Clone, Deserialize)]
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
#[derive(Debug, Clone, Deserialize)]
pub struct SubmitDataRequest {
    pub label: String,
    pub data: String,
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

impl ErrorResponse {
    pub fn new(error: impl ToString) -> Self {
        Self {
            error: error.to_string(),
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self)
            .unwrap_or_else(|_| r#"{"error":"Serialization failed"}"#.to_string())
    }
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
}
