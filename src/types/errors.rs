use thiserror::Error;

/// All possible errors in the Goud Chain system
#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum GoudChainError {
    // Cryptography errors
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed: incorrect API key or corrupted data")]
    DecryptionFailed,

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Failed to decode hex: {0}")]
    HexDecodingError(#[from] hex::FromHexError),

    #[error("Failed to decode base64: {0}")]
    Base64DecodingError(#[from] base64::DecodeError),

    // Blockchain validation errors
    #[error("Invalid block hash at index {0}")]
    InvalidBlockHash(u64),

    #[error("Broken chain at block {0}: previous hash mismatch")]
    BrokenChain(u64),

    #[error("Invalid merkle root at block {0}")]
    InvalidMerkleRoot(u64),

    #[error("Block timestamp is in the future: {0}")]
    FutureTimestamp(i64),

    #[error("Block {0} timestamp is before previous block")]
    InvalidTimestamp(u64),

    #[error("Invalid validator at block {index}: expected {expected}, got {actual}")]
    InvalidValidator {
        index: u64,
        expected: String,
        actual: String,
    },

    #[error("Node {node_id} not authorized to create block {block_number}: only validator {expected_validator} can create this block (Proof of Authority)")]
    NotAuthorizedValidator {
        node_id: String,
        expected_validator: String,
        block_number: u64,
    },

    #[error("Empty blockchain: cannot get latest block")]
    EmptyBlockchain,

    #[error("No pending data to create block")]
    NoPendingData,

    // Network errors
    #[error("Failed to connect to peer: {0}")]
    PeerConnectionFailed(String),

    #[error("Failed to serialize message: {0}")]
    SerializationError(String),

    #[error("Failed to deserialize message: {0}")]
    DeserializationError(String),

    // Storage errors
    #[error("Failed to save blockchain to disk: {0}")]
    SaveFailed(String),

    #[error("Failed to load blockchain from disk: {0}")]
    LoadFailed(String),

    #[error("Failed to create data directory: {0}")]
    DirectoryCreationFailed(String),

    // RocksDB errors
    #[error("RocksDB operation failed: {0}")]
    RocksDbError(String),

    #[error("Key not found: {0}")]
    KeyNotFound(String),

    // API errors
    #[error("Invalid request body: {0}")]
    InvalidRequestBody(String),

    #[error("Data not found: {0}")]
    DataNotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    // Rate limiting errors (Phase 3 - DoS Protection)
    #[error(
        "Rate limit exceeded: {retry_after} seconds until reset (violation #{violation_count})"
    )]
    RateLimitExceeded {
        retry_after: u64,
        violation_count: u32,
    },

    #[error("API key banned ({ban_level}): expires at {expires_at}")]
    ApiKeyBanned { ban_level: String, expires_at: i64 },

    #[error("IP address banned: expires at {expires_at}")]
    IpAddressBanned { expires_at: i64 },

    // Size limit errors (P3-002 - DoS Protection)
    #[error("Payload too large: {actual_bytes} bytes (max: {max_bytes} bytes)")]
    PayloadTooLarge {
        actual_bytes: usize,
        max_bytes: usize,
    },

    // Input validation errors (P3-004 - Injection Prevention)
    #[error("Invalid label: {0}")]
    InvalidLabel(String),

    #[error("Invalid JSON: {0}")]
    InvalidJson(String),

    #[error("JSON too deep: maximum {max_depth} levels allowed")]
    JsonTooDeep { max_depth: usize },

    // Request signing errors (P3-003 - Replay Attack Prevention)
    #[error("Signature verification failed: {0}")]
    InvalidRequestSignature(String),

    #[error("Replay attack detected: nonce already used")]
    NonceReused,

    #[error("Request timestamp expired (older than 5 minutes)")]
    RequestExpired,

    // Configuration errors
    #[error("Configuration error: {0}")]
    ConfigError(String),

    // Audit logging errors (Phase 4)
    #[error("Audit log operation failed: {0}")]
    AuditLogError(String),

    // General errors
    #[error("Internal error: {0}")]
    Internal(String),

    #[error("UTF-8 conversion error: {0}")]
    Utf8Error(#[from] std::string::FromUtf8Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Result type alias for Goud Chain operations
pub type Result<T> = std::result::Result<T, GoudChainError>;

/// HTTP status code mapping for errors
impl GoudChainError {
    pub fn status_code(&self) -> u16 {
        match self {
            Self::InvalidRequestBody(_)
            | Self::InvalidLabel(_)
            | Self::InvalidJson(_)
            | Self::JsonTooDeep { .. } => 400,
            Self::Unauthorized(_)
            | Self::DecryptionFailed
            | Self::InvalidRequestSignature(_)
            | Self::NonceReused
            | Self::RequestExpired => 401,
            Self::DataNotFound(_) | Self::KeyNotFound(_) => 404,
            Self::PayloadTooLarge { .. } => 413,
            Self::InvalidSignature
            | Self::InvalidBlockHash(_)
            | Self::BrokenChain(_)
            | Self::InvalidMerkleRoot(_)
            | Self::FutureTimestamp(_)
            | Self::InvalidTimestamp(_)
            | Self::InvalidValidator { .. }
            | Self::NotAuthorizedValidator { .. } => 422,
            Self::RateLimitExceeded { .. }
            | Self::ApiKeyBanned { .. }
            | Self::IpAddressBanned { .. } => 429,
            _ => 500,
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::json!({
            "error": self.to_string()
        })
        .to_string()
    }
}
