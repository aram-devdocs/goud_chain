use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use utoipa::{IntoParams, ToSchema};

use crate::api::WebSocketBroadcaster;
use crate::storage::AuditLogger;

// ========== SHARED STATE ==========

/// Shared state for handlers that need audit logging and WebSocket broadcasting
#[derive(Clone)]
pub struct SubmitDataState {
    pub audit_logger: Arc<AuditLogger>,
    pub ws_broadcaster: Arc<WebSocketBroadcaster>,
}

// ========== REQUEST SCHEMAS ==========

/// Account creation request
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreateAccountRequest {
    /// Optional account metadata (any valid JSON structure)
    #[schema(example = json!({"username": "alice", "email": "alice@example.com"}))]
    pub metadata: Option<serde_json::Value>,
}

/// Login request with API key
#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct LoginRequest {
    /// API key obtained during account creation (base64-encoded)
    #[schema(example = "Z291ZF9hYmMxMjM0NTY3ODkw")]
    pub api_key: String,
}

/// Data submission request
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SubmitDataRequest {
    /// Human-readable label for the collection (max 100 characters)
    #[schema(example = "medical-records", min_length = 1, max_length = 100)]
    pub label: String,

    /// Plaintext data to encrypt and store (max 10MB, must be valid JSON string)
    #[schema(example = r#"{"diagnosis": "healthy", "date": "2025-01-15"}"#)]
    pub data: String,
}

impl SubmitDataRequest {
    /// Validate request size limits and input format (DoS Protection)
    pub fn validate(&self) -> crate::types::Result<()> {
        use crate::types::validation::{validate_json_structure, validate_label};
        use crate::types::GoudChainError;

        const MAX_COLLECTION_SIZE_BYTES: usize = 10_000_000; // 10MB
        const MAX_LABEL_LENGTH: usize = 100;

        validate_label(&self.label)?;

        if self.label.len() > MAX_LABEL_LENGTH {
            return Err(GoudChainError::PayloadTooLarge {
                actual_bytes: self.label.len(),
                max_bytes: MAX_LABEL_LENGTH,
            });
        }

        validate_json_structure(&self.data)?;

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

// ========== RESPONSE SCHEMAS ==========

/// Standard message response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct MessageResponse {
    /// Response message
    #[schema(example = "Operation successful")]
    pub message: String,
}

/// Health check response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct HealthCheckResponse {
    /// Node health status
    #[schema(example = "healthy")]
    pub status: String,

    /// Node identifier
    #[schema(example = "node1")]
    pub node_id: String,

    /// Total blocks in blockchain
    #[schema(example = 42)]
    pub chain_length: usize,

    /// Number of connected P2P peers
    #[schema(example = 2)]
    pub peer_count: usize,

    /// Latest block index
    #[schema(example = 41)]
    pub latest_block: u64,
}

/// Account creation response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CreateAccountResponse {
    /// Account ID (SHA-256 hash of API key)
    #[schema(example = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8")]
    pub account_id: String,

    /// API key (base64-encoded, shown only once - store securely)
    #[schema(example = "Z291ZF9hYmMxMjM0NTY3ODkw")]
    pub api_key: String,

    /// Security warning message
    #[schema(
        example = "SAVE THIS API KEY SECURELY. It cannot be recovered and provides full access to your data."
    )]
    pub warning: String,
}

/// Login response with session token
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct LoginResponse {
    /// JWT session token (expires in 1 hour)
    #[schema(example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")]
    pub session_token: String,

    /// Token expiration time in seconds
    #[schema(example = 3600)]
    pub expires_in: i64,

    /// Account ID
    #[schema(example = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8")]
    pub account_id: String,
}

/// Data submission response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct SubmitDataResponse {
    /// Success message
    pub message: String,

    /// Generated collection ID (UUID v4)
    #[schema(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub collection_id: String,

    /// Block number where data was stored
    #[schema(example = 42)]
    pub block_number: u64,
}

/// Collection list item (metadata only, no decrypted data)
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CollectionListItem {
    /// Collection ID
    #[schema(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub collection_id: String,

    /// Decrypted label
    #[schema(example = "medical-records")]
    pub label: String,

    /// Creation timestamp (Unix timestamp)
    #[schema(example = 1705318200)]
    pub created_at: i64,

    /// Block number where collection was created
    #[schema(example = 42)]
    pub block_number: u64,
}

/// Collection list response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct CollectionListResponse {
    /// List of user's encrypted collections (metadata only)
    pub collections: Vec<CollectionListItem>,
}

/// Decrypted collection response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct DecryptCollectionResponse {
    /// Collection ID
    #[schema(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub collection_id: String,

    /// Decrypted label
    #[schema(example = "medical-records")]
    pub label: String,

    /// Decrypted data (JSON string)
    #[schema(example = r#"{"diagnosis": "healthy", "date": "2025-01-15"}"#)]
    pub data: String,

    /// Creation timestamp (Unix timestamp)
    #[schema(example = 1705318200)]
    pub created_at: i64,
}

/// Peer information response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct PeerInfoResponse {
    /// List of connected peer addresses (P2P endpoints, not HTTP)
    #[schema(example = json!(["node2:9000", "node3:9000"]))]
    pub peers: Vec<String>,

    /// Number of connected peers
    #[schema(example = 2)]
    pub count: usize,

    /// Peer reputation scores (positive = trusted, negative = suspicious)
    #[schema(example = json!({"node2:9000": 10, "node3:9000": 5}))]
    pub reputation: HashMap<String, i32>,
}

/// Chain statistics response
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ChainStatsResponse {
    /// Total number of blocks in the chain
    #[schema(example = 100)]
    pub total_blocks: u64,

    /// Total number of encrypted collections
    #[schema(example = 42)]
    pub total_collections: u64,

    /// Total number of user accounts
    #[schema(example = 15)]
    pub total_accounts: u64,

    /// Average block creation time in seconds
    #[schema(example = 2.5)]
    pub avg_block_time_seconds: f64,

    /// Block distribution by validator (node_id -> block_count)
    #[schema(example = json!({"node1": 50, "node2": 30, "node3": 20}))]
    pub validator_distribution: HashMap<String, u64>,
}

/// Node performance metrics
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct NodeMetricsResponse {
    /// Node identifier
    #[schema(example = "node1")]
    pub node_id: String,

    /// Total blocks in chain
    #[schema(example = 100)]
    pub chain_length: u64,

    /// Number of connected P2P peers
    #[schema(example = 2)]
    pub peer_count: usize,

    /// Latest block index
    #[schema(example = 99)]
    pub latest_block_index: u64,

    /// Latest block timestamp (Unix timestamp)
    #[schema(example = 1705318200)]
    pub latest_block_timestamp: i64,

    /// Node health status
    #[schema(example = "healthy")]
    pub status: String,

    /// Total operations processed (accounts + collections)
    #[schema(example = 200)]
    pub total_operations: u64,

    /// Merkle tree cache hit rate (0.0 - 1.0)
    #[schema(example = 0.85)]
    pub cache_hit_rate: f64,

    /// Operations processed per second (placeholder)
    #[schema(example = 0.0)]
    pub operations_per_second: f64,
}

/// API error response
#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    /// Error message
    #[schema(example = "Invalid API key")]
    pub error: String,
}

// ========== QUERY PARAMETERS ==========

/// Audit log query parameters
#[derive(Debug, Deserialize, IntoParams)]
pub struct AuditLogQuery {
    /// Filter by event type
    #[param(example = "DataSubmitted")]
    pub event_type: Option<String>,

    /// Filter by collection ID
    #[param(example = "550e8400-e29b-41d4-a716-446655440000")]
    #[allow(dead_code)] // Field exists for future filtering support
    pub collection_id: Option<String>,

    /// Start timestamp (Unix timestamp)
    #[param(example = 1705318200)]
    pub start_ts: Option<i64>,

    /// End timestamp (Unix timestamp)
    #[param(example = 1705404600)]
    pub end_ts: Option<i64>,

    /// Page number (zero-indexed)
    #[param(example = 0, minimum = 0)]
    pub page: Option<usize>,

    /// Page size (1-100)
    #[param(example = 50, minimum = 1, maximum = 100)]
    pub page_size: Option<usize>,
}
